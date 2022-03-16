import { EventEmitter } from "../Events.js";
import { getFunctionType } from "./FunctionLib/FunctionLib.js";
export class FunctionBlockCall {
    constructor(parentCircuit, data) {
        this.events = new EventEmitter(this);
        this.parentCircuit = parentCircuit;
        this.data = data;
    }
    static FromOpcode(parentCircuit, opcode) {
        const funcType = getFunctionType(opcode);
        return new FunctionBlockCall(parentCircuit, {
            id: parentCircuit.getNewFunctionID(),
            opcode: opcode,
            inputValues: funcType.inputs.map(input => input.initValue),
            outputValues: funcType.outputs.map(output => output.initValue),
            circuitType: undefined,
        });
    }
    static FromCircuitSource(parentCircuit, source) {
        return new FunctionBlockCall(parentCircuit, {
            id: parentCircuit.getNewFunctionID(),
            opcode: 0,
            inputValues: source.inputs.map(input => input.initValue),
            outputValues: source.outputs.map(output => output.initValue),
            circuitType: source.name,
        });
    }
    inputAdd(value) {
        this.data.inputValues.push(value);
        this.events.emit('inputAdded');
    }
    inputRemove() {
        this.data.inputValues.pop();
        this.events.emit('inputRemoved');
    }
    inputSetValue(index, value) {
        this.data.inputValues[index] = value;
        this.events.emit('inputValueModified', index);
    }
    remove() {
        this.events.emit('removed');
        this.events.clear();
    }
}
