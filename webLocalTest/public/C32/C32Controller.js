import { EventEmitter } from '../Events.js';
export class C32Controller {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        // Get task list
        link.requestMemData(data.taskList, data.taskCount, 5 /* uint32 */, taskList => {
            this._tasks = taskList;
            if (this.complete)
                this.events.emit('complete');
            taskList.forEach(pointer => link.requestInfo(2 /* TASK_INFO */, pointer));
        });
        this._data = data;
        this._link = link;
    }
    get data() { return this._data; }
    get tasks() { return this._tasks; }
    get complete() { return (this._tasks != null); }
}
