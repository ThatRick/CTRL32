import { EventEmitter } from '../Events.js';
export class C32Controller {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.wasCompleted = false;
        this._data = data;
        this.link = link;
        this.getTaskList();
        this.getFuncList();
    }
    get data() { return this._data; }
    get taskList() { return this._tasks; }
    get funcList() { return this._funcList; }
    get isComplete() { return (this._tasks != null && this._funcList != null); }
    requestData() { this.link.requestInfo(1 /* CONTROLLER_INFO */, 0); }
    updateData(data) {
        const taskListModified = (data.taskCount != this._data.taskCount || data.taskList != this._data.taskList);
        const funcListModified = (data.funcCount != this._data.funcCount || data.funcList != this._data.funcList);
        this._data = data;
        this.events.emit('dataUpdated');
        if (taskListModified)
            this.getTaskList();
        if (funcListModified)
            this.getFuncList();
    }
    getTaskList() {
        this.link.requestMemData(this._data.taskList, this._data.taskCount, 5 /* uint32 */, taskList => {
            this._tasks = taskList;
            this.checkCompleteness();
            let callbackCounter = 0;
            taskList.forEach(pointer => this.link.requestInfo(2 /* TASK_INFO */, pointer, () => {
                if (++callbackCounter == this._tasks.length)
                    this.events.emit('taskListLoaded');
            }));
        });
    }
    getFuncList() {
        this.link.requestMemData(this._data.funcList, this._data.funcCount, 5 /* uint32 */, funcList => {
            this._funcList = funcList;
            this.checkCompleteness();
            let callbackCounter = 0;
            funcList.forEach(pointer => this.link.requestInfo(4 /* FUNCTION_INFO */, pointer, () => {
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
