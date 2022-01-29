import { EventEmitter } from '../Events.js';
export class C32Controller {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        this.hasCompleted = false;
        this._data = data;
        this.link = link;
        this.getTaskList();
    }
    get data() { return this._data; }
    get tasks() { return this._tasks; }
    get complete() { return (this._tasks != null); }
    updateData(data) {
        const taskListModified = (data.taskCount != this._data.taskCount || data.taskList != this._data.taskList);
        this._data = data;
        this.events.emit('dataUpdated');
        if (taskListModified)
            this.getTaskList();
    }
    requestData() { this.link.requestInfo(1 /* CONTROLLER_INFO */, 0); }
    getTaskList() {
        this.link.requestMemData(this._data.taskList, this._data.taskCount, 5 /* uint32 */, taskList => {
            this._tasks = taskList;
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete');
                this.hasCompleted = true;
            }
            let callbackCounter = 0;
            taskList.forEach(pointer => this.link.requestInfo(2 /* TASK_INFO */, pointer, () => {
                if (++callbackCounter == this._tasks.length)
                    this.events.emit('tasklistLoaded');
            }));
        });
    }
}
