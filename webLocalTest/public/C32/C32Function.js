import { EventEmitter } from "../Events.js";
import { readTypedValues } from "../TypedStructs.js";
import { IO_FLAG_TYPE_MASK, IO_TYPE_MAP } from './C32Types.js';
export class C32Function {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        const ioCount = data.numInputs + data.numOutputs;
        link.requestMemData(data.ioFlagList, ioCount, 1 /* uint8 */, ioFlags => {
            this._ioFlags = ioFlags;
            this._link.requestMemData(data.ioValueList, ioCount, 5 /* uint32 */, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & 16 /* REF */) ? 5 /* uint32 */ : IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
                this._ioValues = readTypedValues(data, dataTypes);
                if (this.complete)
                    this.events.emit('complete');
            });
        });
        link.requestMemData(data.namePtr, data.nameLength, 1 /* uint8 */, (_, data) => {
            this._name = new TextDecoder().decode(data);
            if (this.complete)
                this.events.emit('complete');
        });
        this._data = data;
        this._link = link;
    }
    get data() { return this._data; }
    get ioValues() { return this._ioValues; }
    get ioFlags() { return this._ioFlags; }
    get name() { return this._name; }
    get complete() { return (this._ioValues != null && this._ioFlags != null && this._name != null); }
    setMonitoringValues(values) {
        this._monitoringValues = values;
        this.events.emit('monitoringValuesUpdated');
    }
    get monitoringValues() { return this._monitoringValues; }
    remove() {
        this.events.emit('removed');
    }
}
