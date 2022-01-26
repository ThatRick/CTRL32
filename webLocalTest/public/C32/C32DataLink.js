import { readStruct, sizeOfStruct, writeStruct, sizeOfType, typedArray, readTypedValues, readArrayOfStructs } from '../TypedStructs.js';
import { msgTypeNames, IO_FLAG_TYPE_MASK, IO_TYPE_MAP, MsgRequestHeader_t, MsgControllerInfo_t, MsgTaskInfo_t, MsgCircuitInfo_t, MsgFunctionInfo_t, msgTypeNamesMaxLength, MsgMonitoringCollection_t, MsgMonitoringCollectionItem_t, MsgResponseHeader_t, } from './C32Types.js';
import { C32Function } from './C32Function.js';
import { C32Circuit } from './C32Circuit.js';
import { C32Task } from './C32Task.js';
import { C32Controller } from './C32Controller.js';
export class C32DataLink {
    constructor(client) {
        this.tasks = new Map();
        this.circuits = new Map();
        this.functionBlocks = new Map();
        this.msgID = 1;
        this.memDataRequests = new Map();
        this.requestCallbacks = new Map();
        this.log = {
            line: (line) => console.log(line),
            list: (list) => list.forEach(line => console.log(line))
        };
        ///////////////////////////////////////////////////////////////////////////
        //                  Handle Messages from Controller
        ///////////////////////////////////////////////////////////////////////////
        this.handleMessageData = (buffer) => {
            const { msgType, msgID, result, timeStamp } = readStruct(buffer, 0, MsgResponseHeader_t);
            const payload = buffer.slice(sizeOfStruct(MsgResponseHeader_t));
            this.log.line(`[Response #${(msgID + '  ' + msgTypeNames[msgType]).padEnd(msgTypeNamesMaxLength)}  result: ${result}  time: ${timeStamp}  payload len: ${payload.byteLength}]`);
            switch (msgType) {
                case 0 /* PING */:
                    this.requestInfo(1 /* CONTROLLER_INFO */, 0);
                    break;
                case 1 /* CONTROLLER_INFO */:
                    this.handleControllerData(payload);
                    break;
                case 2 /* TASK_INFO */:
                    this.handleTaskData(payload);
                    break;
                case 3 /* CIRCUIT_INFO */:
                    this.handleCircuitData(payload);
                    break;
                case 4 /* FUNCTION_INFO */:
                    this.handleFunctionData(payload);
                    break;
                case 5 /* GET_MEM_DATA */:
                    {
                        this.log.line('MEMORY DATA:');
                        const req = this.memDataRequests.get(msgID);
                        if (req) {
                            const array = typedArray(payload, req.elemType);
                            const values = [...array];
                            this.log.list(values);
                            req.callback(values, payload);
                            this.memDataRequests.delete(msgID);
                        }
                        else
                            this.log.line('Error: Unrequested memory data received');
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
                            const valueDataOffset = valueDataStart + item.offset;
                            this.handleMonitoringValues(item.pointer, payload, valueDataOffset);
                        });
                        break;
                    }
                default:
                    {
                        this.log.line('Error: Unknown message type');
                    }
                    const pendingRequest = this.requestCallbacks.get(msgID);
                    if (pendingRequest) {
                        pendingRequest.callback(result);
                        this.requestCallbacks.delete(msgID);
                    }
            }
        };
        this.client = client;
        this.client.onBinaryDataReceived = this.handleMessageData;
    }
    ///////////////////////////////////////////////////////////////////////////
    //      REQUESTS TO CONTROLLER
    ///////////////////////////////////////////////////////////////////////////
    //      Send a info request to controlle
    requestInfo(msgType, pointer, callback) {
        this.sendMessage(msgType, pointer, callback);
    }
    //      Send a memory data request to controller
    requestMemData(pointer, length, elemType, callback) {
        const size = length * sizeOfType(elemType);
        this.memDataRequests.set(this.msgID, { pointer, elemType, callback });
        this.sendMessageWithStruct(5 /* GET_MEM_DATA */, pointer, { size: 5 /* uint32 */ }, { size });
    }
    //      Send a request to modify memory data on controller
    modifyMemData(pointer, dataSource, callback) {
        this.sendMessageWithData(6 /* SET_MEM_DATA */, pointer, dataSource, callback);
    }
    //      Enable / Disable IO-value monitoring on function block
    monitoringEnable(pointer, once = false, callback) {
        this.sendMessageWithStruct(7 /* MONITORING_ENABLE */, pointer, { once: 5 /* uint32 */ }, { once: +once }, callback);
    }
    monitoringDisable(pointer, callback) {
        this.sendMessage(8 /* MONITORING_DISABLE */, pointer, callback);
    }
    //      Modify task on controller
    taskStart(pointer, callback) {
        this.sendMessage(16 /* TASK_START */, pointer, callback);
    }
    taskStop(pointer, callback) {
        this.sendMessage(17 /* TASK_STOP */, pointer, callback);
    }
    //      Create a message buffer with given payload size
    createMessageBuffer(msgType, pointer, payloadSize, callback) {
        const headerSize = sizeOfStruct(MsgRequestHeader_t);
        const buffer = new ArrayBuffer(headerSize + payloadSize);
        writeStruct(buffer, 0, MsgRequestHeader_t, { msgType, msgID: this.msgID, pointer });
        if (callback)
            this.requestCallbacks.set(this.msgID, { pointer, msgType, callback });
        return { buffer, payloadStart: headerSize };
    }
    //      Send a message with no payload
    sendMessage(msgType, pointer, callback) {
        const { buffer } = this.createMessageBuffer(msgType, pointer, 0, callback);
        this.sendBuffer(buffer);
    }
    //      Send a message with Typed Struct payload
    sendMessageWithStruct(msgType, pointer, struct, values, callback) {
        const { buffer, payloadStart } = this.createMessageBuffer(msgType, pointer, sizeOfStruct(struct), callback);
        writeStruct(buffer, payloadStart, struct, values);
        this.sendBuffer(buffer);
    }
    //      Send a message with ArrayBuffer payload
    sendMessageWithData(msgType, pointer, data, callback) {
        const { buffer, payloadStart } = this.createMessageBuffer(msgType, pointer, data.byteLength, callback);
        const msgBytes = new Uint8Array(buffer);
        const sourceBytes = new Uint8Array(data);
        msgBytes.set(sourceBytes, payloadStart);
        this.sendBuffer(buffer);
    }
    //      Send a message buffer
    sendBuffer(buffer) {
        this.client.sendBinaryData(buffer);
        this.msgID++;
    }
    ///////////////////////////////////////////////////////////////////////////
    //                      Message data handlers
    ///////////////////////////////////////////////////////////////////////////
    // ------------------------------------------------------------------------
    //      Controller info
    handleControllerData(payload) {
        const data = readStruct(payload, 0, MsgControllerInfo_t);
        this.controller = new C32Controller(data, this);
    }
    // ------------------------------------------------------------------------
    //      Task info
    handleTaskData(payload) {
        const data = readStruct(payload, 0, MsgTaskInfo_t);
        const task = new C32Task(data, this);
        if (this.tasks.has(data.pointer)) {
            const oldtask = this.tasks.get(data.pointer);
            oldtask.remove();
        }
        this.tasks.set(data.pointer, task);
    }
    // ------------------------------------------------------------------------
    //      Circuit info
    handleCircuitData(payload) {
        const data = readStruct(payload, 0, MsgCircuitInfo_t);
        const circuit = new C32Circuit(data, this);
        if (this.circuits.has(data.pointer)) {
            const oldcircuit = this.circuits.get(data.pointer);
            oldcircuit.remove();
        }
        this.circuits.set(data.pointer, circuit);
    }
    // ------------------------------------------------------------------------
    //      Function Block info
    handleFunctionData(payload) {
        const data = readStruct(payload, 0, MsgFunctionInfo_t);
        const func = new C32Function(data, this);
        if (this.functionBlocks.has(data.pointer)) {
            const oldfunc = this.functionBlocks.get(data.pointer);
            oldfunc.remove();
        }
        this.functionBlocks.set(data.pointer, func);
    }
    // ------------------------------------------------------------------------
    //      Function monitoring values
    handleMonitoringValues(pointer, data, offset = 0) {
        const func = this.functionBlocks.get(pointer);
        const dataTypes = func.ioFlags.map(ioFlag => IO_TYPE_MAP[ioFlag & IO_FLAG_TYPE_MASK]);
        const values = readTypedValues(data, dataTypes, offset);
        func.setMonitoringValues(values);
    }
}
