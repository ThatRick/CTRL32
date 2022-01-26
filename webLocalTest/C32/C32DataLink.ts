import { WebSocketClient } from '../WebSocketClient.js'
import { readStruct, DataType, sizeOfStruct, writeStruct, StructValues, sizeOfType, typedArray, readTypedValues, readStructElement, DataSize, StructDefinition, readArrayOfStructs } from '../TypedStructs.js'
import {
    MSG_TYPE,
    msgTypeNames,
    IO_FLAG_TYPE_MASK, IO_TYPE_MAP,
    MsgRequestHeader_t,
    MsgControllerInfo_t,
    MsgTaskInfo_t,
    MsgCircuitInfo_t,
    MsgFunctionInfo_t,
    IController,
    ITask,
    msgTypeNamesMaxLength,
    MsgMonitoringCollection_t,
    MsgMonitoringCollectionItem_t,
    MsgResponseHeader_t,
} from './C32Types.js'
import { C32Function } from './C32Function.js'
import { C32Circuit } from './C32Circuit.js'
import { C32Task } from './C32Task.js'
import { C32Controller } from './C32Controller.js'

interface MemDataRequest {
    pointer:    number
    elemType:   DataType
    callback:   (list: number[], data: ArrayBuffer) => void
}

interface PendingRequest {
    pointer:    number
    msgType:    MSG_TYPE
    callback:   (result: number) => void
}

type RequestCallback = (result: number) => void


export class C32DataLink
{
    controller: IController

    tasks            = new Map<number, C32Task>()
    circuits         = new Map<number, C32Circuit>()
    functionBlocks   = new Map<number, C32Function>()

    constructor(client: WebSocketClient) {
        this.client = client
        this.client.onBinaryDataReceived = this.handleMessageData
    }

    ///////////////////////////////////////////////////////////////////////////
    //      REQUESTS TO CONTROLLER
    ///////////////////////////////////////////////////////////////////////////

    //      Send a info request to controlle

    requestInfo(msgType: MSG_TYPE, pointer: number, callback?: RequestCallback) {
        this.sendMessage(msgType, pointer, callback)
    }

    //      Send a memory data request to controller

    requestMemData(pointer: number, length: number, elemType: DataType, callback: (list: number[], data: ArrayBuffer) => void) {
        const size = length * sizeOfType(elemType)
        this.memDataRequests.set(this.msgID, { pointer, elemType, callback })
        this.sendMessageWithStruct(MSG_TYPE.GET_MEM_DATA, pointer, { size: DataType.uint32 }, { size })
    }

    //      Send a request to modify memory data on controller

    modifyMemData(pointer: number, dataSource: ArrayBuffer, callback?: RequestCallback) {
        this.sendMessageWithData(MSG_TYPE.SET_MEM_DATA, pointer, dataSource, callback)
    }

    //      Enable / Disable IO-value monitoring on function block

    monitoringEnable(pointer: number, once = false, callback?: RequestCallback) {
        this.sendMessageWithStruct(MSG_TYPE.MONITORING_ENABLE, pointer, { once: DataType.uint32 }, { once: +once }, callback)
    }
    monitoringDisable(pointer: number, callback?: RequestCallback) {
        this.sendMessage(MSG_TYPE.MONITORING_DISABLE, pointer, callback)
    }

    //      Modify task on controller

    taskStart(pointer: number, callback?: RequestCallback) {
        this.sendMessage(MSG_TYPE.TASK_START, pointer, callback)
    }

    taskStop(pointer: number, callback?: RequestCallback) {
        this.sendMessage(MSG_TYPE.TASK_STOP, pointer, callback)
    }


    ///////////////////////////////////////////////////////////////////////////
    //      PRIVATE SECTION
    ///////////////////////////////////////////////////////////////////////////

    protected client: WebSocketClient

    protected msgID = 1

    protected memDataRequests  = new Map<number, MemDataRequest>()
    protected requestCallbacks = new Map<number, PendingRequest>()
    
    //      Create a message buffer with given payload size

    protected createMessageBuffer(msgType: MSG_TYPE, pointer: number, payloadSize: number, callback?: RequestCallback) {
        const headerSize = sizeOfStruct(MsgRequestHeader_t)
        const buffer = new ArrayBuffer(headerSize + payloadSize)
        writeStruct(buffer, 0, MsgRequestHeader_t, { msgType, msgID: this.msgID, pointer })
        if (callback) this.requestCallbacks.set(this.msgID, { pointer, msgType, callback })
        return { buffer, payloadStart: headerSize }
    }
    
    //      Send a message with no payload

    protected sendMessage(msgType: MSG_TYPE, pointer: number, callback?: RequestCallback) {
        const {buffer} = this.createMessageBuffer(msgType, pointer, 0, callback)
        this.sendBuffer(buffer)
    }
    
    //      Send a message with Typed Struct payload

    protected sendMessageWithStruct<T extends StructDefinition>(msgType: MSG_TYPE, pointer: number, struct: T, values: Partial<StructValues<T>>, callback?: RequestCallback) {
        const {buffer, payloadStart} = this.createMessageBuffer(msgType, pointer, sizeOfStruct(struct), callback)
        writeStruct(buffer, payloadStart, struct, values)
        this.sendBuffer(buffer)
    }
    
    //      Send a message with ArrayBuffer payload

    protected sendMessageWithData(msgType: MSG_TYPE, pointer: number, data: ArrayBuffer, callback?: RequestCallback) {
        const {buffer, payloadStart} = this.createMessageBuffer(msgType, pointer, data.byteLength, callback)
        const msgBytes = new Uint8Array(buffer)
        const sourceBytes = new Uint8Array(data)
        msgBytes.set(sourceBytes, payloadStart)
        this.sendBuffer(buffer)
    }
    
    //      Send a message buffer

    protected sendBuffer(buffer: ArrayBuffer) {
        this.client.sendBinaryData(buffer)
        this.msgID++
    }

    protected log = {
        line: (line: string)    => console.log(line),
        list: (list: number[])  => list.forEach(line => console.log(line))
    }

    ///////////////////////////////////////////////////////////////////////////
    //                  Handle Messages from Controller
    ///////////////////////////////////////////////////////////////////////////

    protected handleMessageData = (buffer: ArrayBuffer) => {

        const { msgType, msgID, result, timeStamp } = readStruct(buffer, 0, MsgResponseHeader_t)
        const payload = buffer.slice(sizeOfStruct(MsgResponseHeader_t))

        this.log.line(`[Response #${(msgID +'  '+ msgTypeNames[msgType]).padEnd(msgTypeNamesMaxLength)}  result: ${result}  time: ${timeStamp}  payload len: ${payload.byteLength}]`)

        switch (msgType)
        {
            case MSG_TYPE.PING:                 this.requestInfo(MSG_TYPE.CONTROLLER_INFO, 0);   break
            case MSG_TYPE.CONTROLLER_INFO:      this.handleControllerData(payload);              break
            case MSG_TYPE.TASK_INFO:            this.handleTaskData(payload);                    break
            case MSG_TYPE.CIRCUIT_INFO:         this.handleCircuitData(payload);                 break
            case MSG_TYPE.FUNCTION_INFO:        this.handleFunctionData(payload);                break
            case MSG_TYPE.GET_MEM_DATA:
            {
                this.log.line('MEMORY DATA:')
                const req = this.memDataRequests.get(msgID)
                if (req) {
                    const array = typedArray(payload, req.elemType)
                    const values = [...array]
                    this.log.list(values)
                    req.callback(values, payload)
                    this.memDataRequests.delete(msgID)
                }
                else this.log.line('Error: Unrequested memory data received')
                break
            }
            case MSG_TYPE.SET_MEM_DATA:
            case MSG_TYPE.MONITORING_ENABLE:
            case MSG_TYPE.MONITORING_DISABLE:
            {
                break
            }
            case MSG_TYPE.MONITORING_REPORT:
            {
                let offset = 0
                const { itemCount } = readStruct(payload, offset, MsgMonitoringCollection_t )
                offset += sizeOfStruct(MsgMonitoringCollection_t)
                const collectionItems = readArrayOfStructs(payload, offset, MsgMonitoringCollectionItem_t, itemCount)
                const valueDataStart = offset + sizeOfStruct(MsgMonitoringCollectionItem_t) * itemCount

                collectionItems.forEach(item => {
                    const valueDataOffset = valueDataStart + item.offset
                    this.handleMonitoringValues(item.pointer, payload, valueDataOffset)
                })
                break
            }
            default:
            {
                this.log.line('Error: Unknown message type')
            }

            const pendingRequest = this.requestCallbacks.get(msgID)
            if (pendingRequest) {
                pendingRequest.callback(result)
                this.requestCallbacks.delete(msgID)
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //                      Message data handlers
    ///////////////////////////////////////////////////////////////////////////

    // ------------------------------------------------------------------------
    //      Controller info

    protected handleControllerData(payload: ArrayBuffer) {
        const data = readStruct(payload, 0, MsgControllerInfo_t)
        this.controller = new C32Controller(data, this)
    }
    // ------------------------------------------------------------------------
    //      Task info

    protected handleTaskData(payload: ArrayBuffer) {
        const data = readStruct(payload, 0, MsgTaskInfo_t)
        const task = new C32Task(data, this)
        if (this.tasks.has(data.pointer)) {
            const oldtask = this.tasks.get(data.pointer)
            oldtask.remove()
        }
        this.tasks.set(data.pointer, task)
    }
    // ------------------------------------------------------------------------
    //      Circuit info

    protected handleCircuitData(payload: ArrayBuffer) {
        const data = readStruct(payload, 0, MsgCircuitInfo_t)
        const circuit = new C32Circuit(data, this)
        if (this.circuits.has(data.pointer)) {
            const oldcircuit = this.circuits.get(data.pointer)
            oldcircuit.remove()
        }
        this.circuits.set(data.pointer, circuit)
    }
    // ------------------------------------------------------------------------
    //      Function Block info

    protected handleFunctionData(payload: ArrayBuffer) {
        const data = readStruct(payload, 0, MsgFunctionInfo_t)
        const func = new C32Function(data, this)
        if (this.functionBlocks.has(data.pointer)) {
            const oldfunc = this.functionBlocks.get(data.pointer)
            oldfunc.remove()
        }
        this.functionBlocks.set(data.pointer, func)
    }

    // ------------------------------------------------------------------------
    //      Function monitoring values

    protected handleMonitoringValues(pointer: number, data: ArrayBuffer, offset=0) {
        const func = this.functionBlocks.get(pointer)
        const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
        const values = readTypedValues(data, dataTypes, offset)
        func.setMonitoringValues(values)
    }

}