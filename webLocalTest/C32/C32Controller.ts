import { EventEmitter } from '../Events.js'
import { DataType, StructValues } from '../TypedStructs.js'
import { C32DataLink } from './C32DataLink.js'
import { IControllerOnlineData, MsgControllerInfo_t, MSG_TYPE } from './C32Types.js'

export class C32Controller implements IControllerOnlineData {

    get data()       { return this._data }
    get taskList()   { return this._tasks }
    get funcList()   { return this._funcList }
    get isComplete() { return (this._tasks != null && this._funcList != null) }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'dataUpdated' | 'taskListLoaded' | 'funcListLoaded'>(this)

    requestData() { this.link.requestInfo(MSG_TYPE.CONTROLLER_INFO, 0) }

    updateData(data: StructValues<typeof MsgControllerInfo_t>) {
        const taskListModified = ( data.taskCount != this._data.taskCount || data.taskList != this._data.taskList )
        const funcListModified = ( data.funcCount != this._data.funcCount || data.funcList != this._data.funcList )

        this._data = data
        this.events.emit('dataUpdated')

        if (taskListModified) this.getTaskList()
        if (funcListModified) this.getFuncList()
    }

    constructor(data: StructValues<typeof MsgControllerInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link
        this.getTaskList()
        this.getFuncList()
    }

    protected _data:        StructValues<typeof MsgControllerInfo_t>
    protected _tasks:       number[]
    protected _funcList:    number[]

    protected wasCompleted = false

    protected getTaskList() {
        this.link.requestMemData(this._data.taskList, this._data.taskCount, DataType.uint32, taskList => {
            this._tasks = taskList
            
            this.checkCompleteness()
            let callbackCounter = 0
            taskList.forEach(pointer => this.link.requestInfo(MSG_TYPE.TASK_INFO, pointer, () => {
                if (++callbackCounter == this._tasks.length) this.events.emit('taskListLoaded')
            }))
        })
    }
    protected getFuncList() {
        this.link.requestMemData(this._data.funcList, this._data.funcCount, DataType.uint32, funcList => {
            this._funcList = funcList
            
            this.checkCompleteness()
            let callbackCounter = 0
            funcList.forEach(pointer => this.link.requestInfo(MSG_TYPE.FUNCTION_INFO, pointer, () => {
                if (++callbackCounter == this._funcList.length) this.events.emit('funcListLoaded')
            }))
        })
    }
    protected checkCompleteness() {
        if (this.isComplete && !this.wasCompleted) {
            this.wasCompleted = true
            this.events.emit('complete')
        }
    }
}