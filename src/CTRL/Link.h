#pragma once

#include "Common.h"
#include "Controller.h"

#define ADDRESS_MIN 0x3F400000
#define ADDRESS_MAX 0x50002000

enum REQUEST_RESULT {
    REQUEST_FAILED,
    REQUEST_SUCCESSFUL
};

enum MESSAGE_TYPE {
    MSG_TYPE_PING,
    MSG_TYPE_CONTROLLER_INFO,
    MSG_TYPE_TASK_INFO,
    MSG_TYPE_CIRCUIT_INFO,
    MSG_TYPE_FUNCTION_INFO,
    MSG_TYPE_GET_MEM_DATA,
    MSG_TYPE_SET_MEM_DATA,
    MSG_TYPE_MONITORING_ENABLE,
    MSG_TYPE_MONITORING_DISABLE,
    MSG_TYPE_MONITORING_FUNC_VALUES,
    MSG_TYPE_MONITORING_COLLECTION
};

typedef uint32_t ptr32_t;

//
//  Common header for all messages
//
struct MsgHeader_t {
    uint32_t    msgType;
    uint32_t    pointer;
    uint32_t    timeStamp;
};
//
//  Common message structure to get header and start point to payload
//
struct MsgStruct_t {
    MsgHeader_t header;
    uint32_t    payload;
};
//
//  Response to modify request with result SUCCESSFUL or FAILED
//
struct MsgModifyResult_t {
    MsgHeader_t header;
    uint32_t    result;
};

struct MsgControllerInfo_t {
    uint32_t    freeHeap;
    uint32_t    cpuFreq;
    int32_t     RSSI;
    float       aliveTime;
    uint32_t    tickCount;
    uint32_t    taskCount;
    ptr32_t     taskList;
};

struct MsgTaskInfo_t {
    uint32_t    interval;
    uint32_t    offset;
    uint32_t    runCount;
    uint32_t    lastCPUTime;
    float       avgCPUTime;
    uint32_t    lastActInterval;
    float       avgActInterval;
    uint32_t    circuitCount;
    ptr32_t     circuitList;
};

struct MsgCircuitInfo_t {
    uint32_t    funcCount;
    ptr32_t     funcList;
    ptr32_t     outputRefList;
};

struct MsgFunctionInfo_t {
    uint8_t     numInputs;
    uint8_t     numOutputs;
    uint16_t    opcode;
    uint32_t    flags;

    ptr32_t     ioValuesPtr;
    ptr32_t     ioFlagsPtr;
    uint32_t    nameLength;
    ptr32_t     namePtr;
};

struct MsgMonitoringCollection_t {
    uint32_t    itemCount;
};
struct MsgMonitoringCollectionItem_t {
    uint32_t    pointer;
    uint16_t    offset;
    uint16_t    size;
};

struct MonitoringCollectionItem_t {
    void*       func;
    void*       values;
    size_t      size;
};

typedef void (*send_data_callback_t)(const void* data, size_t len);
typedef void (*send_text_callback_t)(const char* text);


class Link
{
    Controller* controller;
    send_data_callback_t sendData;
    send_text_callback_t sendText;
    bool isConnected = false;

    MonitoringCollectionItem_t* monitoringCollection = nullptr;
    size_t monitoringCollectionCount = 0;
    size_t monitoringCollectionSize = 0;
    void* monitoringCollectionTask = nullptr;

public:

    Link(Controller* controller, send_data_callback_t onSendData, send_text_callback_t onSendText);
    ~Link();

    void connected();
    void disconnected();

    void receiveData(void* data, size_t len);

    void sendConfirmation(MESSAGE_TYPE msgType, void* pointer, REQUEST_RESULT result);

    void sendResponse(MESSAGE_TYPE msgType, void* pointer, void* payload = nullptr, size_t payloadSize = 0);

    void monitoringCollectionStart(void* reportingTask, size_t funcCount);
    void monitoringCollectionSend();
    void monitoringCollectionEnd();
    void monitoringValueHandler(void* func, void* values, uint32_t byteSize);
};