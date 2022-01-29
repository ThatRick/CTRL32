import { EventEmitter } from '../Events.js';
import { DataType, StructValues } from '../TypedStructs.js';
import { C32DataLink } from './C32DataLink.js';
import { ITask, MsgTaskInfo_t, MSG_TYPE } from './C32Types.js';

export class C32Task implements ITask {

    get data()      { return this._data }
    get circuits()  { return this._circuits }

    get complete()  { return (this._circuits != null) }
    get index()     { return [...this.link.tasks.values()].findIndex(task => task == this) }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed' | 'dataUpdated' | 'callListLoaded'>(this)

    updateData(data: StructValues<typeof MsgTaskInfo_t>) {
        const circuitListModified = ( data.circuitCount != this._data.circuitCount || data.circuitList != this._data.circuitList )

        this._data = data
        this.events.emit('dataUpdated')

        if (circuitListModified) this.getCircuitList()
    }

    requestData() { this.link.requestInfo(MSG_TYPE.TASK_INFO, this.data.pointer) }

    remove() { this.events.emit('removed') }

    constructor(data: StructValues<typeof MsgTaskInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link
        this.getCircuitList()
    }

    protected _data:       StructValues<typeof MsgTaskInfo_t>
    protected _circuits:   number[]
    protected hasCompleted = false

    protected getCircuitList() {
        this.link.requestMemData(this._data.circuitList, this._data.circuitCount, DataType.uint32, circuitList => {
            this._circuits = circuitList
            
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete')
                this.hasCompleted = true
            }
            let callbackCounter = 0
            circuitList.forEach(pointer => this.link.requestInfo(MSG_TYPE.CIRCUIT_INFO, pointer, () => {
                this.link.circuits.get(pointer)?.setTask(this)
                if (++callbackCounter == this._circuits.length) this.events.emit('callListLoaded')
            }))
        })
    }
}