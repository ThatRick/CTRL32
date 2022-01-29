import { EventEmitter } from '../Events.js';
export class C32Circuit {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.hasCompleted = false;
        this._data = data;
        this.link = link;
        this.requestFuncList();
        this.requestOutputRefList();
    }
    get data() { return this._data; }
    get funcList() { return this._funcList; }
    get outputRefs() { return this._outputRefs; }
    get complete() { return (this._funcList != null && this._outputRefs != null); }
    get task() { return this._task; }
    get index() { return this._task.circuits.findIndex(pointer => (pointer == this.data.pointer)); }
    setTask(task) { this._task = task; }
    updateData(data) {
        const funcListModified = (data.funcCount != this._data.funcCount || data.funcList != this._data.funcList);
        const outputRefListModified = (data.outputRefCount != this._data.outputRefCount || data.outputRefList != this._data.outputRefList);
        this._data = data;
        this.events.emit('dataUpdated');
        if (funcListModified)
            this.requestFuncList();
        if (outputRefListModified)
            this.requestOutputRefList();
    }
    requestData() { this.link.requestInfo(3 /* CIRCUIT_INFO */, this.data.pointer); }
    remove() { this.events.emit('removed'); }
    requestFuncList() {
        this.link.requestMemData(this.data.funcList, this.data.funcCount, 5 /* uint32 */, funcList => {
            this._funcList = funcList;
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete');
                this.hasCompleted = true;
            }
            let callbackCounter = 0;
            funcList.forEach(pointer => this.link.requestInfo(4 /* FUNCTION_INFO */, pointer, () => {
                this.link.functionBlocks.get(pointer)?.setCircuit(this);
                if (++callbackCounter == this.funcList.length)
                    this.events.emit('funcListLoaded');
            }));
        });
    }
    requestOutputRefList() {
        this.link.requestMemData(this._data.outputRefList, this._data.outputRefCount, 5 /* uint32 */, outputRefList => {
            this._outputRefs = outputRefList;
            this.events.emit('outputRefListLoaded');
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete');
                this.hasCompleted = true;
            }
        });
    }
}
