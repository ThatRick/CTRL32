import { EventEmitter } from "../Events.js";
import { readTypedValues } from "../TypedStructs.js";
import { IO_FLAG_TYPE_MASK, IO_TYPE_MAP } from './C32Types.js';
export class C32Function {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.hasCompleted = false;
        this._data = data;
        this.link = link;
        this.requestIO();
        this.requestName();
    }
    get data() { return this._data; }
    get ioValues() { return this._ioValues; }
    get ioFlags() { return this._ioFlags; }
    get name() { return this._name; }
    get complete() { return (this._ioValues != null && this._ioFlags != null && this._name != null); }
    get circuit() { return this._circuit; }
    get index() { return this._circuit.funcList.findIndex(call => call == this.data.pointer); }
    setCircuit(circuit) { this._circuit = circuit; }
    setMonitoringValues(values) {
        this._monitoringValues = values;
        this.events.emit('monitoringValuesUpdated');
    }
    get monitoringValues() { return this._monitoringValues; }
    updateData(data) {
        const ioModified = (data.ioValueList != this._data.ioValueList || data.ioFlagList != this._data.ioFlagList || data.numInputs + data.numOutputs != this._data.numInputs + this._data.numOutputs);
        this._data = data;
        this.events.emit('dataUpdated');
        if (ioModified)
            this.requestIO();
    }
    requestData() { this.link.requestInfo(3 /* CIRCUIT_INFO */, this.data.pointer); }
    remove() {
        this.events.emit('removed');
    }
    // Protected members
    requestIO() {
        const ioCount = this.data.numInputs + this.data.numOutputs;
        this.link.requestMemData(this.data.ioFlagList, ioCount, 1 /* uint8 */, ioFlags => {
            this._ioFlags = ioFlags;
            this.link.requestMemData(this.data.ioValueList, ioCount, 5 /* uint32 */, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & 16 /* REF */) ? 5 /* uint32 */ : IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
                this._ioValues = readTypedValues(data, dataTypes);
                this.events.emit('ioLoaded');
                if (!this.hasCompleted && this.complete) {
                    this.events.emit('complete');
                    this.hasCompleted = true;
                }
            });
        });
    }
    requestName() {
        this.link.requestMemData(this.data.namePtr, this.data.nameLength, 1 /* uint8 */, (_, data) => {
            this._name = new TextDecoder().decode(data);
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete');
                this.hasCompleted = true;
            }
        });
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
