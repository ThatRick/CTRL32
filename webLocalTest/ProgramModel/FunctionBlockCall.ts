import { EventEmitter } from "../Events.js"
import { CircuitSource } from "./CircuitSource.js"
import { FunctionLibrary } from "./FunctionLib.js"
import { ICircuitSource, IFunctionBlockCall } from "./IDataTypes.js"
import { ProgramSource } from "./Program.js"

export class FunctionBlockCall
{
    data: IFunctionBlockCall

    parentCircuit: CircuitSource

    events = new EventEmitter<typeof this, 'inputAdded' | 'inputRemoved' | 'inputValueModified' | 'outputValueModified' | 'removed'>(this)

    constructor(parentCircuit: CircuitSource, data: IFunctionBlockCall)
    {
        this.parentCircuit = parentCircuit
        this.data = data
    }

    static FromOpcode(parentCircuit: CircuitSource, opcode: number) {
        const funcType = FunctionLibrary.getFunctionByOpcode(opcode)
        return new FunctionBlockCall(parentCircuit, {
            id:             parentCircuit.getNewFunctionID(),
            opcode:         opcode,
            inputValues:    funcType.inputs.map(input => input.initValue),
            outputValues:   funcType.outputs.map(output => output.initValue),
            circuitType:    undefined,
        })
    }

    static FromCircuitSource(parentCircuit: CircuitSource, source: ICircuitSource) {
        return new FunctionBlockCall(parentCircuit, {
            id:             parentCircuit.getNewFunctionID(),
            opcode:         0,
            inputValues:    source.inputs.map(input => input.initValue),
            outputValues:   source.outputs.map(output => output.initValue),
            circuitType:    source.name,
        })
    }

    inputAdd(value: number) {
        this.data.inputValues.push(value)
        this.events.emit('inputAdded')
    }

    inputRemove() {
        this.data.inputValues.pop()
        this.events.emit('inputRemoved')
    }

    inputSetValue(index: number, value: number) {
        this.data.inputValues[index] = value
        this.events.emit('inputValueModified', index)
    }

    remove() {
        this.events.emit('removed')
        this.events.clear()
    }
}