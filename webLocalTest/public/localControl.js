import { readStruct, sizeOfStruct, writeStruct, sizeOfType, typedArray, readTypedValues, readArrayOfStructs } from './TypedStructs.js';
import { ESP32, msgTypeNames, IO_FLAG_TYPE_MASK, IO_TYPE_MAP, ioTypeNames, MsgHeader_t, MsgControllerInfo_t, MsgTaskInfo_t, MsgCircuitInfo_t, MsgFunctionInfo_t, IO_FLAG_CONV_TYPE_MASK, ioConvNames, msgTypeNamesMaxLength, MsgMonitoringCollection_t, MsgMonitoringCollectionItem_t, } from './ESP32.js';
import { toHex } from './Util.js';
import { ActionButton, CreateUI, ObjectView } from './UI.js';
import { WSConnection } from './WSConnection.js';
let controller;
const tasks = new Map();
const circuits = new Map();
const functionBlocks = new Map();
const memDataRequests = new Map();
const infoRequests = new Map();
const modifyRequests = new Map();
const monitoringValues = new Map();
const UI = CreateUI();
const ws = new WSConnection('192.168.0.241');
ws.onConsoleLine = UI.log.line;
ws.onSetStatus = UI.setStatus;
new ActionButton(UI.connectionControls, 'Connect', ws.connect);
new ActionButton(UI.connectionControls, 'Disconnect', ws.disconnect);
setInterval(() => requestInfo(1 /* CONTROLLER_INFO */, 0), 1000);
ws.handleMessageData = (buffer) => {
    const { msgType, pointer, timeStamp } = readStruct(buffer, 0, MsgHeader_t);
    const payload = buffer.slice(sizeOfStruct(MsgHeader_t));
    const memArea = ESP32.findMemoryAreaForAddr(pointer);
    let memAreaText = (memArea) ? memArea.name + ' + ' + (pointer - memArea.low).toString(16) : '???';
    UI.log.line(`[Received type ${msgType.toString().padStart(2, '0')}: ${msgTypeNames[msgType].padEnd(msgTypeNamesMaxLength)}  time: ${timeStamp}  ptr: ${toHex(pointer)} (${memAreaText}) payload len: ${payload.byteLength}]`);
    switch (msgType) {
        case 0 /* PING */:
            {
                UI.log.line('PING');
                requestInfo(1 /* CONTROLLER_INFO */, 0);
                break;
            }
        case 1 /* CONTROLLER_INFO */:
            {
                const data = readStruct(payload, 0, MsgControllerInfo_t);
                handleControllerData(pointer, data);
                if (infoRequests.has(0)) {
                    infoRequests.get(0).callbackFn(data);
                    infoRequests.delete(0);
                }
                break;
            }
        case 2 /* TASK_INFO */:
            {
                UI.log.line('TASK INFO:');
                const data = readStruct(payload, 0, MsgTaskInfo_t);
                UI.log.record(data);
                handleTaskData(pointer, data);
                if (infoRequests.has(pointer)) {
                    infoRequests.get(pointer).callbackFn(data);
                    infoRequests.delete(pointer);
                }
                break;
            }
        case 3 /* CIRCUIT_INFO */:
            {
                UI.log.line('CIRCUIT INFO:');
                const data = readStruct(payload, 0, MsgCircuitInfo_t);
                UI.log.record(data);
                handleCircuitData(pointer, data);
                if (infoRequests.has(pointer)) {
                    infoRequests.get(pointer).callbackFn(data);
                    infoRequests.delete(pointer);
                }
                break;
            }
        case 4 /* FUNCTION_INFO */:
            {
                UI.log.line('FUNCTION INFO:');
                const data = readStruct(payload, 0, MsgFunctionInfo_t);
                UI.log.record(data);
                handleFunctionData(pointer, data);
                if (infoRequests.has(pointer)) {
                    infoRequests.get(pointer).callbackFn(data);
                    infoRequests.delete(pointer);
                }
                break;
            }
        case 5 /* GET_MEM_DATA */:
            {
                UI.log.line('MEMORY DATA:');
                const req = memDataRequests.get(pointer);
                if (req) {
                    const array = typedArray(payload, req.elemType);
                    const values = [...array];
                    UI.log.list(values);
                    req.callbackFn(values, payload);
                    memDataRequests.delete(pointer);
                }
                else
                    UI.log.line('Unrequested memory data received');
                break;
            }
        case 6 /* SET_MEM_DATA */:
        case 7 /* MONITORING_ENABLE */:
        case 8 /* MONITORING_DISABLE */:
            {
                const [result] = readTypedValues(payload, [5 /* uint32 */]);
                UI.log.line(`RESPONSE TO ${msgTypeNames[msgType]}: ${result ? 'SUCCESSFUL' : 'FAILED'}`);
                const req = modifyRequests.get(pointer);
                if (req) {
                    req.callbackFn(result);
                    modifyRequests.delete(pointer);
                }
                break;
            }
        case 9 /* MONITORING_FUNC_VALUES */:
            {
                if (functionBlocks.has(pointer)) {
                    handleMonitoringValues(pointer, payload);
                }
                else
                    UI.log.line('Undefined function block target for monitoring values');
                break;
            }
        case 10 /* MONITORING_COLLECTION */:
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
    }
};
//  ------------------------------------------
//          Create monitoring view
//  ------------------------------------------
let controllerInfoView;
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
//  ------------------------------------------
//      Send a info request to controller
//  ------------------------------------------
function requestInfo(msgType, pointer, callbackFn) {
    const msg = createMessageWithSize(msgType, pointer);
    if (callbackFn)
        infoRequests.set(pointer, { pointer, msgType, callbackFn });
    ws.send(msg.buffer);
}
//  -------------------------------------------------
//      Send a memory data request to controller
//  -------------------------------------------------
function requestMemData(pointer, length, elemType, callbackFn) {
    const size = length * sizeOfType(elemType);
    const buffer = createMessageWithStruct(5 /* GET_MEM_DATA */, pointer, { size: 5 /* uint32 */ }, { size });
    memDataRequests.set(pointer, { pointer, elemType, callbackFn });
    ws.send(buffer);
}
//  ----------------------------------------------------------
//      Send a request to modify memory data on controller
//  ----------------------------------------------------------
function modifyMemData(pointer, dataSource, callbackFn) {
    const buffer = createMessageWithData(6 /* SET_MEM_DATA */, pointer, dataSource);
    if (callbackFn)
        modifyRequests.set(pointer, { pointer, msgType: 6 /* SET_MEM_DATA */, callbackFn });
    ws.send(buffer);
}
//  --------------------------------------------------------------
//      Enable / Disable IO-value monitoring on function block
//  --------------------------------------------------------------
function monitoringEnable(pointer, once = false, callbackFn) {
    const buffer = createMessageWithStruct(7 /* MONITORING_ENABLE */, pointer, { once: 5 /* uint32 */ }, { once: +once });
    if (callbackFn)
        modifyRequests.set(pointer, { pointer, msgType: 6 /* SET_MEM_DATA */, callbackFn });
    ws.send(buffer);
}
function monitoringDisable(pointer, callbackFn) {
    const msg = createMessageWithSize(7 /* MONITORING_ENABLE */, pointer);
    if (callbackFn)
        modifyRequests.set(pointer, { pointer, msgType: 6 /* SET_MEM_DATA */, callbackFn });
    ws.send(msg.buffer);
}
//  --------------------------------------------------
//      Handle info data received from controller
//  --------------------------------------------------
function handleMonitoringValues(pointer, data, offset = 0) {
    const func = functionBlocks.get(pointer);
    const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
    const values = readTypedValues(data, dataTypes, offset);
    monitoringValues.set(pointer, values);
    showMonitoringValues(pointer);
}
function handleControllerData(pointer, data) {
    controller !== null && controller !== void 0 ? controller : (controller = { pointer, data, tasks: undefined, complete: false });
    controller.data = data;
    // Get task list
    if (!controller.tasks)
        requestMemData(controller.data.taskList, controller.data.taskCount, 5 /* uint32 */, taskList => {
            controller.tasks = taskList;
            controller.complete = true;
            taskList.forEach(pointer => requestInfo(2 /* TASK_INFO */, pointer));
        });
    if (!controllerInfoView)
        controllerInfoView = new ObjectView(data, 'Controller info');
    else
        controllerInfoView.updateValues(data);
}
function handleTaskData(pointer, data) {
    let task;
    if (tasks.has(pointer)) {
        task = tasks.get(pointer);
        task.data = data;
    }
    else {
        task = { pointer, data, circuits: undefined, complete: false };
        tasks.set(pointer, task);
    }
    if (!task.circuits)
        requestMemData(task.data.circuitList, task.data.circuitCount, 5 /* uint32 */, circuitList => {
            task.circuits = circuitList;
            task.complete = true;
            circuitList.forEach(pointer => requestInfo(3 /* CIRCUIT_INFO */, pointer));
        });
}
function handleCircuitData(pointer, data) {
    let circuit;
    if (circuits.has(pointer)) {
        circuit = circuits.get(pointer);
        circuit.data = data;
    }
    else {
        circuit = { pointer, data, funcCalls: undefined, outputRefs: undefined, complete: false };
        circuits.set(pointer, circuit);
    }
    if (!functionBlocks.has(pointer))
        requestInfo(4 /* FUNCTION_INFO */, circuit.pointer, () => {
            var _a;
            const funcData = (_a = functionBlocks.get(pointer)) === null || _a === void 0 ? void 0 : _a.data;
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
function handleFunctionData(pointer, data) {
    let func;
    if (functionBlocks.has(pointer)) {
        func = functionBlocks.get(pointer);
        func.data = data;
    }
    else {
        func = { pointer, data, ioValues: undefined, ioFlags: undefined, name: undefined, complete: false };
        functionBlocks.set(pointer, func);
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
            monitoringEnable(func.pointer);
        }
    }
}
//  -----------------------------------------------
//      Create Message buffer helper functions
//  -----------------------------------------------
function createMessageWithSize(msgType, pointer, payloadSize = 0) {
    const headerSize = sizeOfStruct(MsgHeader_t);
    const buffer = new ArrayBuffer(headerSize + payloadSize);
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer });
    return { buffer, payloadStart: headerSize };
}
function createMessageWithStruct(msgType, pointer, struct, values) {
    const headerSize = sizeOfStruct(MsgHeader_t);
    const buffer = new ArrayBuffer(headerSize + sizeOfStruct(struct));
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer });
    writeStruct(buffer, headerSize, struct, values);
    return buffer;
}
function createMessageWithData(msgType, pointer, data) {
    const headerSize = sizeOfStruct(MsgHeader_t);
    const buffer = new ArrayBuffer(headerSize + data.byteLength);
    writeStruct(buffer, 0, MsgHeader_t, { msgType, pointer });
    const msgBytes = new Uint8Array(buffer);
    const sourceBytes = new Uint8Array(data);
    msgBytes.set(sourceBytes, headerSize);
    return buffer;
}
function parseOpcode(opcode) {
    const lib_id = (opcode & 0xFF00) >>> 8;
    const func_id = opcode & 0x00FF;
    return { lib_id, func_id };
}
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
    lines.push(`Function Block ${func.name}:  id: ${lib_id}/${func_id}  ptr: ${toHex(func.pointer)}  flags: ${'b' + func.data.flags.toString(2).padStart(8, '0')}`);
    lines.push('');
    const topLine = ''.padStart(valuePad) + ' ┌─' + ''.padEnd(2 * typePad, '─') + '─┐  ' + ''.padEnd(valuePad);
    lines.push(topLine);
    const monValues = monitoringValues.get(func.pointer);
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
