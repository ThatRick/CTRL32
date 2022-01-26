import { EventEmitter } from '../Events.js'
import { DataType, StructValues } from '../TypedStructs.js'
import { C32DataLink } from './C32DataLink.js'
import { ICircuit, MsgCircuitInfo_t, MSG_TYPE } from './C32Types.js'

export class C32Circuit implements ICircuit {

    get data()          { return this._data }
    get funcCalls()     { return this._funcCalls }
    get outputRefs()    { return this._outputRefs }
    get complete()      { return (this._funcCalls != null && this._outputRefs != null) }

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed'>(this)

    constructor(data: StructValues<typeof MsgCircuitInfo_t>, link: C32DataLink) {

        link.requestMemData(data.funcList, data.funcCount, DataType.uint32, funcList => {
            this._funcCalls = funcList
            if (this.complete) this.events.emit('complete')
            funcList.forEach(pointer => link.requestInfo(MSG_TYPE.FUNCTION_INFO, pointer))
        })

        if (!link.functionBlocks.has(data.pointer)) link.requestInfo(MSG_TYPE.FUNCTION_INFO, data.pointer, () => {
            this.requestOutputRefs()
        })
        else this.requestOutputRefs()

        this._data = data
        this._link = link
    }

    remove() {
        this.events.emit('removed')
    }

    protected requestOutputRefs() {
        const funcData = this._link.functionBlocks.get(this._data.pointer)?.data
        if (funcData) {
            this._link.requestMemData(this._data.outputRefList, funcData.numOutputs, DataType.uint32, outputRefs => {
                this._outputRefs = outputRefs
                if (this.complete) this.events.emit('complete')
            })
        }
    }

    protected _link:       C32DataLink
    protected _data:       StructValues<typeof MsgCircuitInfo_t>
    protected _funcCalls:  number[]
    protected _outputRefs: number[]
    protected _complete:   boolean
}