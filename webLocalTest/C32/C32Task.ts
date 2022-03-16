import { EventEmitter } from '../Events.js';
import { DataType, StructValues } from '../TypedStructs.js';
import { C32DataLink } from './C32DataLink.js';
import { ITaskOnlineData, MsgTaskInfo_t, MSG_TYPE } from './C32Types.js';

export class C32Task implements ITaskOnlineData {

    get data()          { return this._data }
    get funcList()      { return this._funcList }

    get isComplete()    { return (this._funcList != null) }
    get index()         { return this.link.controller.taskList.findIndex(taskPtr => taskPtr = this.data.pointer) }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed' | 'dataUpdated' | 'funcListLoaded'>(this)
    
    requestData() { this.link.requestInfo(MSG_TYPE.TASK_INFO, this.data.pointer) }

    updateData(data: StructValues<typeof MsgTaskInfo_t>) {
        const funcListModified = ( data.funcCount != this._data.funcCount || data.funcList != this._data.funcList )

        this._data = data
        this.events.emit('dataUpdated')

        if (funcListModified) this.getFuncList()
    }

    remove() { this.events.emit('removed') }

    constructor(data: StructValues<typeof MsgTaskInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link
        this.getFuncList()
    }

    protected _data:       StructValues<typeof MsgTaskInfo_t>
    protected _funcList:   number[]

    protected wasCompleted = false

    protected getFuncList() {
        this.link.requestMemData(this._data.funcList, this._data.funcCount, DataType.uint32, funcList => {
            this._funcList = funcList
            
            this.checkCompleteness()

            let callbackCounter = 0
            funcList.forEach(pointer => this.link.requestInfo(MSG_TYPE.CIRCUIT_INFO, pointer, () => {
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