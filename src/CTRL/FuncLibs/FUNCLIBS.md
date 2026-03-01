# Function Block Libraries

All blocks are created through the `FunctionFactory` by library ID and function ID:

```cpp
FunctionFactory factory;
FunctionBlock* block = factory.createFunction(libraryId, functionId, numInputs);
```

Variable-arity blocks (ADD, MUL, AND, OR, XOR) accept a `numInputs` parameter (minimum 2).
Fixed blocks ignore it.

---

## Logic (Library ID: 1)

Boolean logic gates. All I/O uses the `BOOL` type (0 or 1 as `uint32_t`).

| Block | Inputs | Outputs | Description |
|-------|--------|---------|-------------|
| **AND** | N (variable, min 2) | 1 | True if all inputs are true |
| **OR** | N (variable, min 2) | 1 | True if any input is true |
| **XOR** | N (variable, min 2) | 1 | True if exactly one input is true |
| **NOT** | 1 | 1 | Boolean inversion |
| **RS** | 2: R, S | 1 | Reset-dominant latch. R=high resets, S=high sets. Both high: resets |
| **SR** | 2: S, R | 1 | Set-dominant latch. S=high sets, R=high resets. Both high: sets |
| **RisingEdge** | 1 | 1 | Pulse on 0-to-1 transition. Output is high for one cycle |
| **FallingEdge** | 1 | 1 | Pulse on 1-to-0 transition. Output is high for one cycle |

### Default values

| Block | Input defaults | Output default |
|-------|---------------|----------------|
| AND | all true | true |
| OR | all false | false |
| XOR | all false | false |
| NOT | false | true |
| RS | R=false, S=false | false |
| SR | S=false, R=false | false |
| RisingEdge | false | false |
| FallingEdge | true | false |

---

## Math — float (Library ID: 2)

Floating-point arithmetic and trigonometry. All I/O uses the `FLOAT` type.

| Block | Inputs | Outputs | Description |
|-------|--------|---------|-------------|
| **ADD** | N (variable, min 2) | 1 | Sum of all inputs |
| **SUB** | 2 | 1 | `in[0] - in[1]` |
| **MUL** | N (variable, min 2) | 1 | Product of all inputs |
| **DIV** | 2 | 1 | `in[0] / in[1]`. Division by zero is a no-op (output unchanged) |
| **ABS** | 1 | 1 | Absolute value |
| **SIN** | 1 | 1 | Sine (radians) |
| **COS** | 1 | 1 | Cosine (radians) |
| **POW** | 2 | 1 | `in[0] ^ in[1]` |
| **SQRT** | 1 | 1 | Square root |

### Default values

| Block | Input defaults | Output default |
|-------|---------------|----------------|
| ADD | all 0.0 | 0.0 |
| SUB | all 0.0 | 0.0 |
| MUL | all 1.0 | 1.0 |
| DIV | 0.0, 1.0 | 0.0 |
| ABS | 0.0 | 0.0 |
| SIN | 0.0 | 0.0 |
| COS | 0.0 | 0.0 |
| POW | 1.0, 1.0 | 1.0 |
| SQRT | 1.0 | 1.0 |

---

## Math Int — int32 (Library ID: 3)

Signed 32-bit integer arithmetic. All I/O uses the `INT` type.

| Block | Inputs | Outputs | Description |
|-------|--------|---------|-------------|
| **ADD** | N (variable, min 2) | 1 | Sum of all inputs |
| **SUB** | 2 | 1 | `in[0] - in[1]` |
| **MUL** | N (variable, min 2) | 1 | Product of all inputs |
| **DIV** | 2 | 1 | `in[0] / in[1]`. Division by zero is a no-op |
| **ABS** | 1 | 1 | Absolute value |

### Default values

| Block | Input defaults | Output default |
|-------|---------------|----------------|
| ADD | all 0 | 0 |
| SUB | all 0 | 0 |
| MUL | all 1 | 1 |
| DIV | 0, 1 | 0 |
| ABS | 0 | 0 |

---

## Math Uint — uint32 (Library ID: 4)

Unsigned 32-bit integer arithmetic. All I/O uses the `UINT` type.

| Block | Inputs | Outputs | Description |
|-------|--------|---------|-------------|
| **ADD** | N (variable, min 2) | 1 | Sum of all inputs |
| **SUB** | 2 | 1 | `in[0] - in[1]` (unsigned wrapping) |
| **MUL** | N (variable, min 2) | 1 | Product of all inputs |
| **DIV** | 2 | 1 | `in[0] / in[1]`. Division by zero is a no-op |

### Default values

| Block | Input defaults | Output default |
|-------|---------------|----------------|
| ADD | all 0 | 0 |
| SUB | all 0 | 0 |
| MUL | all 1 | 1 |
| DIV | 0, 1 | 0 |

---

## Timers (Library ID: 5)

Time-based blocks. Use the `dt` parameter passed to `update()` for time tracking.

| Block | Inputs | Outputs | Description |
|-------|--------|---------|-------------|
| **OnDelay** | 3: signal, delay_ms, reset | 2: out, remaining_ms | Delays a rising edge. Output goes high after signal has been high for `delay_ms` continuously |
| **OffDelay** | 3: signal, delay_ms, reset | 2: out, remaining_ms | Delays a falling edge. Output stays high for `delay_ms` after signal goes low |

### OnDelay behavior

```
signal:  ____/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\____
out:     ________/‾‾‾‾‾‾‾‾‾‾‾‾\____
              ^delay_ms^
```

- Signal goes high: timer starts counting down from `delay_ms`
- Timer expires while signal still high: output goes high
- Signal goes low at any time: output goes low immediately, timer resets
- Reset input: forces output to follow signal immediately, clears timer

### OffDelay behavior

```
signal:  ‾‾‾‾\________________/‾‾‾‾
out:     ‾‾‾‾‾‾‾‾‾\___________/‾‾‾‾
              ^delay_ms^
```

- Signal goes low: timer starts counting down from `delay_ms`
- Timer expires while signal still low: output goes low
- Signal goes high at any time: output goes high immediately, timer resets
- Reset input: forces output to follow signal immediately, clears timer

### Default values

| Block | Input defaults | Output defaults |
|-------|---------------|-----------------|
| OnDelay | signal=false, delay=5000ms, reset=false | out=false, remaining=0 |
| OffDelay | signal=true, delay=5000ms, reset=false | out=true, remaining=0 |
