#include "Link.h"
#include "FunctionBlock.h"
#include "Circuit.h"
#include "CyclicTask.h"
#include "Platform.h"

#include <cstring>
#include <vector>

#define LOG_INFO 0

Link::Link(Controller* controller, send_data_callback_t onSendData, send_text_callback_t onSendText) :
    controller (controller),
    sendData (onSendData),
    sendText (onSendText)
{
    initMonitoringSet();
}

Link::~Link() {
    delete[] monitoringCollection;
}

void Link::connected() {
    isConnected = true;
    MsgResponseHeader_t response {
        .msgType    = MSG_TYPE_PING,
        .msgID      = 0,
        .result     = REQUEST_SUCCESSFUL,
        .timeStamp  = (uint32_t)(controller->getTime() / 1000ULL)
    };
    sendData(&response, sizeof(response));
}

void Link::disconnected() {
    isConnected = false;
}

void Link::receiveData(void* data, size_t len) {
    if (len < sizeof(MsgRequestHeader_t)) return;
    void* store = malloc(len);
    memcpy(store, data, len);
    RequestData_t cmd = {
        .data = store,
        .size = len
    };
    if (!dataQueue.push(cmd)) {
        Platform::log("Link command buffer full!\n");
    }
}

void Link::processData() {
    while (!dataQueue.wasEmpty()) {
        RequestData_t* cmd = dataQueue.pop();
        handleRequest(cmd->data, cmd->size);
        free(cmd->data);
    }
    reportMonitoringData();
}

void Link::handleRequest(void* data, size_t len) {

    MsgRequest_t* msg = (MsgRequest_t*)data;
    MsgRequestHeader_t header = msg->header;
    void* pointer = (void*)header.pointer;
    void* payload = &msg->payload;
    size_t payloadSize = len - sizeof(header);
    MESSAGE_TYPE msgType = (MESSAGE_TYPE)header.msgType;

    if (LOG_INFO) Platform::log("Received ws request type: %d ptr: %p size: %zu \n", header.msgType, pointer, len);

    switch(msgType)
    {
        case MSG_TYPE_PING: {
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_CONTROLLER_INFO: {
            MsgControllerInfo_t info = {
                .pointer         = (ptr_t)controller,
                .freeHeap        = controller->freeHeap(),
                .cpuFreq         = controller->cpuFreq(),
                .RSSI            = controller->getRSSI(),
                .aliveTime       = (uint32_t)(controller->getTime() / 1000000ULL),
                .tickCount       = controller->tickCount,
                .taskCount       = (uint32_t)controller->tasks.size(),
                .taskList        = (ptr_t)controller->tasks.data(),
                .funcCount       = (uint32_t)controller->funcList.size(),
                .funcList        = (ptr_t)controller->funcList.data()
            };
            sendResponse(header, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_TASK_INFO: {
            CyclicTask* task = (CyclicTask*)pointer;
            MsgTaskInfo_t info = {
                .pointer         = (ptr_t)task,
                .interval        = task->interval_ms,
                .offset          = task->offset_ms,
                .runCount        = task->runCount,
                .lastCPUTime     = task->lastCPUTime,
                .avgCPUTime      = task->averageCPUTime(),
                .lastActInterval = task->lastActualInterval_ms,
                .avgActInterval  = task->averageActualInterval_ms(),
                .driftTime       = task->drift_us,
                .funcCount       = (uint32_t)task->funcList.size(),
                .funcList        = (ptr_t)task->funcList.data()
            };
            sendResponse(header, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_CIRCUIT_INFO: {
            Circuit* circuit = (Circuit*)pointer;
            MsgCircuitInfo_t info = {
                .pointer         = (ptr_t)circuit,
                .funcCount       = (uint32_t)circuit->funcList.size(),
                .funcList        = (ptr_t)circuit->funcList.data(),
                .outputRefCount  = circuit->numOutputs,
                .outputRefList   = (ptr_t)circuit->outputRefs,
            };
            sendResponse(header, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_FUNCTION_INFO: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            MsgFunctionInfo_t info = {
                .pointer         = (ptr_t)func,
                .numInputs       = func->numInputs,
                .numOutputs      = func->numOutputs,
                .opcode          = func->opcode,
                .flags           = func->flags,
                .ioValuesPtr     = (ptr_t)func->ioValues,
                .ioFlagsPtr      = (ptr_t)func->ioFlags,
                .nameLength      = (uint32_t)strlen(func->name()),
                .namePtr         = (ptr_t)func->name(),
            };
            sendResponse(header, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_GET_MEM_DATA: {
            uint32_t size = *(uint32_t*)payload;
            sendResponse(header, pointer, size);
            break;
        }

        case MSG_TYPE_SET_MEM_DATA: {
            memcpy(pointer, payload, payloadSize);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_ENABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            bool once = msg->payload;
            func->enableMonitoring(once);
            monitoredFunctions.insert(func);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_DISABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            func->disableMonitoring();
            monitoredFunctions.erase(func);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_REPORT: {
            break;
        }

        // ========================================================================
        //      CREATE

        case MSG_TYPE_CREATE_TASK: {
            break;
        }

        case MSG_TYPE_CREATE_CIRCUIT: {
            break;
        }

        case MSG_TYPE_CREATE_FUNCTION: {
            break;
        }

        // ========================================================================
        //      REMOVE

        case MSG_TYPE_DELETE_TASK: {
            break;
        }
        case MSG_TYPE_DELETE_CIRCUIT: {
            break;
        }
        case MSG_TYPE_DELETE_FUNCTION: {
            break;
        }

        // ========================================================================
        //      MODIFY CONTROLLER TASK

        case MSG_TYPE_TASK_START: {
            ((CyclicTask*)pointer)->start();
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_STOP: {
            ((CyclicTask*)pointer)->stop();
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_SET_INTERVAL: {
            uint32_t time = msg->payload;
            ((CyclicTask*)pointer)->setInterval(time);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_SET_OFFSET: {
            uint32_t time = msg->payload;
            ((CyclicTask*)pointer)->setOffset(time);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_ADD_FUNCTION: {
            MsgAddItem_t* params = (MsgAddItem_t*)payload;
            ((CyclicTask*)pointer)->addFunction((FunctionBlock*)params->pointer, params->index);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_REMOVE_FUNCTION: {
            FunctionBlock* func = (FunctionBlock*)(uintptr_t)msg->payload;
            ((CyclicTask*)pointer)->removeFunction(func);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        // ========================================================================
        //      MODIFY CIRCUIT

        case MSG_TYPE_CIRCUIT_ADD_FUNCTION: {
            MsgAddItem_t* params = (MsgAddItem_t*)payload;
            ((Circuit*)pointer)->addFunction((FunctionBlock*)params->pointer, params->index);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_CIRCUIT_REMOVE_FUNCTION: {
            FunctionBlock* function = (FunctionBlock*)(uintptr_t)msg->payload;
            ((Circuit*)pointer)->removeFunction(function);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_CIRCUIT_REORDER_FUNCTION: {
            MsgAddItem_t* params = (MsgAddItem_t*)payload;
            ((Circuit*)pointer)->reorderFunction((FunctionBlock*)params->pointer, params->index);
            sendConfirmation(header, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_CIRCUIT_CONNECT_OUTPUT: {
            break;
        }

        // ========================================================================
        //      MODIFY FUNCTION

        case MSG_TYPE_FUNCTION_SET_IO_VALUE: {
            break;
        }
        case MSG_TYPE_FUNCTION_SET_IO_FLAG: {
            break;
        }
        case MSG_TYPE_FUNCTION_CONNECT_INPUT: {
            break;
        }
        case MSG_TYPE_FUNCTION_DISCONNECT_INPUT: {
            break;
        }
        case MSG_TYPE_FUNCTION_SET_FLAGS: {
            break;
        }
        case MSG_TYPE_FUNCTION_SET_FLAG: {
            break;
        }
        case MSG_TYPE_FUNCTION_CLEAR_FLAG: {
            break;
        }
    }
}

void Link::sendConfirmation(MsgRequestHeader_t request, REQUEST_RESULT result) {
    if (!isConnected) return;
    MsgResponseHeader_t response {
        .msgType    = request.msgType,
        .msgID      = request.msgID,
        .result     = (uint32_t)result,
        .timeStamp  = (uint32_t)(controller->getTime() / 1000ULL)
    };
    sendData(&response, sizeof(response));
    if (LOG_INFO) Platform::log("   Sent ws response id: %u size: %zu \n", request.msgID, sizeof(response));
}

void Link::sendResponse(MsgRequestHeader_t request, void* payload, size_t payloadSize) {
    if (!isConnected) return;
    size_t size = sizeof(MsgResponseHeader_t) + payloadSize;
    std::vector<uint8_t> data(size);
    MsgResponseHeader_t* header = (MsgResponseHeader_t*)data.data();
    header->msgType = request.msgType;
    header->msgID = request.msgID;
    header->result = REQUEST_SUCCESSFUL;
    header->timeStamp = (uint32_t)(controller->getTime() / 1000ULL);
    if (payload) memcpy(data.data() + sizeof(MsgResponseHeader_t), payload, payloadSize);
    sendData(data.data(), size);
    if (LOG_INFO) Platform::log("   Sent ws response id: %u size: %zu \n", request.msgID, size);
}

void Link::iterateForMonitoredFunctions(FunctionBlock* func) {
    if (func->flags & FUNC_FLAG_MONITORING) monitoredFunctions.insert(func);

    if (func->opcode == OPCODE_CIRCUIT) {
        Circuit* circ = (Circuit*)func;
        for (FunctionBlock* childFunc : circ->funcList) {
            iterateForMonitoredFunctions(childFunc);
        }
    }
}

void Link::initMonitoringSet() {
    for (FunctionBlock* func : controller->funcList) {
        iterateForMonitoredFunctions(func);
    }
    nextMonitoringReportTime = controller->getTime() + monitoringDataInterval_ms * 1000;
}

void Link::reportMonitoringData() {

    Time now = controller->getTime();

    if ( nextMonitoringReportTime > now || monitoredFunctions.size() == 0 ) return;

    while (nextMonitoringReportTime < now)
        nextMonitoringReportTime += monitoringDataInterval_ms * 1000;

    monitoringCollectionStart(this, monitoredFunctions.size());

    for (auto it = monitoredFunctions.begin(); it != monitoredFunctions.end(); ) {
        FunctionBlock* func = *it;
        func->reportMonitoringValues(this);

        if (func->flags & FUNC_FLAG_MONITOR_ONCE) {
            func->disableMonitoring();
            it = monitoredFunctions.erase(it);
        } else {
            ++it;
        }
    }

    monitoringCollectionSend();
}

void Link::monitoringCollectionStart(void* reportingTask, size_t maxItemCount) {
    if (!isConnected) return;
    monitoringCollectionTask = reportingTask;
    if (monitoringCollection == nullptr || monitoringCollectionSize < maxItemCount) {
        free(monitoringCollection);
        monitoringCollection = new MonitoringCollectionItem_t[maxItemCount];
        monitoringCollectionSize = maxItemCount;
    }
    monitoringCollectionCount = 0;
}
void Link::monitoringCollectionSend() {
    if (!isConnected || monitoringCollection == nullptr) return;
    size_t headSize = sizeof(MsgResponseHeader_t)
                    + sizeof(MsgMonitoringCollection_t)
                    + sizeof(MsgMonitoringCollectionItem_t) * monitoringCollectionCount;
    size_t bodySize = 0;
    for (size_t i = 0; i < monitoringCollectionCount; i++) {
        MonitoringCollectionItem_t item = monitoringCollection[i];
        bodySize += item.size;
    }
    // Allocate message buffer
    size_t dataSize = headSize + bodySize;
    std::vector<uint8_t> data(dataSize);

    // Message header data
    MsgResponseHeader_t* header = (MsgResponseHeader_t*)data.data();
    header->msgType = MSG_TYPE_MONITORING_REPORT;
    header->msgID = 0;
    header->timeStamp = (uint32_t)(controller->getTime() / 1000ULL);

    // Monitoring collection info
    MsgMonitoringCollection_t* collectionInfo = (MsgMonitoringCollection_t*)(data.data() + sizeof(MsgResponseHeader_t));
    collectionInfo->itemCount = monitoringCollectionCount;

    // Monitoring collection item list
    MsgMonitoringCollectionItem_t* itemList = (MsgMonitoringCollectionItem_t*)(data.data() + sizeof(MsgResponseHeader_t) + sizeof(MsgMonitoringCollection_t));
    void* valuesData = itemList + monitoringCollectionCount;

    // Build message data
    uint16_t dataOffset = 0;
    for (size_t i = 0; i < monitoringCollectionCount; i++) {
        MonitoringCollectionItem_t item = monitoringCollection[i];
        MsgMonitoringCollectionItem_t* msgItem = itemList + i;
        msgItem->pointer = (ptr_t)item.func;
        msgItem->size = item.size;
        msgItem->offset = dataOffset;

        void* dataDest = (uint8_t*)valuesData + dataOffset;
        memcpy(dataDest, item.values, item.size);
        dataOffset += item.size;
    }

    if (LOG_INFO) Platform::log("   Sent ws response type: %u payload len: %zu \n", header->msgType, dataSize - sizeof(MsgResponseHeader_t));
    sendData(data.data(), dataSize);

    monitoringCollectionCount = 0;
}

void Link::monitoringCollectionEnd() {
    delete[] monitoringCollection;
    monitoringCollectionCount = 0;
}

void Link::monitoringValueHandler(void* func, void* values, uint32_t byteSize) {
    if (!isConnected) return;
    if (monitoringCollection) {
        monitoringCollection[monitoringCollectionCount++] = {
            .func = func,
            .values = values,
            .size = byteSize
        };
        if (monitoringCollectionCount > monitoringCollectionSize) monitoringCollectionSend();
    }
}
