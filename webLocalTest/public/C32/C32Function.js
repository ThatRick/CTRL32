import { EventEmitter } from "../Events.js";
import { readTypedValues } from "../TypedStructs.js";
import { IO_FLAG_TYPE_MASK, IO_TYPE_MAP } from './C32Types.js';
export class C32Function {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.wasCompleted = false;
        this._data = data;
        this.link = link;
        this.requestIOData();
        this.requestName();
        if (this.isCircuit) {
            this.link.requestInfo(3 /* CIRCUIT_INFO */, this.data.pointer, () => {
                this._circuit = this.link.circuits.get(this._data.pointer);
                this.events.emit('circuitLoaded');
            });
        }
    }
    get data() { return this._data; }
    get ioValues() { return this._ioValues; }
    get ioFlags() { return this._ioFlags; }
    get name() { return this._name; }
    get isComplete() { return (this._ioValues != null && this._ioFlags != null && this._name != null); }
    get isCircuit() { return this._data.opcode == 0; }
    get parentCircuit() { return this._parentCircuit; }
    get callOrder() { return this._parentCircuit?.funcList.findIndex(funcPtr => funcPtr == this.data.pointer); }
    get task() {
        for (const [taskPtr, task] of this.link.tasks) {
            if (task.funcList.includes(this.data.pointer))
                return task;
        }
        return null;
    }
    get monitoringValues() { return this._monitoringValues; }
    setParentCircuit(parent) { this._parentCircuit = parent; }
    setMonitoringValues(values) {
        this._monitoringValues = values;
        this.events.emit('monitoringValuesUpdated');
    }
    requestData() { this.link.requestInfo(4 /* FUNCTION_INFO */, this.data.pointer); }
    updateData(data) {
        const ioModified = (data.ioValueList != this._data.ioValueList || data.ioFlagList != this._data.ioFlagList || data.numInputs + data.numOutputs != this._data.numInputs + this._data.numOutputs);
        this._data = data;
        this.events.emit('dataUpdated');
        if (ioModified)
            this.requestIOData();
    }
    remove() {
        this.events.emit('removed');
    }
    requestIOData() {
        const ioCount = this.data.numInputs + this.data.numOutputs;
        this.link.requestMemData(this.data.ioFlagList, ioCount, 1 /* uint8 */, ioFlags => {
            this._ioFlags = ioFlags;
            this.link.requestMemData(this.data.ioValueList, ioCount, 5 /* uint32 */, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & 16 /* REF */) ? 5 /* uint32 */ : IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
                this._ioValues = readTypedValues(data, dataTypes);
                this.events.emit('ioDataLoaded');
                this.checkCompleteness();
            });
        });
    }
    requestName() {
        this.link.requestMemData(this.data.namePtr, this.data.nameLength, 1 /* uint8 */, (_, data) => {
            this._name = new TextDecoder().decode(data);
            this.checkCompleteness();
        });
    }
    checkCompleteness() {
        if (!this.wasCompleted && this.isComplete) {
            this.wasCompleted = true;
            this.events.emit('complete');
        }
    }
}
/*
MsgFunctionInfo_t = {
    pointer:            DataType.uint32,
    numInputs:          DataType.uint8,
    numOutputs:         DataType.uint8,
    opcode:             DataType.uint16,
    flags:              DataType.uint32,
    ioValueList:        DataType.uint32,
    ioFlagList:         DataType.uint32,
    nameLength:         DataType.uint32,
    namePtr:            DataType.uint32,
*/ 
