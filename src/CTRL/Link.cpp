#include "Link.h"
#include "FunctionBlock.h"
#include "ControllerTask.h"
#include "Esp.h"

Link::Link(Controller* controller, send_data_callback_t onSendData, send_text_callback_t onSendText) :
    controller (controller),
    sendData (onSendData), 
    sendText (onSendText) {
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

    Serial.printf("Received ws request type: %d ptr: %p size: %d \n", header.msgType, pointer, len);

    if ((header.pointer < ADDRESS_MIN || header.pointer >= ADDRESS_MAX) && header.msgType > MSG_TYPE_CONTROLLER_INFO) {
        Serial.printf("INVALID REQUEST: invalid pointer %p in message header \n", pointer);
        return;
    }

    switch(header.msgType)
    {
        case MSG_TYPE_CONTROLLER_INFO: {
            MsgControllerInfo_t info;
            info.freeHeap        = ESP.getFreeHeap();
            info.cpuFreq         = ESP.getCpuFreqMHz();
            info.aliveTime       = (float)esp_timer_get_time() / 1000000;
            info.tickCount       = controller->tickCount;
            info.taskCount       = controller->tasks.size();
            info.taskList        = (uint32_t)controller->tasks.data();

            sendResponse(MSG_TYPE_CONTROLLER_INFO, controller, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_TASK_INFO: {
            ControllerTask* task = (ControllerTask*)pointer;
            MsgTaskInfo_t info;
            info.interval        = task->interval_ms;
            info.offset          = task->offset_ms;
            info.runCount        = task->runCount;
            info.lastCPUTime     = task->lastCPUTime;
            info.avgCPUTime      = task->averageCPUTime();
            info.lastActInterval = task->lastActualInterval_ms;
            info.avgActInterval  = task->averageActualInterval_ms();
            info.circuitCount    = task->circuits.size();
            info.circuitList     = (uint32_t)task->circuits.data();

            sendResponse(MSG_TYPE_TASK_INFO, task, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_CIRCUIT_INFO: {
            Circuit* circuit = (Circuit*)pointer;
            MsgCircuitInfo_t info;
            info.funcCount       = circuit->funcList.size();
            info.funcList        = (uint32_t)circuit->funcList.data();
            info.outputRefList   = (uint32_t)circuit->outputRefs;

            sendResponse(MSG_TYPE_CIRCUIT_INFO, circuit, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_FUNCTION_INFO: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            MsgFunctionInfo_t info;
            info.opcode          = func->opcode;
            info.numInputs       = func->numInputs;
            info.numOutputs      = func->numOutputs;
            info.flags           = func->flags;
            info.ioValuesPtr     = (uint32_t)func->ioValues;
            info.ioFlagsPtr      = (uint32_t)func->ioFlags;
            info.nameLength      = strlen(func->name());
            info.namePtr         = (uint32_t)func->name();

            sendResponse(MSG_TYPE_FUNCTION_INFO, func, &info, sizeof(info));
            break;
        }

        case MSG_TYPE_GET_MEM_DATA: {
            uint32_t size = *(uint32_t*)payload;
            sendResponse(MSG_TYPE_GET_MEM_DATA, pointer, pointer, size);
            break;
        }

        case MSG_TYPE_SET_MEM_DATA: {
            memcpy(pointer, payload, payloadSize);
            sendConfirmation(MSG_TYPE_SET_MEM_DATA, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_ENABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            boolean once = *(uint32_t*)payload;
            func->enableMonitoring(once);
            sendConfirmation(MSG_TYPE_MONITORING_ENABLE, pointer, REQUEST_SUCCESSFUL);
            break;
        }

        case MSG_TYPE_MONITORING_DISABLE: {
            FunctionBlock* func = (FunctionBlock*)pointer;
            func->disableMonitoring();
            sendConfirmation(MSG_TYPE_MONITORING_DISABLE, pointer, REQUEST_SUCCESSFUL);
            break;
        }
        }
}

void Link::sendConfirmation(MESSAGE_TYPE msgType, void* pointer, REQUEST_RESULT result) {
    if (!isConnected) return;
    MsgModifyResult_t response;
    response.header.msgType = msgType;
    response.header.pointer = (uint32_t)pointer;
    response.result = result;
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
    if (payload) memcpy(data + sizeof(MsgHeader_t), payload, payloadSize);
    sendData(data, size);
    Serial.printf("   Sent ws response type: %u ptr: %p size: %u \n", msgType, pointer, size);
}

void Link::monitoringValueHandler(void* func, void* values, uint32_t byteSize) {
    sendResponse(MSG_TYPE_MONITORING_VALUES, func, values, byteSize);
}
