import { readStruct, sizeOfStruct, writeStruct, sizeOfType, typedArray, readTypedValues, readArrayOfStructs } from './TypedStructs.js';
import { msgTypeNames, IO_FLAG_TYPE_MASK, IO_TYPE_MAP, ioTypeNames, MsgRequestHeader_t, MsgControllerInfo_t, MsgTaskInfo_t, MsgCircuitInfo_t, MsgFunctionInfo_t, IO_FLAG_CONV_TYPE_MASK, ioConvNames, msgTypeNamesMaxLength, MsgMonitoringCollection_t, MsgMonitoringCollectionItem_t, MsgResponseHeader_t, } from './ESP32.js';
import { toHex } from './Util.js';
import { ActionButton, CreateUI, ObjectView } from './UI.js';
import { WSConnection } from './WSConnection.js';
import { GUI } from './GUI.js';
let controller;
const tasks = new Map();
const circuits = new Map();
const functionBlocks = new Map();
const memDataRequests = new Map();
const requestCallbacks = new Map();
const monitoringValues = new Map();
// Setup UI and Websocket
const UI = CreateUI();
console.log('Running globol');
const gui = new GUI();
const ws = new WSConnection('192.168.0.241');
ws.onConsoleLine = UI.log.line;
ws.onSetStatus = UI.setStatus;
new ActionButton(UI.connectionControls, 'Connect', ws.connect);
new ActionButton(UI.connectionControls, 'Disconnect', ws.disconnect);
let msgID = 1;
///////////////////////////////////////////////////////////////////////////
//                    Send Commands to Controller
///////////////////////////////////////////////////////////////////////////
//  ------------------------------------------
//      Send a info request to controlle
function requestInfo(msgType, pointer, callback) {
    sendMessage(msgType, pointer, callback);
}
//  -------------------------------------------------
//      Send a memory data request to controller
function requestMemData(pointer, length, elemType, callback) {
    const size = length * sizeOfType(elemType);
    memDataRequests.set(msgID, { pointer, elemType, callback });
    sendMessageWithStruct(5 /* GET_MEM_DATA */, pointer, { size: 5 /* uint32 */ }, { size });
}
//  ----------------------------------------------------------
//      Send a request to modify memory data on controller
function modifyMemData(pointer, dataSource, callback) {
    sendMessageWithData(6 /* SET_MEM_DATA */, pointer, dataSource, callback);
}
//  --------------------------------------------------------------
//      Enable / Disable IO-value monitoring on function block
function monitoringEnable(pointer, once = false, callback) {
    sendMessageWithStruct(7 /* MONITORING_ENABLE */, pointer, { once: 5 /* uint32 */ }, { once: +once }, callback);
}
function monitoringDisable(pointer, callback) {
    sendMessage(8 /* MONITORING_DISABLE */, pointer, callback);
}
//  --------------------------------------------------------------
//      Modify task on controller
function taskStart(pointer, callback) {
    sendMessage(16 /* TASK_START */, pointer, callback);
}
function taskStop(pointer, callback) {
    sendMessage(17 /* TASK_STOP */, pointer, callback);
}
///////////////////////////////////////////////////////////////////////////
//                  Create and send message data
///////////////////////////////////////////////////////////////////////////
//  ----------------------------------------------------------------------
//      Create a message buffer with given payload size
function createMessageBuffer(msgType, pointer, payloadSize, callback) {
    const headerSize = sizeOfStruct(MsgRequestHeader_t);
    const buffer = new ArrayBuffer(headerSize + payloadSize);
    writeStruct(buffer, 0, MsgRequestHeader_t, { msgType, msgID, pointer });
    if (callback)
        requestCallbacks.set(msgID, { pointer, msgType, callback });
    return { buffer, payloadStart: headerSize };
}
//  ----------------------------------------------------------------------
//      Send a message with no payload
function sendMessage(msgType, pointer, callback) {
    const { buffer } = createMessageBuffer(msgType, pointer, 0, callback);
    sendBuffer(buffer);
}
//  ----------------------------------------------------------------------
//      Send a message with Typed Struct payload
function sendMessageWithStruct(msgType, pointer, struct, values, callback) {
    const { buffer, payloadStart } = createMessageBuffer(msgType, pointer, sizeOfStruct(struct), callback);
    writeStruct(buffer, payloadStart, struct, values);
    sendBuffer(buffer);
}
//  ----------------------------------------------------------------------
//      Send a message with ArrayBuffer payload
function sendMessageWithData(msgType, pointer, data, callback) {
    const { buffer, payloadStart } = createMessageBuffer(msgType, pointer, data.byteLength, callback);
    const msgBytes = new Uint8Array(buffer);
    const sourceBytes = new Uint8Array(data);
    msgBytes.set(sourceBytes, payloadStart);
    sendBuffer(buffer);
}
//  ----------------------------------------------------------------------
//      Send a message buffer
function sendBuffer(buffer) {
    ws.send(buffer);
    msgID++;
}
///////////////////////////////////////////////////////////////////////////
//                  Handle Messages from Controller
///////////////////////////////////////////////////////////////////////////
ws.handleMessageData = (buffer) => {
    const { msgType, msgID, result, timeStamp } = readStruct(buffer, 0, MsgResponseHeader_t);
    const payload = buffer.slice(sizeOfStruct(MsgResponseHeader_t));
    UI.log.line(`[Response #${(msgID + '  ' + msgTypeNames[msgType]).padEnd(msgTypeNamesMaxLength)}  result: ${result}  time: ${timeStamp}  payload len: ${payload.byteLength}]`);
    switch (msgType) {
        case 0 /* PING */:
            requestInfo(1 /* CONTROLLER_INFO */, 0);
            break;
        case 1 /* CONTROLLER_INFO */:
            handleControllerData(payload);
            break;
        case 2 /* TASK_INFO */:
            handleTaskData(payload);
            break;
        case 3 /* CIRCUIT_INFO */:
            handleCircuitData(payload);
            break;
        case 4 /* FUNCTION_INFO */:
            handleFunctionData(payload);
            break;
        case 5 /* GET_MEM_DATA */:
            {
                UI.log.line('MEMORY DATA:');
                const req = memDataRequests.get(msgID);
                if (req) {
                    const array = typedArray(payload, req.elemType);
                    const values = [...array];
                    UI.log.list(values);
                    req.callback(values, payload);
                    memDataRequests.delete(msgID);
                }
                else
                    UI.log.line('Unrequested memory data received');
                break;
            }
        case 6 /* SET_MEM_DATA */:
        case 7 /* MONITORING_ENABLE */:
        case 8 /* MONITORING_DISABLE */:
            {
                break;
            }
        case 9 /* MONITORING_REPORT */:
            {
                let offset = 0;
                const { itemCount } = readStruct(payload, offset, MsgMonitoringCollection_t);
                offset += sizeOfStruct(MsgMonitoringCollection_t);
                const collectionItems = readArrayOfStructs(payload, offset, MsgMonitoringCollectionItem_t, itemCount);
                const valueDataStart = offset + sizeOfStruct(MsgMonitoringCollectionItem_t) * itemCount;
                collectionItems.forEach(item => {
                    item => UI.log.record(item);
                    const valueDataOffset = valueDataStart + item.offset;
                    handleMonitoringValues(item.pointer, payload, valueDataOffset);
                });
                break;
            }
        default:
            {
                UI.log.line('UNKNOWN MESSAGE TYPE');
            }
            const pendingRequest = requestCallbacks.get(msgID);
            if (pendingRequest) {
                pendingRequest.callback(result);
                requestCallbacks.delete(msgID);
            }
    }
};
///////////////////////////////////////////////////////////////////////////
//                      Message data handlers
///////////////////////////////////////////////////////////////////////////
// ------------------------------------------------------------------------
//      Controller info
function handleControllerData(payload) {
    const data = readStruct(payload, 0, MsgControllerInfo_t);
    controller !== null && controller !== void 0 ? controller : (controller = { data, tasks: undefined, complete: false });
    controller.data = data;
    // Get task list
    if (!controller.tasks)
        requestMemData(controller.data.taskList, controller.data.taskCount, 5 /* uint32 */, taskList => {
            controller.tasks = taskList;
            controller.complete = true;
            taskList.forEach(pointer => requestInfo(2 /* TASK_INFO */, pointer));
        });
    if (!monitoringViews.has(data.pointer))
        monitoringViews.set(data.pointer, new ObjectView(data, 'Controller'));
    else
        monitoringViews.get(data.pointer).updateValues(data);
    setTimeout(() => requestInfo(1 /* CONTROLLER_INFO */, 0), 5000);
}
// ------------------------------------------------------------------------
//      Task info
function handleTaskData(payload) {
    const data = readStruct(payload, 0, MsgTaskInfo_t);
    let task;
    if (tasks.has(data.pointer)) {
        task = tasks.get(data.pointer);
        task.data = data;
    }
    else {
        task = { data, circuits: undefined, complete: false };
        tasks.set(data.pointer, task);
    }
    if (!task.circuits)
        requestMemData(task.data.circuitList, task.data.circuitCount, 5 /* uint32 */, circuitList => {
            task.circuits = circuitList;
            task.complete = true;
            circuitList.forEach(pointer => requestInfo(3 /* CIRCUIT_INFO */, pointer));
        });
    if (!monitoringViews.has(data.pointer))
        monitoringViews.set(data.pointer, new ObjectView(data, 'Task'));
    else
        monitoringViews.get(data.pointer).updateValues(data);
    setTimeout(() => requestInfo(2 /* TASK_INFO */, data.pointer), 5000);
}
// ------------------------------------------------------------------------
//      Circuit info
function handleCircuitData(payload) {
    const data = readStruct(payload, 0, MsgCircuitInfo_t);
    let circuit;
    if (circuits.has(data.pointer)) {
        circuit = circuits.get(data.pointer);
        circuit.data = data;
    }
    else {
        circuit = { data, funcCalls: undefined, outputRefs: undefined, complete: false };
        circuits.set(data.pointer, circuit);
    }
    if (!functionBlocks.has(data.pointer))
        requestInfo(4 /* FUNCTION_INFO */, circuit.data.pointer, () => {
            var _a;
            const funcData = (_a = functionBlocks.get(data.pointer)) === null || _a === void 0 ? void 0 : _a.data;
            if (funcData) {
                requestMemData(circuit.data.outputRefList, funcData.numOutputs, 5 /* uint32 */, outputRefs => {
                    circuit.outputRefs = outputRefs;
                    if (circuit.funcCalls)
                        circuit.complete = true;
                });
            }
        });
    if (!circuit.funcCalls)
        requestMemData(circuit.data.funcList, circuit.data.funcCount, 5 /* uint32 */, funcList => {
            circuit.funcCalls = funcList;
            if (circuit.outputRefs)
                circuit.complete = true;
            funcList.forEach(pointer => requestInfo(4 /* FUNCTION_INFO */, pointer));
        });
}
// ------------------------------------------------------------------------
//      Function Block info
function handleFunctionData(payload) {
    const data = readStruct(payload, 0, MsgFunctionInfo_t);
    let func;
    if (functionBlocks.has(data.pointer)) {
        func = functionBlocks.get(data.pointer);
        func.data = data;
    }
    else {
        func = { data, ioValues: undefined, ioFlags: undefined, name: undefined, complete: false };
        functionBlocks.set(data.pointer, func);
    }
    const ioCount = func.data.numInputs + func.data.numOutputs;
    if (!func.ioFlags)
        requestMemData(func.data.ioFlagList, ioCount, 1 /* uint8 */, ioFlags => {
            func.ioFlags = ioFlags;
            requestMemData(func.data.ioValueList, ioCount, 5 /* uint32 */, (_, data) => {
                const dataTypes = ioFlags.map(ioFlag => (ioFlag & 16 /* REF */) ? 5 /* uint32 */ : IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
                func.ioValues = readTypedValues(data, dataTypes);
                checkIfComplete();
            });
        });
    if (!func.name)
        requestMemData(func.data.namePtr, func.data.nameLength, 1 /* uint8 */, (_, data) => {
            func.name = new TextDecoder().decode(data);
            checkIfComplete();
        });
    function checkIfComplete() {
        if (func.ioValues && func.name) {
            func.complete = true;
            printFunctionBlock(func);
            monitoringEnable(func.data.pointer);
        }
    }
}
// ------------------------------------------------------------------------
//      Monitoring values
function handleMonitoringValues(pointer, data, offset = 0) {
    const func = functionBlocks.get(pointer);
    const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
    const values = readTypedValues(data, dataTypes, offset);
    monitoringValues.set(pointer, values);
    showMonitoringValues(pointer);
}
//  ------------------------------------------
//          Create monitoring view
//  ------------------------------------------
const monitoringViews = new Map();
function showMonitoringValues(pointer) {
    const values = monitoringValues.get(pointer);
    const obj = {};
    values.forEach((value, i) => obj[i + ':'] = value);
    let view = monitoringViews.get(pointer);
    if (!view) {
        const func = functionBlocks.get(pointer);
        view = new ObjectView(obj, `${func.name} [${toHex(pointer)}]`);
        monitoringViews.set(pointer, view);
    }
    else
        view.updateValues(obj);
}
// ------------------------------------------------------------------------
//      Parse opcode to library id and function id
function parseOpcode(opcode) {
    const lib_id = (opcode & 0xFF00) >>> 8;
    const func_id = opcode & 0x00FF;
    return { lib_id, func_id };
}
// ------------------------------------------------------------------------
//      Print Function Block data to log
function printFunctionBlock(func, withFlags = true) {
    if (!func.complete) {
        console.error('printFunctionBlock: FunctionBlock data is not complete');
        return;
    }
    const valuePad = 18;
    const typePad = 8;
    const lines = [];
    lines.push('');
    const { lib_id, func_id } = parseOpcode(func.data.opcode);
    lines.push(`Function Block ${func.name}:  id: ${lib_id}/${func_id}  ptr: ${toHex(func.data.pointer)}  flags: ${'b' + func.data.flags.toString(2).padStart(8, '0')}`);
    lines.push('');
    const topLine = ''.padStart(valuePad) + ' ┌─' + ''.padEnd(2 * typePad, '─') + '─┐  ' + ''.padEnd(valuePad);
    lines.push(topLine);
    const monValues = monitoringValues.get(func.data.pointer);
    for (let i = 0; i < Math.max(func.data.numInputs, func.data.numOutputs); i++) {
        let text;
        // Input value
        if (i < func.data.numInputs) {
            const ioType = func.ioFlags[i] & IO_FLAG_TYPE_MASK;
            const connected = func.ioFlags[i] & 16 /* REF */;
            const inputValue = monValues ? monValues[i] : func.ioValues[i];
            const ioTypeName = ioTypeNames[ioType];
            const valueStr = (!monValues && connected) ? toHex(func.ioValues[i])
                : (ioType == 3 /* FLOAT */) ? inputValue.toPrecision(8)
                    : inputValue.toString();
            const border = connected ? ' ┤>' : ' ┤ ';
            text = valueStr.padStart(valuePad) + border + ioTypeName.padEnd(typePad);
        }
        else
            text = ''.padStart(valuePad) + ' │ ' + ''.padEnd(typePad);
        // Output value
        const outputNum = func.data.numInputs + i;
        if (outputNum < func.ioValues.length) {
            const outputValue = monValues ? monValues[outputNum] : func.ioValues[outputNum];
            const ioType = func.ioFlags[outputNum] & IO_FLAG_TYPE_MASK;
            const ioTypeName = ioTypeNames[ioType];
            const valueStr = (ioType == 3 /* FLOAT */) ? outputValue.toPrecision(8) : outputValue.toString();
            text += ioTypeName.padStart(typePad) + ' ├ ' + valueStr.padEnd(valuePad);
        }
        else
            text += ''.padStart(typePad) + ' │ ' + ''.padEnd(valuePad);
        lines.push(text);
    }
    const bottomLine = ''.padStart(valuePad) + ' └─' + ''.padEnd(2 * typePad, '─') + '─┘  ' + ''.padEnd(valuePad);
    lines.push(bottomLine);
    if (withFlags) {
        lines.push('IO Flags:');
        func.ioFlags.forEach((flags, i) => {
            let ioType = flags & IO_FLAG_TYPE_MASK;
            let convType = flags & IO_FLAG_CONV_TYPE_MASK;
            let line = '';
            line = (line + i + ': ').padStart(20) + flags.toString(2).padStart(8, '0') + '  ' + ioTypeNames[ioType];
            if (flags & 16 /* REF */) {
                line += ' conn. ' + toHex(func.ioValues[i]) + ((flags & 32 /* REF_INVERT */) ? ' (inv) ' : '       ');
                if (convType) {
                    line += 'from ' + ioConvNames[convType];
                }
            }
            lines.push(line);
        });
    }
    UI.log.entry(lines);
}
