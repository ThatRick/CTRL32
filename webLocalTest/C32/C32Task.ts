import { EventEmitter } from "../Events.js";
import { DataType, StructValues } from "../TypedStructs.js";
import { C32DataLink } from "./C32DataLink.js";
import { ITask, MsgTaskInfo_t, MSG_TYPE } from "./C32Types.js";

export class C32Task implements ITask {

    get data()      { return this._data }
    get circuits()  { return this._circuits }
    get complete()  { return (this._circuits != null) }

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed'>(this)

    constructor(data: StructValues<typeof MsgTaskInfo_t>, link: C32DataLink) {
        link.requestMemData(data.circuitList, data.circuitCount, DataType.uint32, circuitList => {
            this._circuits = circuitList
            if (this.complete) this.events.emit('complete')
            circuitList.forEach(pointer => link.requestInfo(MSG_TYPE.CIRCUIT_INFO, pointer))
        })
    }

    remove() {
        this.events.emit('removed')
    }

    protected _data:       StructValues<typeof MsgTaskInfo_t>
    protected _circuits:   number[]
    protected _complete:   boolean
}