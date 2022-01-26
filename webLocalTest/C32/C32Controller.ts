import { EventEmitter } from '../Events.js'
import { DataType, StructValues } from '../TypedStructs.js'
import { C32DataLink } from './C32DataLink.js'
import { IController, MsgControllerInfo_t, MSG_TYPE } from './C32Types.js'

export class C32Controller implements IController {

    get data()      { return this._data }
    get tasks()     { return this._tasks }
    get complete()  { return (this._tasks != null) }

    readonly events = new EventEmitter<typeof this, 'complete'>(this)

    constructor(data: StructValues<typeof MsgControllerInfo_t>, link: C32DataLink) {
        // Get task list
        link.requestMemData(data.taskList, data.taskCount, DataType.uint32, taskList => {
            this._tasks = taskList
            if (this.complete) this.events.emit('complete')
            taskList.forEach(pointer => link.requestInfo(MSG_TYPE.TASK_INFO, pointer))
        })
        this._data = data
        this._link = link
    }

    protected _link:       C32DataLink

    protected _data:       StructValues<typeof MsgControllerInfo_t>
    protected _tasks:      number[]
    protected _complete:   boolean

}