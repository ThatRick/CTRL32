# CTRL32 Runtime System Overview

This document summarizes how the embedded runtime executes control logic in `src/CTRL`.

## 1) Top-level runtime flow

At startup, `main.cpp` creates the core runtime objects:
- `Controller` (global runtime state for tasks + top-level function list)
- `Link` (binary request/response protocol and monitoring transport)
- `FunctionFactory` (function-block creation)

A FreeRTOS task (`ControllerLoop`) then runs continuously. On each loop iteration it:
1. Ticks the controller scheduler (`controller->tick()`),
2. Processes queued link packets (`commLink->processData()`),
3. Delays until the nearest next scheduled task update.

This means scheduling and command handling share one deterministic control loop.

## 2) Scheduling model (`Controller` + `CyclicTask`)

### Controller
`Controller` owns:
- `tasks`: all cyclic execution tasks,
- `funcList`: controller-level function blocks/circuits,
- runtime counters + platform telemetry helpers.

`Controller::tick()` calls `tick()` on every `CyclicTask` and returns the minimum next-update timestamp. The loop uses that value to choose sleep duration.

### CyclicTask timing
Each `CyclicTask` is configured by:
- `interval_ms`: period,
- `offset_ms`: phase offset,
- `running` state,
- internal `baseTimer` used to align updates to period boundaries.

`CyclicTask::start()` aligns `baseTimer` to the current interval boundary so offset remains stable regardless of start moment.

`CyclicTask::tick()`:
- returns `UINT64_MAX` if task is stopped,
- runs `update()` once the next update time is reached,
- tracks drift (`drift_us`) and advances `baseTimer` forward until the schedule is in the future.

`update()` executes all attached function blocks with the configured `interval_ms` and records runtime statistics:
- last + cumulative CPU time,
- last + cumulative actual interval,
- run count and averages.

## 3) Function execution model (`FunctionBlock`)

`FunctionBlock` is the common runtime abstraction for all executable blocks (including circuits).

Important behaviors:
- Inputs/outputs are stored as typed `IOValue`s.
- Inputs can be constants or references to another block's output (`IO_FLAG_REF`).
- `connectInput()` sets reference flags and calculates conversion mode when source/output types differ.
- `readInputValue(s)` dereferences references and applies conversion/inversion rules.
- `disconnectInput()` removes reference semantics while preserving current value.

This allows blocks to form a dataflow graph while still supporting mixed integer/float/bool/time wiring.

## 4) Circuits as composite function blocks (`Circuit`)

`Circuit` derives from `FunctionBlock` and acts as a container/composite node:
- `funcList`: internal execution-ordered block list,
- `outputRefs`: pointers that map circuit outputs to internal block outputs.

`Circuit::run()` updates internal functions sequentially, then copies any connected output references into circuit outputs.

`removeFunction()` performs graph cleanup:
1. Disconnects any internal inputs that reference the removed block,
2. Clears circuit output references that point into the removed block,
3. Removes the block from `funcList`.

`reorderFunction()` swaps a function to a new execution index (bounded by list size).

## 5) Runtime communication (`Link`)

`Link` is the runtime command endpoint used by WebSocket callbacks in `main.cpp`.

Flow:
- Incoming binary frames are queued by `receiveData()`.
- The controller loop calls `processData()`, which consumes packets and dispatches `handleRequest()`.
- `handleRequest()` routes by `MESSAGE_TYPE` to inspect objects, mutate task/circuit/function state, and configure monitoring.
- Responses are emitted through `sendConfirmation()` / `sendResponse()` callbacks.

The request model uses a lightweight pointer-based addressing strategy (`pointer` field in message headers), with range checks (`ADDRESS_MIN/ADDRESS_MAX`) before dereferencing.

## 6) Monitoring path

Monitoring is block-centric:
- Blocks can enable/disable monitoring flags.
- `Link` maintains a monitored-function set.
- During reporting, blocks provide captured IO snapshots via `reportMonitoringValues()`.
- `Link` batches items with `monitoringCollectionStart/Send/End` to reduce transport overhead.

## 7) Practical mental model

You can think of CTRL32 runtime as:
- **Scheduler layer**: `Controller` + `CyclicTask`
- **Execution layer**: `FunctionBlock` (atomic) and `Circuit` (composite)
- **Control plane**: `Link` request/response + monitoring stream

All three layers are integrated by the single controller loop in `main.cpp`, which keeps execution cadence and remote control in sync.
