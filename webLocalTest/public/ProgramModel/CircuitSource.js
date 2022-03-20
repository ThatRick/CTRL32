import { EventEmitter } from "../Events.js";
import { FunctionLibrary } from "./FunctionLib/FunctionLib.js";
export class CircuitSource {
    constructor(program, data) {
        this.events = new EventEmitter(this);
        this.program = program;
        if (data) {
            Object.assign(this.source, data);
        }
        else {
            this.source = {
                name: '',
                inputs: [],
                outputs: [],
                functionCalls: [],
                connections: [],
                editorMetaData: {
                    functionsCalls: [],
                    connections: []
                }
            };
        }
    }
    remove() {
        this.events.emit('removed');
        this.events.clear();
    }
    // @ts-ignore
    get data() { return structuredClone(this.source); }
    getNewFunctionID() {
        let maxID = 0;
        this.source.functionCalls.forEach(funcCall => maxID = Math.max(maxID, funcCall.id));
        return maxID + 1;
    }
    getNewConnectionID() {
        let maxID = 0;
        this.source.connections.forEach(conn => maxID = Math.max(maxID, conn.id));
        return maxID + 1;
    }
    addFunctionCall(funcCall, index) {
        if (this.source.functionCalls.find(item => item.id == funcCall.id)) {
            console.error('CircuitSource - addFunctionCall failed: duplicate ID given', index);
            return false;
        }
        if (index === undefined || index < 0 || index >= this.source.functionCalls.length) {
            this.source.functionCalls.push(funcCall);
        }
        else {
            this.source.functionCalls.splice(index, 0, funcCall);
        }
        this.events.emit('functionCallAdded', funcCall.id);
        return true;
    }
    createFunctionCallWithOpcode(opcode) {
        const funcType = FunctionLibrary.getFunctionByOpcode(opcode);
        if (!funcType) {
            console.error('CircuitSource - createFunctionCallWithOpcode failed: opcode not found', opcode);
        }
        return this.addFunctionCall({
            id: this.getNewFunctionID(),
            opcode: opcode,
            inputValues: funcType.inputs.map(input => input.initValue),
            outputValues: funcType.outputs.map(output => output.initValue),
            circuitType: undefined,
        });
    }
    createFunctionCallWithCircuitType(circuitTypeName) {
        const circuitType = this.program.getCircuitType(circuitTypeName);
        if (!circuitType) {
            console.error('CircuitSource - createFunctionCallWithCircuitType failed: circuit type not found', circuitTypeName);
        }
        return this.addFunctionCall({
            id: this.getNewFunctionID(),
            opcode: 0,
            inputValues: circuitType.inputs.map(input => input.initValue),
            outputValues: circuitType.outputs.map(output => output.initValue),
            circuitType: circuitType.name,
        });
    }
    getFunctionCall(funcID) {
        return this.source.functionCalls.find(func => func.id == funcID);
    }
    getFunctionCallIndex(funcID) {
        return this.source.functionCalls.findIndex(func => func.id == funcID);
    }
    setFunctionCallIndex(funcID, newIndex) {
        if (newIndex < 0 || newIndex >= this.source.functionCalls.length) {
            console.error('CircuitSource - setFunctionCallIndex failed: call index out of range', newIndex);
            return false;
        }
        const functionCall = this.getFunctionCall(funcID);
        const currentIndex = this.getFunctionCallIndex(funcID);
        const funcCalls = this.source.functionCalls;
        funcCalls.splice(currentIndex, 1);
        funcCalls.splice(newIndex, 0, functionCall);
        this.events.emit('callOrderModified');
        return true;
    }
    removeFunctionCall(id) {
        if (undefined == this.source.functionCalls.find(item => item.id == id)) {
            console.error('CircuitSource - removeFunctionCall failed: ID not found');
            return false;
        }
        this.source.functionCalls = this.source.functionCalls.filter(funcCall => funcCall.id != id);
        this.events.emit('functionCallRemoved', id);
        this.removeConnectionsWithFunctionID(id);
        return true;
    }
    addConnection(connection) {
        if (this.source.connections.find(conn => conn.id == connection.id)) {
            console.error('CircuitSource - addConnection failed: duplicate ID given');
            return false;
        }
        const targetBlock = this.source.functionCalls.find(func => func.id == connection.targetBlock);
        if (!targetBlock) {
            console.error('CircuitSource - addConnection failed: invalid target block ID given');
            return false;
        }
        if (connection.targetIO < 0 || connection.targetIO >= targetBlock.inputValues.length + targetBlock.outputValues.length) {
            console.error('CircuitSource - addConnection failed: invalid target IO-number given');
            return false;
        }
        const sourceBlock = this.source.functionCalls.find(func => func.id == connection.sourceBlock);
        if (!sourceBlock) {
            console.error('CircuitSource - addConnection failed: invalid source block ID given');
            return false;
        }
        if (connection.sourceIO < 0 || connection.sourceIO >= sourceBlock.inputValues.length + sourceBlock.outputValues.length) {
            console.error('CircuitSource - addConnection failed: invalid source IO-number given');
            return false;
        }
        this.source.connections.push(connection);
        this.events.emit('connectionAdded', connection.id);
        return true;
    }
    createConnection(connection) {
        return this.addConnection({
            id: this.getNewConnectionID(),
            ...connection
        });
    }
    removeConnection(connectionID) {
        if (undefined == this.source.connections.find(conn => conn.id == connectionID)) {
            console.error('CircuitSource - removeConnection failed: ID not found');
            return false;
        }
        this.source.connections = this.source.connections.filter(conn => conn.id != connectionID);
        this.events.emit('connectionRemoved', connectionID);
        return true;
    }
    removeConnectionsWithFunctionID(funcID) {
        const connectionsToRemove = this.source.connections.filter(conn => conn.sourceBlock == funcID || conn.targetBlock == funcID);
        this.source.connections = this.source.connections.filter(conn => !connectionsToRemove.includes(conn));
        connectionsToRemove.forEach(conn => this.events.emit('connectionRemoved', conn.id));
    }
}
