import { readStruct, DataType, sizeOfStruct, writeStruct, StructValues, sizeOfType, typedArray, readTypedValues, readStructElement, DataSize, StructDefinition, readArrayOfStructs } from './TypedStructs.js'
import {
    ESP32,
    MSG_TYPE,
    msgTypeNames,
    REQUEST_RESULT,
    IO_FLAG, IO_FLAG_TYPE_MASK, IO_TYPE, IO_TYPE_MAP, ioTypeNames,
    MsgHeader_t,
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
} from './ESP32.js'

import { toHex } from './Util.js'
import { ActionButton, CreateUI, ObjectView } from './UI.js'
import { WSConnection } from './WSConnection.js'

interface MemDataRequest {
    pointer:    number
    elemType:   DataType
    callbackFn: (list: number[], data: ArrayBuffer) => void
}

interface InfoRequest {
    pointer:    number
    msgType:    MSG_TYPE
    callbackFn: (data: Object) => void
}

interface ModifyRequest {
    pointer:    number
    msgType:    MSG_TYPE
    callbackFn: (result: REQUEST_RESULT) => void
}

let controller:         IController

const tasks:            Map<number, ITask> = new Map()
const circuits:         Map<number, ICircuit> = new Map()
const functionBlocks:   Map<number, IFunctionBlock> = new Map()

const memDataRequests:  Map<number, MemDataRequest> = new Map()
const infoRequests:     Map<number, InfoRequest> = new Map()
const modifyRequests:   Map<number, ModifyRequest> = new Map()

const monitoringValues: Map<number, number[]> = new Map()

// Setup UI and Websocket

const UI = CreateUI()

const ws = new WSConnection('192.168.0.241')
ws.onConsoleLine = UI.log.line
ws.onSetStatus = UI.setStatus

new ActionButton(UI.connectionControls, 'Connect', ws.connect)
new ActionButton(UI.connectionControls, 'Disconnect', ws.disconnect)


///////////////////////////////////////////////////////////////////////////
//                    Send Commands to Controller
///////////////////////////////////////////////////////////////////////////

//  ------------------------------------------
//      Send a info request to controlle

function requestInfo(msgType: MSG_TYPE, pointer: number, callbackFn?: (data: Object) => void) {
    const msg = createMessageWithSize(msgType, pointer)
    if (callbackFn) infoRequests.set(pointer, { pointer, msgType, callbackFn })
    ws.send(msg.buffer)
}

//  -------------------------------------------------
//      Send a memory data request to controller

function requestMemData(pointer: number, length: number, elemType: DataType, callbackFn: (list: number[], data: ArrayBuffer) => void) {
    const size = length * sizeOfType(elemType)
    const buffer = createMessageWithStruct(MSG_TYPE.GET_MEM_DATA, pointer, { size: DataType.uint32 }, { size })
    memDataRequests.set(pointer, { pointer, elemType, callbackFn })
    ws.send(buffer)
}

//  ----------------------------------------------------------
//      Send a request to modify memory data on controller

function modifyMemData(pointer: number, dataSource: ArrayBuffer, callbackFn?: (result: REQUEST_RESULT) => void) {
    const buffer = createMessageWithData(MSG_TYPE.SET_MEM_DATA, pointer, dataSource)
    if (callbackFn) modifyRequests.set(pointer, { pointer, msgType: MSG_TYPE.SET_MEM_DATA, callbackFn })
    ws.send(buffer)
}

//  --------------------------------------------------------------
//      Enable / Disable IO-value monitoring on function block

function monitoringEnable(pointer: number, once = false, callbackFn?: (result: REQUEST_RESULT) => void) {
    const buffer = createMessageWithStruct(MSG_TYPE.MONITORING_ENABLE, pointer, { once: DataType.uint32 }, { once: +once })
    if (callbackFn) modifyRequests.set(pointer, { pointer, msgType: MSG_TYPE.SET_MEM_DATA, callbackFn })
    ws.send(buffer)
}
function monitoringDisable(pointer: number, callbackFn?: (result: REQUEST_RESULT) => void) {
    const msg = createMessageWithSize(MSG_TYPE.MONITORING_ENABLE, pointer)
    if (callbackFn) modifyRequests.set(pointer, { pointer, msgType: MSG_TYPE.SET_MEM_DATA, callbackFn })
    ws.send(msg.buffer)
}

//  ----------------------------------------------------------------------
//      Create a message buffer with empty payload data of given size

function createMessageWithSize(msgType: MSG_TYPE, pointer: number, payloadSize = 0) {
    const headerSize = sizeOfStruct(MsgHeader_t)
    const buffer = new ArrayBuffer(headerSize + payloadSize)
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer })
    return { buffer, payloadStart: headerSize }
}
//  ----------------------------------------------------------------------
//      Create a message buffer with given struct data

function createMessageWithStruct<T extends StructDefinition>(msgType: MSG_TYPE, pointer: number, struct: T, values: Partial<StructValues<T>>) {
    const headerSize = sizeOfStruct(MsgHeader_t)
    const buffer = new ArrayBuffer(headerSize + sizeOfStruct(struct))
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer })
    writeStruct(buffer, headerSize, struct, values)
    return buffer
}
//  ----------------------------------------------------------------------
//      Create a message buffer with given ArrayBuffer as payload

function createMessageWithData(msgType: MSG_TYPE, pointer: number, data: ArrayBuffer) {
    const headerSize = sizeOfStruct(MsgHeader_t)
    const buffer = new ArrayBuffer(headerSize + data.byteLength)
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer })
    const msgBytes = new Uint8Array(buffer)
    const sourceBytes = new Uint8Array(data)
    msgBytes.set(sourceBytes, headerSize)
    return buffer
}


///////////////////////////////////////////////////////////////////////////
//                  Handle Messages from Controller
///////////////////////////////////////////////////////////////////////////
ws.handleMessageData = (buffer: ArrayBuffer) => {
    const { msgType, pointer, timeStamp } = readStruct(buffer, 0, MsgHeader_t)
    const payload = buffer.slice(sizeOfStruct(MsgHeader_t))
    const memArea = ESP32.findMemoryAreaForAddr(pointer)
    let memAreaText = (memArea) ? memArea.name + ' + ' + (pointer - memArea.low).toString(16) : '???'

    UI.log.line(`[Received type ${msgType.toString().padStart(2, '0')}: ${msgTypeNames[msgType].padEnd(msgTypeNamesMaxLength)}  time: ${timeStamp}  ptr: ${toHex(pointer)} (${memAreaText}) payload len: ${payload.byteLength}]`)

    switch (msgType)
    {
        case MSG_TYPE.PING:
        {
            requestInfo(MSG_TYPE.CONTROLLER_INFO, 0);
            break
        }
        case MSG_TYPE.CONTROLLER_INFO:
        {
            const data = readStruct(payload, 0, MsgControllerInfo_t)

            handleControllerData(pointer, data)
            if (infoRequests.has(0)) {
                infoRequests.get(0).callbackFn(data)
                infoRequests.delete(0)
            }
            break
        }
        case MSG_TYPE.TASK_INFO:
        {
            const data = readStruct(payload, 0, MsgTaskInfo_t)
            handleTaskData(pointer, data)
            if (infoRequests.has(pointer)) {
                infoRequests.get(pointer).callbackFn(data)
                infoRequests.delete(pointer)
            }
            break
        }
        case MSG_TYPE.CIRCUIT_INFO:
        {
            UI.log.line('CIRCUIT INFO:')
            const data = readStruct(payload, 0, MsgCircuitInfo_t)
            UI.log.record(data)
            handleCircuitData(pointer, data)
            if (infoRequests.has(pointer)) {
                infoRequests.get(pointer).callbackFn(data)
                infoRequests.delete(pointer)
            }
            break
        }
        case MSG_TYPE.FUNCTION_INFO:
        {
            UI.log.line('FUNCTION INFO:')
            const data = readStruct(payload, 0, MsgFunctionInfo_t)
            UI.log.record(data)
            handleFunctionData(pointer, data)
            if (infoRequests.has(pointer)) {
                infoRequests.get(pointer).callbackFn(data)
                infoRequests.delete(pointer)
            }
            break
        }
        case MSG_TYPE.GET_MEM_DATA:
        {
            UI.log.line('MEMORY DATA:')
            const req = memDataRequests.get(pointer)
            if (req) {
                const array = typedArray(payload, req.elemType)
                const values = [...array]
                UI.log.list(values)
                req.callbackFn(values, payload)
                memDataRequests.delete(pointer)
            }
            else UI.log.line('Unrequested memory data received')
            break
        }
        case MSG_TYPE.SET_MEM_DATA:
        case MSG_TYPE.MONITORING_ENABLE:
        case MSG_TYPE.MONITORING_DISABLE:
        {
            const [result] = readTypedValues(payload, [DataType.uint32])
            UI.log.line(`RESPONSE TO ${msgTypeNames[msgType]}: ${result ? 'SUCCESSFUL' : 'FAILED'}`)
            const req = modifyRequests.get(pointer)
            if (req) {
                req.callbackFn(result)
                modifyRequests.delete(pointer)
            }
            break
        }
        case MSG_TYPE.MONITORING_FUNC_VALUES:
        {
            if (functionBlocks.has(pointer)) {
                handleMonitoringValues(pointer, payload)
            } 
            else UI.log.line('Undefined function block target for monitoring values')
            break
        }
        case MSG_TYPE.MONITORING_COLLECTION:
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
    }
}

///////////////////////////////////////////////////////////////////////////
//                      Message data handlers
///////////////////////////////////////////////////////////////////////////

// ------------------------------------------------------------------------
//      Monitoring values

function handleMonitoringValues(pointer: number, data: ArrayBuffer, offset=0) {
    const func = functionBlocks.get(pointer)
    const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ ioFlag & IO_FLAG_TYPE_MASK ])
    const values = readTypedValues(data, dataTypes, offset)
    monitoringValues.set(pointer, values)

    showMonitoringValues(pointer)
}
// ------------------------------------------------------------------------
//      Controller info

function handleControllerData(pointer: number, data: StructValues<typeof MsgControllerInfo_t>) {
    controller ??= { pointer, data, tasks: undefined, complete: false }
    controller.data = data
    // Get task list
    if (!controller.tasks) requestMemData(controller.data.taskList, controller.data.taskCount, DataType.uint32, taskList => {
        controller.tasks = taskList
        controller.complete = true
        taskList.forEach(pointer => requestInfo(MSG_TYPE.TASK_INFO, pointer))
    })

    if (!monitoringViews.has(pointer)) monitoringViews.set(pointer, new ObjectView(data, `Controller [${toHex(pointer)}]`))
    else monitoringViews.get(pointer).updateValues(data)

    setTimeout(() => requestInfo(MSG_TYPE.CONTROLLER_INFO, 0), 1000)
}
// ------------------------------------------------------------------------
//      Task info

function handleTaskData(pointer: number, data: StructValues<typeof MsgTaskInfo_t>) {
    let task: ITask
    if (tasks.has(pointer)) {
        task = tasks.get(pointer)
        task.data = data
    } else {
        task = { pointer, data, circuits: undefined, complete: false }
        tasks.set(pointer, task)
    }
    if (!task.circuits) requestMemData(task.data.circuitList, task.data.circuitCount, DataType.uint32, circuitList => {
        task.circuits = circuitList
        task.complete = true
        circuitList.forEach(pointer => requestInfo(MSG_TYPE.CIRCUIT_INFO, pointer))
    })

    if (!monitoringViews.has(pointer)) monitoringViews.set(pointer, new ObjectView(data, `TASK [${toHex(pointer)}]`))
    else monitoringViews.get(pointer).updateValues(data)

    setTimeout(() => requestInfo(MSG_TYPE.TASK_INFO, pointer), 1000)
}
// ------------------------------------------------------------------------
//      Circuit info

function handleCircuitData(pointer: number, data: StructValues<typeof MsgCircuitInfo_t>) {
    let circuit: ICircuit
    if (circuits.has(pointer)) {
        circuit = circuits.get(pointer)
        circuit.data = data
    } else {
        circuit = { pointer, data, funcCalls: undefined, outputRefs: undefined, complete: false }
        circuits.set(pointer, circuit)
    }
    if (!functionBlocks.has(pointer)) requestInfo(MSG_TYPE.FUNCTION_INFO, circuit.pointer, () => {
        const funcData = functionBlocks.get(pointer)?.data
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

function handleFunctionData(pointer: number, data: StructValues<typeof MsgFunctionInfo_t>) {
    let func: IFunctionBlock
    if (functionBlocks.has(pointer)) {
        func = functionBlocks.get(pointer)
        func.data = data
    } else {
        func = { pointer, data, ioValues: undefined, ioFlags: undefined, name: undefined, complete: false }
        functionBlocks.set(pointer, func)
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
            printFunctionBlock(func)
            monitoringEnable(func.pointer)
        }
    }
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
        view = new ObjectView(obj, `${func.name} [${toHex(pointer)}]`)
        monitoringViews.set(pointer, view)
    }
    else view.updateValues(obj)
}

// ------------------------------------------------------------------------
//      Parse opcode to library id and function id

function parseOpcode(opcode: number) {
    const lib_id = (opcode & 0xFF00) >>> 8;
    const func_id = opcode & 0x00FF;
    return { lib_id, func_id }
}

function printFunctionBlock(func: IFunctionBlock, withFlags = true) {
    if (!func.complete) {
        console.error('printFunctionBlock: FunctionBlock data is not complete')
        return
    }
    const valuePad = 18
    const typePad = 8
    const lines: string[] = []
    lines.push('')
    const { lib_id, func_id } = parseOpcode(func.data.opcode)
    lines.push(`Function Block ${func.name}:  id: ${lib_id}/${func_id}  ptr: ${toHex(func.pointer)}  flags: ${'b'+func.data.flags.toString(2).padStart(8, '0')}`)
    lines.push('')
    const topLine = ''.padStart(valuePad) + ' ┌─' + ''.padEnd(2*typePad, '─') + '─┐  ' + ''.padEnd(valuePad)
    lines.push(topLine)

    const monValues = monitoringValues.get(func.pointer)
    for (let i = 0; i < Math.max(func.data.numInputs, func.data.numOutputs); i++) {
        let text: string
        // Input value
        if (i < func.data.numInputs) {
            const ioType = func.ioFlags[i] & IO_FLAG_TYPE_MASK
            const connected = func.ioFlags[i] & IO_FLAG.REF
            const inputValue = monValues ? monValues[i] : func.ioValues[i]
            const ioTypeName = ioTypeNames[ioType]
            const valueStr = (!monValues && connected) ? toHex(func.ioValues[i])
                           : (ioType == IO_TYPE.FLOAT) ? inputValue.toPrecision(8)
                           : inputValue.toString() 

            const border = connected ? ' ┤>' : ' ┤ '
            text = valueStr.padStart(valuePad) + border + ioTypeName.padEnd(typePad)
        }
        else text = ''.padStart(valuePad) + ' │ ' + ''.padEnd(typePad)

        // Output value
        const outputNum = func.data.numInputs + i
        if (outputNum < func.ioValues.length) {
            const outputValue = monValues ? monValues[outputNum] : func.ioValues[outputNum]
            const ioType = func.ioFlags[outputNum] & IO_FLAG_TYPE_MASK
            const ioTypeName = ioTypeNames[ioType]
            const valueStr = (ioType == IO_TYPE.FLOAT) ? outputValue.toPrecision(8) : outputValue.toString()
            text += ioTypeName.padStart(typePad) + ' ├ ' + valueStr.padEnd(valuePad)
        }
        else text += ''.padStart(typePad) + ' │ ' + ''.padEnd(valuePad)

        lines.push(text)
    }
    const bottomLine = ''.padStart(valuePad) + ' └─' + ''.padEnd(2*typePad, '─') + '─┘  ' + ''.padEnd(valuePad)
    lines.push(bottomLine)

    if (withFlags) {
        lines.push('IO Flags:')
        func.ioFlags.forEach((flags, i) => {
            let ioType = flags & IO_FLAG_TYPE_MASK
            let convType = flags & IO_FLAG_CONV_TYPE_MASK
            let line = ''
    
            line = (line+i+': ').padStart(20) + flags.toString(2).padStart(8, '0') + '  ' + ioTypeNames[ioType]
            if (flags & IO_FLAG.REF) {
                line += ' conn. ' + toHex(func.ioValues[i]) + ((flags & IO_FLAG.REF_INVERT) ? ' (inv) ' : '       ')
                if (convType) {
                    line += 'from ' + ioConvNames[convType]
                }
            }
            lines.push(line)
        })
    }

    UI.log.entry(lines)
}