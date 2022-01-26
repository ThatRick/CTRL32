import { EventEmitter } from "../Events.js"
import { DataType, readTypedValues, StructValues } from "../TypedStructs.js"
import { C32DataLink } from "./C32DataLink.js"
import {
    IFunctionBlock,
    IO_FLAG,
    IO_FLAG_TYPE_MASK,
    IO_TYPE_MAP,
    MsgFunctionInfo_t } from "./C32Types.js"


export class C32Function implements IFunctionBlock
{
    get data()      { return this._data }
    get ioValues()  { return this._ioValues }
    get ioFlags()   { return this._ioFlags }
    get name()      { return this._name }
    get complete()  { return ( this._ioValues != null && this._ioFlags != null  && this._name != null ) }

    readonly events = new EventEmitter<typeof this, 'complete' | 'monitoringValuesUpdated' | 'removed'>(this)

    constructor(data: StructValues<typeof MsgFunctionInfo_t>, link: C32DataLink) {
        
        const ioCount = data.numInputs + data.numOutputs
        
        link.requestMemData(data.ioFlagList, ioCount, DataType.uint8, ioFlags => {
            this._ioFlags = ioFlags
            this._link.requestMemData(data.ioValueList, ioCount, DataType.uint32, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & IO_FLAG.REF) ? DataType.uint32 : IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
                this._ioValues = readTypedValues(data, dataTypes)
                if (this.complete) this.events.emit('complete')
            })
        })
        
        link.requestMemData(data.namePtr, data.nameLength, DataType.uint8, (_, data) => {
            this._name = new TextDecoder().decode(data)
            if (this.complete) this.events.emit('complete')
        })

        this._data = data
        this._link = link
    }

    setMonitoringValues(values: number[]) {
        this._monitoringValues = values
        this.events.emit('monitoringValuesUpdated')
    }
    get monitoringValues() { return this._monitoringValues }

    remove() {
        this.events.emit('removed')
    }
    
    // Protected members

    protected _link:     C32DataLink   
    protected _data:     StructValues<typeof MsgFunctionInfo_t>
    protected _ioValues: number[]
    protected _ioFlags:  number[]
    protected _name:     string

    protected _monitoringValues: number[]

}