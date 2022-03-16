import { EventEmitter } from '../Events.js';
export class C32Task {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.wasCompleted = false;
        this._data = data;
        this.link = link;
        this.getFuncList();
    }
    get data() { return this._data; }
    get funcList() { return this._funcList; }
    get isComplete() { return (this._funcList != null); }
    get index() { return this.link.controller.taskList.findIndex(taskPtr => taskPtr = this.data.pointer); }
    requestData() { this.link.requestInfo(2 /* TASK_INFO */, this.data.pointer); }
    updateData(data) {
        const funcListModified = (data.funcCount != this._data.funcCount || data.funcList != this._data.funcList);
        this._data = data;
        this.events.emit('dataUpdated');
        if (funcListModified)
            this.getFuncList();
    }
    remove() { this.events.emit('removed'); }
    getFuncList() {
        this.link.requestMemData(this._data.funcList, this._data.funcCount, 5 /* uint32 */, funcList => {
            this._funcList = funcList;
            this.checkCompleteness();
            let callbackCounter = 0;
            funcList.forEach(pointer => this.link.requestInfo(3 /* CIRCUIT_INFO */, pointer, () => {
                if (++callbackCounter == this._funcList.length)
                    this.events.emit('funcListLoaded');
            }));
        });
    }
    checkCompleteness() {
        if (this.isComplete && !this.wasCompleted) {
            this.wasCompleted = true;
            this.events.emit('complete');
        }
    }
}
