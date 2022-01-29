import { EventEmitter } from '../Events.js';
export class C32Task {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.hasCompleted = false;
        this._data = data;
        this.link = link;
        this.getCircuitList();
    }
    get data() { return this._data; }
    get circuits() { return this._circuits; }
    get complete() { return (this._circuits != null); }
    get index() { return [...this.link.tasks.values()].findIndex(task => task == this); }
    updateData(data) {
        const circuitListModified = (data.circuitCount != this._data.circuitCount || data.circuitList != this._data.circuitList);
        this._data = data;
        this.events.emit('dataUpdated');
        if (circuitListModified)
            this.getCircuitList();
    }
    requestData() { this.link.requestInfo(2 /* TASK_INFO */, this.data.pointer); }
    remove() { this.events.emit('removed'); }
    getCircuitList() {
        this.link.requestMemData(this._data.circuitList, this._data.circuitCount, 5 /* uint32 */, circuitList => {
            this._circuits = circuitList;
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete');
                this.hasCompleted = true;
            }
            let callbackCounter = 0;
            circuitList.forEach(pointer => this.link.requestInfo(3 /* CIRCUIT_INFO */, pointer, () => {
                this.link.circuits.get(pointer)?.setTask(this);
                if (++callbackCounter == this._circuits.length)
                    this.events.emit('callListLoaded');
            }));
        });
    }
}
