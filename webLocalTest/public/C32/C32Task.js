import { EventEmitter } from '../Events.js';
export class C32Task {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        link.requestMemData(data.circuitList, data.circuitCount, 5 /* uint32 */, circuitList => {
            this._circuits = circuitList;
            if (this.complete)
                this.events.emit('complete');
            circuitList.forEach(pointer => link.requestInfo(3 /* CIRCUIT_INFO */, pointer));
        });
    }
    get data() { return this._data; }
    get circuits() { return this._circuits; }
    get complete() { return (this._circuits != null); }
    remove() {
        this.events.emit('removed');
    }
}
