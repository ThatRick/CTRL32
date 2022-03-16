import { readStruct, DataType, sizeOfStruct, writeStruct, StructValues, sizeOfType, typedArray, readTypedValues, readStructElement, DataSize, StructDefinition, readArrayOfStructs } from './TypedStructs.js'
import {
    MSG_TYPE,
    msgTypeNames,
    IO_FLAG, IO_FLAG_TYPE_MASK, IO_TYPE, IO_TYPE_MAP, ioTypeNames,
    MsgRequestHeader_t,
    MsgControllerInfo_t,
    MsgTaskInfo_t,
    MsgCircuitInfo_t,
    MsgFunctionInfo_t,
    IController,
    ITask,
    ICircuit,
    IFunctionBlock,
    IO_FLAG_CONV_TYPE_MASK,
    ioConvNames,
    msgTypeNamesMaxLength,
    MsgMonitoringCollection_t,
    MsgMonitoringCollectionItem_t,
    MsgResponseHeader_t,
} from './ESP32.js'

import { toHex } from './Util.js'
import { CreateUI, ObjectView } from './UI.js'
import { WSConnection } from './WSConnection.js'
import { Button } from './UI/UIElements.js'



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

let controller:         IController

const tasks:            Map<number, ITask> = new Map()
const circuits:         Map<number, ICircuit> = new Map()
const functionBlocks:   Map<number, IFunctionBlock> = new Map()

const memDataRequests:  Map<number, MemDataRequest> = new Map()
const requestCallbacks: Map<number, PendingRequest> = new Map()

const monitoringValues: Map<number, number[]> = new Map()

// Setup UI and Websocket

const UI = CreateUI()

const ws = new WSConnection('192.168.0.241')
ws.onConsoleLine = UI.log.line
ws.onSetStatus = UI.setStatus

UI.connectionControls.appendChild(Button('Connect', ws.connect).node)
UI.connectionControls.appendChild(Button('Disconnect', ws.disconnect).node)


// TESTING
let logData = false
UI.consoleControls.appendChild(Button('Log Data', () => { logData = true }).node)


let msgID = 1;

type RequestCallback = (result: number) => void

///////////////////////////////////////////////////////////////////////////
//                    Send Commands to Controller
///////////////////////////////////////////////////////////////////////////

//  ------------------------------------------
//      Send a info request to controlle

function requestInfo(msgType: MSG_TYPE, pointer: number, callback?: RequestCallback) {
    sendMessage(msgType, pointer, callback)
}

//  -------------------------------------------------
//      Send a memory data request to controller

function requestMemData(pointer: number, length: number, elemType: DataType, callback: (list: number[], data: ArrayBuffer) => void) {
    const size = length * sizeOfType(elemType)
    memDataRequests.set(msgID, { pointer, elemType, callback })
    sendMessageWithStruct(MSG_TYPE.GET_MEM_DATA, pointer, { size: DataType.uint32 }, { size })
}

//  ----------------------------------------------------------
//      Send a request to modify memory data on controller

function modifyMemData(pointer: number, dataSource: ArrayBuffer, callback?: RequestCallback) {
    sendMessageWithData(MSG_TYPE.SET_MEM_DATA, pointer, dataSource, callback)
}

//  --------------------------------------------------------------
//      Enable / Disable IO-value monitoring on function block

function monitoringEnable(pointer: number, once = false, callback?: RequestCallback) {
    sendMessageWithStruct(MSG_TYPE.MONITORING_ENABLE, pointer, { once: DataType.uint32 }, { once: +once }, callback)
}
function monitoringDisable(pointer: number, callback?: RequestCallback) {
    sendMessage(MSG_TYPE.MONITORING_DISABLE, pointer, callback)
}

//  --------------------------------------------------------------
//      Modify task on controller

function taskStart(pointer: number, callback?: RequestCallback) {
    sendMessage(MSG_TYPE.TASK_START, pointer, callback)
}

function taskStop(pointer: number, callback?: RequestCallback) {
    sendMessage(MSG_TYPE.TASK_STOP, pointer, callback)
}


///////////////////////////////////////////////////////////////////////////
//                  Create and send message data
///////////////////////////////////////////////////////////////////////////

//  ----------------------------------------------------------------------
//      Create a message buffer with given payload size

function createMessageBuffer(msgType: MSG_TYPE, pointer: number, payloadSize: number, callback?: RequestCallback) {
    const headerSize = sizeOfStruct(MsgRequestHeader_t)
    const buffer = new ArrayBuffer(headerSize + payloadSize)
    writeStruct(buffer, 0, MsgRequestHeader_t, { msgType, msgID, pointer })
    if (callback) requestCallbacks.set(msgID, { pointer, msgType, callback })
    return { buffer, payloadStart: headerSize }
}
//  ----------------------------------------------------------------------
//      Send a message with no payload

function sendMessage(msgType: MSG_TYPE, pointer: number, callback?: RequestCallback) {
    const {buffer} = createMessageBuffer(msgType, pointer, 0, callback)
    sendBuffer(buffer)
}
//  ----------------------------------------------------------------------
//      Send a message with Typed Struct payload

function sendMessageWithStruct<T extends StructDefinition>(msgType: MSG_TYPE, pointer: number, struct: T, values: Partial<StructValues<T>>, callback?: RequestCallback) {
    const {buffer, payloadStart} = createMessageBuffer(msgType, pointer, sizeOfStruct(struct), callback)
    writeStruct(buffer, payloadStart, struct, values)
    sendBuffer(buffer)
}
//  ----------------------------------------------------------------------
//      Send a message with ArrayBuffer payload

function sendMessageWithData(msgType: MSG_TYPE, pointer: number, data: ArrayBuffer, callback?: RequestCallback) {
    const {buffer, payloadStart} = createMessageBuffer(msgType, pointer, data.byteLength, callback)
    const msgBytes = new Uint8Array(buffer)
    const sourceBytes = new Uint8Array(data)
    msgBytes.set(sourceBytes, payloadStart)
    sendBuffer(buffer)
}
//  ----------------------------------------------------------------------
//      Send a message buffer

function sendBuffer(buffer: ArrayBuffer) {
    ws.send(buffer)
    msgID++
}

///////////////////////////////////////////////////////////////////////////
//                  Handle Messages from Controller
///////////////////////////////////////////////////////////////////////////
ws.handleMessageData = (buffer: ArrayBuffer) => {

    const { msgType, msgID, result, timeStamp } = readStruct(buffer, 0, MsgResponseHeader_t)
    const payload = buffer.slice(sizeOfStruct(MsgResponseHeader_t))

    UI.log.line(`[Response #${(msgID +'  '+ msgTypeNames[msgType]).padEnd(msgTypeNamesMaxLength)}  result: ${result}  time: ${timeStamp}  payload len: ${payload.byteLength}]`)

    if (logData) {
        logData = false
        UI.createDataView(buffer, 'Received data: '+ msgTypeNames[msgType])
    }

    switch (msgType)
    {
        case MSG_TYPE.PING:                 requestInfo(MSG_TYPE.CONTROLLER_INFO, 0);   break
        case MSG_TYPE.CONTROLLER_INFO:      handleControllerData(payload);              break
        case MSG_TYPE.TASK_INFO:            handleTaskData(payload);                    break
        case MSG_TYPE.CIRCUIT_INFO:         handleCircuitData(payload);                 break
        case MSG_TYPE.FUNCTION_INFO:        handleFunctionData(payload);                break
        case MSG_TYPE.GET_MEM_DATA:
        {
            UI.log.line('MEMORY DATA:')
            const req = memDataRequests.get(msgID)
            if (req) {
                const array = typedArray(payload, req.elemType)
                const values = [...array]
                UI.log.list(values)
                req.callback(values, payload)
                memDataRequests.delete(msgID)
            }
            else UI.log.line('Unrequested memory data received')
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
                item => UI.log.record(item)
                const valueDataOffset = valueDataStart + item.offset
                handleMonitoringValues(item.pointer, payload, valueDataOffset)
            })
            break
        }
        default:
        {
            UI.log.line('UNKNOWN MESSAGE TYPE')
        }

        const pendingRequest = requestCallbacks.get(msgID)
        if (pendingRequest) {
            pendingRequest.callback(result)
            requestCallbacks.delete(msgID)
        }
    }
}

///////////////////////////////////////////////////////////////////////////
//                      Message data handlers
///////////////////////////////////////////////////////////////////////////

// ------------------------------------------------------------------------
//      Controller info

function handleControllerData(payload: ArrayBuffer) {
    const data = readStruct(payload, 0, MsgControllerInfo_t)
    controller ??= { data, tasks: undefined, complete: false }
    controller.data = data
    // Get task list
    if (!controller.tasks) requestMemData(controller.data.taskList, controller.data.taskCount, DataType.uint32, taskList => {
        controller.tasks = taskList
        controller.complete = true
        taskList.forEach(pointer => requestInfo(MSG_TYPE.TASK_INFO, pointer))
    })

    if (!monitoringViews.has(data.pointer)) monitoringViews.set(data.pointer, UI.createObjectView(data, 'Controller'))
    else monitoringViews.get(data.pointer).updateValues(data)

    setTimeout(() => requestInfo(MSG_TYPE.CONTROLLER_INFO, 0), 5000)
}
// ------------------------------------------------------------------------
//      Task info

function handleTaskData(payload: ArrayBuffer) {
    const data = readStruct(payload, 0, MsgTaskInfo_t)
    let task: ITask
    if (tasks.has(data.pointer)) {
        task = tasks.get(data.pointer)
        task.data = data
    } else {
        task = {data, circuits: undefined, complete: false }
        tasks.set(data.pointer, task)
    }
    if (!task.circuits) requestMemData(task.data.circuitList, task.data.circuitCount, DataType.uint32, circuitList => {
        task.circuits = circuitList
        task.complete = true
        circuitList.forEach(pointer => requestInfo(MSG_TYPE.CIRCUIT_INFO, pointer))
    })

    if (!monitoringViews.has(data.pointer)) monitoringViews.set(data.pointer, UI.createObjectView(data, 'Task'))
    else monitoringViews.get(data.pointer).updateValues(data)

    setTimeout(() => requestInfo(MSG_TYPE.TASK_INFO, data.pointer), 5000)
}
// ------------------------------------------------------------------------
//      Circuit info

function handleCircuitData(payload: ArrayBuffer) {
    const data = readStruct(payload, 0, MsgCircuitInfo_t)
    let circuit: ICircuit
    if (circuits.has(data.pointer)) {
        circuit = circuits.get(data.pointer)
        circuit.data = data
    } else {
        circuit = { data, funcCalls: undefined, outputRefs: undefined, complete: false }
        circuits.set(data.pointer, circuit)
    }
    if (!functionBlocks.has(data.pointer)) requestInfo(MSG_TYPE.FUNCTION_INFO, circuit.data.pointer, () => {
        const funcData = functionBlocks.get(data.pointer)?.data
        if (funcData) {
            requestMemData(circuit.data.outputRefList, funcData.numOutputs, DataType.uint32, outputRefs => {
                circuit.outputRefs = outputRefs
                if (circuit.funcCalls) circuit.complete = true
            })
        }
    })
    if (!circuit.funcCalls) requestMemData(circuit.data.funcList, circuit.data.funcCount, DataType.uint32, funcList => {
        circuit.funcCalls = funcList
        if (circuit.outputRefs) circuit.complete = true
        funcList.forEach(pointer => requestInfo(MSG_TYPE.FUNCTION_INFO, pointer))
    })
}
// ------------------------------------------------------------------------
//      Function Block info

function handleFunctionData(payload: ArrayBuffer) {
    const data = readStruct(payload, 0, MsgFunctionInfo_t)
    let func: IFunctionBlock
    if (functionBlocks.has(data.pointer)) {
        func = functionBlocks.get(data.pointer)
        func.data = data
    } else {
        func = { data, ioValues: undefined, ioFlags: undefined, name: undefined, complete: false }
        functionBlocks.set(data.pointer, func)
    }
    const ioCount = func.data.numInputs + func.data.numOutputs
    if (!func.ioFlags) requestMemData(func.data.ioFlagList, ioCount, DataType.uint8, ioFlags => {
        func.ioFlags = ioFlags
        requestMemData(func.data.ioValueList, ioCount, DataType.uint32, (_, data) => {
            const dataTypes = ioFlags.map(ioFlag => (ioFlag & IO_FLAG.REF) ? DataType.uint32 : IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
            func.ioValues = readTypedValues(data, dataTypes)
            checkIfComplete()
        })
    })
    if (!func.name) requestMemData(func.data.namePtr, func.data.nameLength, DataType.uint8, (_, data) => {
        func.name = new TextDecoder().decode(data)
        checkIfComplete()
    })
    function checkIfComplete() {
        if (func.ioValues && func.name) {
            func.complete = true
            monitoringEnable(func.data.pointer)
        }
    }
}

// ------------------------------------------------------------------------
//      Monitoring values

function handleMonitoringValues(pointer: number, data: ArrayBuffer, offset=0) {
    const func = functionBlocks.get(pointer)
    const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
    const values = readTypedValues(data, dataTypes, offset)
    monitoringValues.set(pointer, values)

    showMonitoringValues(pointer)
}

//  ------------------------------------------
//          Create monitoring view
//  ------------------------------------------

const monitoringViews: Map<number, ObjectView> = new Map()

function showMonitoringValues(pointer: number) {
    const values = monitoringValues.get(pointer)
    const obj = {}
    values.forEach((value, i) => obj[i+':'] = value)

    let view = monitoringViews.get(pointer)
    if (!view) {
        const func = functionBlocks.get(pointer)
        view = UI.createObjectView(obj, `${func.name} [${toHex(pointer)}]`)
        monitoringViews.set(pointer, view)
    }
    else view.updateValues(obj)
}