import { EventEmitter } from "../Events.js"
import { DataType, readTypedValues, StructValues } from "../TypedStructs.js"
import { C32Circuit } from "./C32Circuit.js"
import { C32DataLink } from "./C32DataLink.js"
import {
    IFunctionBlockOnlineData,
    IO_FLAG,
    IO_FLAG_TYPE_MASK,
    IO_TYPE_MAP,
    MsgFunctionInfo_t, 
    MSG_TYPE } from './C32Types.js'


export class C32Function implements IFunctionBlockOnlineData
{
    get data()          { return this._data }
    get ioValues()      { return this._ioValues }
    get ioFlags()       { return this._ioFlags }
    get name()          { return this._name }

    get isComplete()    { return ( this._ioValues != null && this._ioFlags != null && this._name != null ) }
    get isCircuit()     { return this._data.opcode == 0 }

    get parentCircuit() { return this._parentCircuit }
    get callOrder()     { return this._parentCircuit?.funcList.findIndex(funcPtr => funcPtr == this.data.pointer) }

    get task()          {
        for (const [taskPtr, task] of this.link.tasks) {
            if (task.funcList.includes(this.data.pointer)) return task
        }
        return null
    }

    get monitoringValues() { return this._monitoringValues }

    readonly link: C32DataLink

    readonly events = new EventEmitter<typeof this, 'complete' | 'removed' | 'monitoringValuesUpdated' | 'dataUpdated' | 'ioDataLoaded' | 'circuitLoaded'>(this)

    setParentCircuit(parent: C32Circuit) { this._parentCircuit = parent }

    setMonitoringValues(values: number[]) {
        this._monitoringValues = values
        this.events.emit('monitoringValuesUpdated')
    }

    requestData() { this.link.requestInfo(MSG_TYPE.FUNCTION_INFO, this.data.pointer) }

    updateData(data: StructValues<typeof MsgFunctionInfo_t>) {
        const ioModified = ( data.ioValueList != this._data.ioValueList || data.ioFlagList != this._data.ioFlagList || data.numInputs+data.numOutputs != this._data.numInputs+this._data.numOutputs)

        this._data = data
        this.events.emit('dataUpdated')

        if (ioModified) this.requestIOData()
    }

    remove() {
        this.events.emit('removed')
    }

    constructor(data: StructValues<typeof MsgFunctionInfo_t>, link: C32DataLink) {
        this._data = data
        this.link = link

        this.requestIOData()
        this.requestName()

        if (this.isCircuit) {
            this.link.requestInfo(MSG_TYPE.CIRCUIT_INFO, this.data.pointer, () => {
                this._circuit = this.link.circuits.get(this._data.pointer)
                this.events.emit('circuitLoaded')
            })
        }
    }
    
    // Protected members

    protected _data:     StructValues<typeof MsgFunctionInfo_t>
    
    protected _ioValues: number[]
    protected _ioFlags:  number[]
    protected _name:     string
    
    protected wasCompleted = false
    protected _monitoringValues: number[]

    protected _parentCircuit:  C32Circuit
    protected _circuit:        C32Circuit

    protected requestIOData() {
        const ioCount = this.data.numInputs + this.data.numOutputs
        this.link.requestMemData(this.data.ioFlagList, ioCount, DataType.uint8, ioFlags => {
            this._ioFlags = ioFlags
            this.link.requestMemData(this.data.ioValueList, ioCount, DataType.uint32, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & IO_FLAG.REF) ? DataType.uint32 : IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
                this._ioValues = readTypedValues(data, dataTypes)
                this.events.emit('ioDataLoaded')
                this.checkCompleteness()
            })
        })
    }

    protected requestName() {
        this.link.requestMemData(this.data.namePtr, this.data.nameLength, DataType.uint8, (_, data) => {
            this._name = new TextDecoder().decode(data)
            this.checkCompleteness()
        })
    }

    protected checkCompleteness() {
        if (!this.wasCompleted && this.isComplete) {
            this.wasCompleted = true
            this.events.emit('complete')
        }
    }
}

/*
MsgFunctionInfo_t = {
    pointer:            DataType.uint32,
    numInputs:          DataType.uint8,
    numOutputs:         DataType.uint8,
    opcode:             DataType.uint16,
    flags:              DataType.uint32,
    ioValueList:        DataType.uint32,
    ioFlagList:         DataType.uint32,
    nameLength:         DataType.uint32,
    namePtr:            DataType.uint32,
*/