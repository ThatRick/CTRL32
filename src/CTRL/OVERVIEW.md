# CTRL Runtime System Overview

CTRL is a dataflow runtime for the ESP32 microcontroller. It executes networks of **function blocks** on deterministic cyclic schedules, connected by typed signal links. An external client (e.g. a visual editor running in a browser) can create, wire, monitor and control the live system over a binary WebSocket protocol.

## Architecture

```
Controller
├── CyclicTask[]            periodic schedulers
│   └── FunctionBlock[]     blocks executed each cycle
├── FunctionBlock[]         registry of all top-level blocks
└── Link                    WebSocket communication endpoint

FunctionBlock (base class)
├── concrete blocks         AND, ADD, OnDelay, …
└── Circuit                 composite block containing other blocks
```

## Core components

### FunctionBlock (`FunctionBlock.h/cpp`)

The base class for every computation unit. A block has a fixed number of typed inputs and outputs, stored in a single contiguous `IOValue` array:

```
ioValues:  [ input₀ … inputₙ | output₀ … outputₘ ]
ioFlags:   [ flags₀ … flagsₙ | flags₀  … flagsₘ  ]
```

`IOValue` is a 4-byte union of `uint32_t`, `int32_t`, `float`, and `IOValue*` (reference pointer). Each I/O port carries a type flag (`BOOL`, `INT`, `UINT`, `FLOAT`, `TIME`).

Every cycle the block's `update(dt)` method:

1. Reads and dereferences all inputs (following reference pointers, applying type conversions and optional boolean inversion).
2. Calls the virtual `run(inputs, outputs, dt)` with the resolved input values and a direct pointer to the output slots.
3. Copies I/O values into a monitoring snapshot buffer, if monitoring is enabled.

Hot-path methods (`update`, `inputValue`, `readInputValues`, `reportMonitoringValues`) are marked `IRAM_ATTR` for placement in ESP32 instruction RAM.

### Connections

Connections between blocks are direct memory references. When `connectInput(inputNum, sourceFunc, outputNum)` is called:

- The input slot stores a pointer to the source block's output slot (`IO_FLAG_REF`).
- The required type conversion is auto-detected from the I/O type flags and encoded in the input's flag byte (`IO_CONV_UNSIGNED`, `IO_CONV_SIGNED`, `IO_CONV_FLOAT`).
- An optional `IO_FLAG_REF_INVERT` flag provides boolean inversion at the connection.

At read time the pointer is dereferenced, the value is converted if needed, and inversion is applied. Disconnecting an input snapshots the current dereferenced value back into the slot and clears the reference flags.

### Circuit (`Circuit.h/cpp`)

A `Circuit` is a `FunctionBlock` subclass (opcode `0`) that contains an ordered list of child blocks. Its `run()` calls `update()` on each child in list order, then copies selected internal outputs to its own output ports via `outputRefs[]` pointers.

Circuits own their children — the destructor deletes all contained blocks. Removing a child automatically disconnects any references to its outputs, both from sibling inputs and from circuit output mappings.

### CyclicTask (`CyclicTask.h/cpp`)

A periodic scheduler that drives block execution at a fixed interval with an optional phase offset.

**Timing algorithm:** The task maintains a `baseTimer` aligned to multiples of the interval. On each `tick()` it checks whether `now >= baseTimer + offset`. If the deadline has passed, it advances `baseTimer` by whole intervals until the next deadline is in the future, records the drift, and runs `update()`. This catches up cleanly after missed cycles.

`tick()` returns the next scheduled time so the Controller can compute the optimal sleep duration.

**Statistics tracked:** run count, last and cumulative CPU time, last and cumulative actual interval, drift in microseconds. Moving averages are available via `averageCPUTime()` and `averageActualInterval_ms()`.

### Controller (`Controller.h/cpp`)

The top-level runtime object. Maintains the master list of all function blocks and all cyclic tasks.

`tick()` iterates over every task, calls `task->tick()`, and returns the earliest next-update time across all tasks. The caller (main loop) can use this to sleep the MCU until the next deadline.

`addFunction(func, task)` registers a block and optionally assigns it to a task. `removeFunction(func)` disconnects all references pointing to that block's outputs across the entire block registry and all tasks.

Hardware queries: `freeHeap()`, `cpuFreq()`, `getTime()` (microsecond `esp_timer`), `getRSSI()`.

### Link (`Link.h/cpp`)

Binary request/response protocol for remote control and monitoring over WebSocket.

**Message format:**
- Request: `{ msgType, msgID, pointer }` + optional payload
- Response: `{ msgType, msgID, result, timeStamp }` + optional payload

Objects are addressed by their raw memory pointer cast to `uint32_t` (validated against the ESP32 address range `0x3F400000`–`0x50002000`).

**Capabilities:**
- **Query** controller, task, circuit and function info
- **Create/delete** tasks, circuits and functions (via `FunctionFactory`)
- **Modify** task scheduling (interval, offset, start/stop), circuit structure (add/remove/reorder children, connect outputs), and function I/O (set values, set flags, connect/disconnect inputs)
- **Raw memory** read/write (`GET_MEM_DATA`, `SET_MEM_DATA`)
- **Monitoring** — enable per-block telemetry; the Link batches all monitored blocks' I/O snapshots into a single collection message sent at a configurable interval (default 500 ms)

Thread safety: incoming WebSocket data is pushed into a lock-free `FIFOBuffer` (atomic head/tail ring buffer) and processed on the main thread via `processData()`.

### FunctionFactory & Libraries (`FunctionFactory.h`, `FunctionLib.h`, `FuncLibs/`)

Functions are identified by a 16-bit opcode: `(libraryID << 8) | functionID`. The factory dispatches creation to the matching `FunctionLibrary` subclass.

| Library | ID | Functions |
|---------|----|-----------|
| **Logic**    | 1 | AND, OR, XOR, NOT, RS, SR, RisingEdge, FallingEdge |
| **Math**     | 2 | ADD, SUB, MUL, DIV, ABS, SIN, COS, POW, SQRT (float) |
| **MathInt**  | 3 | ADD, SUB, MUL, DIV, ABS (int32) |
| **MathUint** | 4 | ADD, SUB, MUL, DIV (uint32) |
| **Timers**   | 5 | OnDelay, OffDelay, (Pulse stub) |

Variable-arity blocks (AND, OR, XOR, ADD, MUL) accept a configurable input count at creation time.

### FIFO (`FIFO.h`)

A single-producer/single-consumer lock-free ring buffer using `std::atomic` indices. Used by `Link` to queue incoming WebSocket messages for processing on the main thread.

## Execution flow

```
main loop
  └─ Controller::tick()
       └─ for each CyclicTask
            └─ CyclicTask::tick()
                 ├─ check timing → advance baseTimer
                 └─ CyclicTask::update()
                      └─ for each FunctionBlock
                           └─ FunctionBlock::update(dt)
                                ├─ readInputValues()  — dereference, convert, invert
                                ├─ run()              — virtual dispatch to concrete logic
                                └─ copy to monitoringValues (if enabled)
```

## Memory layout

- Each `FunctionBlock` allocates one contiguous `IOValue[]` array (inputs then outputs) and one `uint8_t[]` flags array of the same layout.
- `Circuit` additionally allocates an `IOValue*[]` array for output reference pointers.
- Monitoring values are allocated on demand when monitoring is enabled and freed when disabled.
- `Circuit` owns and deletes its children; the `Controller` is responsible for top-level blocks.
