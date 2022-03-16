import { EventEmitter } from '../Events.js'
import { DataType, StructValues } from '../TypedStructs.js'
import { C32DataLink } from './C32DataLink.js'
import { ICircuitOnlineData, MsgCircuitInfo_t, MSG_TYPE } from './C32Types.js'

export class C32Circuit implements ICircuitOnlineData {

    get data()          { return this._data }
    get funcList()      { return this._funcList }
    get outputRefs()    { return this._outputRefs }

    get complete()      { return (this._funcList != null && this._outputRefs != null) }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed' | 'dataUpdated' | 'funcListLoaded' | 'outputRefListLoaded'>(this)

    updateData(data: StructValues<typeof MsgCircuitInfo_t>) {
        const funcListModified = ( data.funcCount != this._data.funcCount || data.funcList != this._data.funcList )
        const outputRefListModified = ( data.outputRefCount != this._data.outputRefCount || data.outputRefList != this._data.outputRefList )

        this._data = data
        this.events.emit('dataUpdated')

        if (funcListModified) this.requestFuncList()
        if (outputRefListModified) this.requestOutputRefList()
    }

    requestData() { this.link.requestInfo(MSG_TYPE.CIRCUIT_INFO, this.data.pointer) }

    remove() { this.events.emit('removed') }

    constructor(data: StructValues<typeof MsgCircuitInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link
        this.requestFuncList()
        this.requestOutputRefList()
    }

    protected requestFuncList() {
        this.link.requestMemData(this.data.funcList, this.data.funcCount, DataType.uint32, funcList => {
            this._funcList = funcList

            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete')
                this.hasCompleted = true
            }
            let callbackCounter = 0
            funcList.forEach(pointer => this.link.requestInfo(MSG_TYPE.FUNCTION_INFO, pointer, () => {
                this.link.functionBlocks.get(pointer)?.setParentCircuit(this)
                if (++callbackCounter == this.funcList.length) this.events.emit('funcListLoaded')
            }))
        })
    }
    protected requestOutputRefList() {
        this.link.requestMemData(this._data.outputRefList, this._data.outputRefCount, DataType.uint32, outputRefList => {
            this._outputRefs = outputRefList
            this.events.emit('outputRefListLoaded')
            if (!this.hasCompleted && this.complete) {
                this.events.emit('complete')
                this.hasCompleted = true
            }
        })
    }

    protected _data:       StructValues<typeof MsgCircuitInfo_t>
    protected _funcList:   number[]
    protected _outputRefs: number[]

    protected hasCompleted = false
}