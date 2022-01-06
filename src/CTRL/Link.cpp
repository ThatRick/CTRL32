#include "Link.h"
#include "FunctionBlock.h"
#include "ControllerTask.h"
#include "Esp.h"

Link::Link(Controller* controller, send_data_callback_t onSendData, send_text_callback_t onSendText) :
    controller (controller),
    sendData (onSendData), 
    sendText (onSendText) {
}

Link::~Link() {
    delete[] monitoringCollection;
}

void Link::connected() {
    isConnected = true;
    sendResponse(MSG_TYPE_PING, this, NULL, 0);
    for (ControllerTask* task : controller->tasks) {
        task->link = this;
    }
}

void Link::disconnected() {
    isConnected = false;
    for (ControllerTask* task : controller->tasks) {
        task->link = nullptr;
    }
}

void Link::receiveData(void* data, size_t len) {
    if (len < sizeof(MsgHeader_t)) return;

    MsgStruct_t* msg = (MsgStruct_t*)data;
    MsgHeader_t header = msg->header;
    void* pointer = (void*)header.pointer;
    void* payload = &msg->payload;
    size_t payloadSize = len - sizeof(header);
    MESSAGE_TYPE msgType = (MESSAGE_TYPE)header.msgType;

    Serial.printf("Received ws request type: %d ptr: %p size: %d \n", header.msgType, pointer, len);

    if ((header.pointer < ADDRESS_MIN || header.pointer >= ADDRESS_MAX) && header.msgType > MSG_TYPE_CONTROLLER_INFO) {
        Serial.printf("INVALID REQUEST: invalid pointer %p in message header \n", pointer);
        return;
    }

    switch(msgType)
    {
        case MSG_TYPE_CONTROLLER_INFO: {
            MsgControllerInfo_t info = {
                .freeHeap        = ESP.getFreeHeap(),
                .cpuFreq         = ESP.getCpuFreqMHz(),
                .RSSI            = controller->getRSSI(),
                .aliveTime       = (float)esp_timer_get_time() / 1000000,
                .tickCount       = controller->tickCount,
                .taskCount       = controller->tasks.size(),
                .taskList        = (uint32_t)controller->tasks.data(),
            };
            sendResponse(msgType, controller, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_TASK_INFO: {
            ControllerTask* task = (ControllerTask*)pointer;
            MsgTaskInfo_t info = {
                .interval        = task->interval_ms,
                .offset          = task->offset_ms,
                .runCount        = task->runCount,
                .lastCPUTime     = task->lastCPUTime,
                .avgCPUTime      = task->averageCPUTime(),
                .lastActInterval = task->lastActualInterval_ms,
                .avgActInterval  = task->averageActualInterval_ms(),
                .circuitCount    = task->circuits.size(),
                .circuitList     = (uint32_t)task->circuits.data()
            };
            sendResponse(msgType, task, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_CIRCUIT_INFO: {
            Circuit* circuit = (Circuit*)pointer;
            MsgCircuitInfo_t info = {
                .funcCount       = circuit->funcList.size(),
                .funcList        = (uint32_t)circuit->funcList.data(),
                .outputRefList   = (uint32_t)circuit->outputRefs,
            };
            sendResponse(msgType, circuit, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_FUNCTION_INFO: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            MsgFunctionInfo_t info = {
                .numInputs       = func->numInputs,
                .numOutputs      = func->numOutputs,
                .opcode          = func->opcode,
                .flags           = func->flags,
                .ioValuesPtr     = (uint32_t)func->ioValues,
                .ioFlagsPtr      = (uint32_t)func->ioFlags,
                .nameLength      = strlen(func->name()),
                .namePtr         = (uint32_t)func->name(),
            };
            sendResponse(msgType, func, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_GET_MEM_DATA: {
            uint32_t size = *(uint32_t*)payload;
            sendResponse(msgType, pointer, pointer, size);
            break;
        }

        case MSG_TYPE_SET_MEM_DATA: {
            memcpy(pointer, payload, payloadSize);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_ENABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            boolean once = *(uint32_t*)payload;
            func->enableMonitoring(once);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_DISABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            func->disableMonitoring();
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        // ========================================================================
        //      CREATE

        // ========================================================================
        //      REMOVE

        // ========================================================================
        //      MODIFY TASK
        
        case MSG_TYPE_TASK_START: {
            ((ControllerTask*)pointer)->start();
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_STOP: {
            ((ControllerTask*)pointer)->stop();
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_SET_INTERVAL: {
            uint32_t time = msg->payload;
            ((ControllerTask*)pointer)->setInterval(time);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_SET_OFFSET: {
            uint32_t time = msg->payload;
            ((ControllerTask*)pointer)->setOffset(time);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_ADD_CIRCUIT: {
            MsgAddItem_t* params = (MsgAddItem_t*)payload;
            ((ControllerTask*)pointer)->addCircuit((Circuit*)params->pointer, params->index);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_TASK_REMOVE_CIRCUIT: {
            Circuit* circuit = (Circuit*)msg->payload;
            ((ControllerTask*)pointer)->removeCircuit(circuit);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        // ========================================================================
        //      MODIFY CIRCUIT

        case MSG_TYPE_CIRCUIT_ADD_FUNCTION: {
            MsgAddItem_t* params = (MsgAddItem_t*)payload;
            ((Circuit*)pointer)->addFunction((FunctionBlock*)params->pointer, params->index);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        case MSG_TYPE_CIRCUIT_REMOVE_FUNCTION: {
            FunctionBlock* function = (FunctionBlock*)msg->payload;
            ((Circuit*)pointer)->removeFunction(function);
            sendConfirmation(msgType, pointer, REQUEST_SUCCESSFUL);
            break;
        }

    }
}

void Link::sendConfirmation(MESSAGE_TYPE msgType, void* pointer, REQUEST_RESULT result) {
    if (!isConnected) return;
    MsgModifyResult_t response {
        .header = {
            .msgType   = msgType,
            .pointer   = (uint32_t)pointer,
            .timeStamp = (uint32_t)(controller->getTime() / 1000ULL)
        },
        .result = result
    };
    sendData(&response, sizeof(response));
    Serial.printf("   Sent ws response type: %u ptr: %p size: %u \n", msgType, pointer, sizeof(response));
}

void Link::sendResponse(MESSAGE_TYPE msgType, void* pointer, void* payload, size_t payloadSize) {
    if (!isConnected) return;
    size_t size = sizeof(MsgHeader_t) + payloadSize;
    uint8_t data[size];
    MsgHeader_t* header = (MsgHeader_t*)data;
    header->msgType = msgType;
    header->pointer = (uint32_t)pointer;
    header->timeStamp = (uint32_t)(controller->getTime() / 1000ULL);
    if (payload) memcpy(data + sizeof(MsgHeader_t), payload, payloadSize);
    sendData(data, size);
    Serial.printf("   Sent ws response type: %u ptr: %p size: %u \n", msgType, pointer, size);
}

void Link::monitoringCollectionStart(void* reportingTask, size_t maxItemCount) {
    if (!isConnected) return;
    monitoringCollectionTask = reportingTask;
    if (monitoringCollection == nullptr || monitoringCollectionSize < maxItemCount) {
        free(monitoringCollection);
        // monitoringCollection = (MonitoringCollectionItem_t*)calloc(sizeof(MonitoringCollectionItem_t), maxItemCount);
        monitoringCollection = new MonitoringCollectionItem_t[maxItemCount];
        monitoringCollectionSize = maxItemCount;
    }
    monitoringCollectionCount = 0;
}
void Link::monitoringCollectionSend() {
    if (!isConnected || monitoringCollection == nullptr) return;
    size_t headSize = sizeof(MsgHeader_t)
                    + sizeof(MsgMonitoringCollection_t)
                    + sizeof(MsgMonitoringCollectionItem_t) * monitoringCollectionCount;
    size_t bodySize = 0;
    for (int i = 0; i < monitoringCollectionCount; i++) {
        MonitoringCollectionItem_t item = monitoringCollection[i];
        bodySize += item.size;
    }
    // Allocate memory for message from stack
    // - Future improvement: allocate memory for message data with WebSocket library API to avoid unnecessary memory copying)
    size_t dataSize = headSize + bodySize;
    uint8_t data[dataSize];
    
    // Message header data
    MsgHeader_t* header = (MsgHeader_t*)data;
    header->msgType = MSG_TYPE_MONITORING_COLLECTION;
    header->pointer = (uint32_t)monitoringCollectionTask;
    header->timeStamp = (uint32_t)(controller->getTime() / 1000ULL);
    
    // Monitoring collection info
    MsgMonitoringCollection_t* collectionInfo = (MsgMonitoringCollection_t*)(data + sizeof(MsgHeader_t));
    collectionInfo->itemCount = monitoringCollectionCount;

    // Monitoring collection item list
    MsgMonitoringCollectionItem_t* itemList = (MsgMonitoringCollectionItem_t*)(data + sizeof(MsgHeader_t) + sizeof(MsgMonitoringCollection_t));
    void* valuesData = itemList + monitoringCollectionCount;

    // Build message data
    uint16_t dataOffset = 0;
    for (int i = 0; i < monitoringCollectionCount; i++) {
        MonitoringCollectionItem_t item = monitoringCollection[i];
        MsgMonitoringCollectionItem_t* msgItem = itemList + i;
        msgItem->pointer = (uint32_t)item.func;
        msgItem->size = item.size;
        msgItem->offset = dataOffset;

        void* dataDest = (uint8_t*)valuesData + dataOffset;
        memcpy(dataDest, item.values, item.size);
        dataOffset += item.size;
    }

    Serial.printf("   Sent ws response type: %u ptr: %p payload len: %u \n", header->msgType, (void*)header->pointer, dataSize - sizeof(MsgHeader_t));
    sendData(data, dataSize);

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
    else sendResponse(MSG_TYPE_MONITORING_FUNC_VALUES, func, values, byteSize);
}
