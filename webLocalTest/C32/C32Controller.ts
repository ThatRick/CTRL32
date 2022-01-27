import { EventEmitter } from '../Events.js'
import { DataType, StructValues } from '../TypedStructs.js'
import { C32DataLink } from './C32DataLink.js'
import { IController, MsgControllerInfo_t, MSG_TYPE } from './C32Types.js'

export class C32Controller implements IController {

    get data()      { return this._data }
    get tasks()     { return this._tasks }
    get complete()  { return (this._tasks != null) }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'dataUpdated' | 'tasklistLoaded'>(this)

    updateData(data: StructValues<typeof MsgControllerInfo_t>) {
        const taskListModified = ( data.taskCount != this._data.taskCount || data.taskList != this._data.taskList )

        this._data = data
        this.events.emit('dataUpdated')

        if (taskListModified) this.getTaskList()
    }

    requestData() { this.link.requestInfo(MSG_TYPE.CONTROLLER_INFO, 0) }

    constructor(data: StructValues<typeof MsgControllerInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link
        this.getTaskList()
    }

    protected _data:       StructValues<typeof MsgControllerInfo_t>
    protected _tasks:      number[]
    protected hasCompleted = false

    protected getTaskList() {
        this.link.requestMemData(this._data.taskList, this._data.taskCount, DataType.uint32, taskList => {
            this._tasks = taskList
            this.events.emit('tasklistLoaded')
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete')
                this.hasCompleted = true
            }
            taskList.forEach(pointer => this.link.requestInfo(MSG_TYPE.TASK_INFO, pointer))
        })
    }
}