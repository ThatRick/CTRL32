#pragma once

#include "Common.h"
#include "Controller.h"
#include "FIFO.h"
#include <map>

#define ADDRESS_MIN 0x3F400000
#define ADDRESS_MAX 0x50002000

enum REQUEST_RESULT {
    REQUEST_FAILED,     // = 0
    REQUEST_SUCCESSFUL //  > 0
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
    MSG_TYPE_MONITORING_REPORT,

    MSG_TYPE_CREATE_TASK,
    MSG_TYPE_CREATE_CIRCUIT,
    MSG_TYPE_CREATE_FUNCTION,

    MSG_TYPE_DELETE_TASK,
    MSG_TYPE_DELETE_CIRCUIT,
    MSG_TYPE_DELETE_FUNCTION,

    MSG_TYPE_TASK_START,
    MSG_TYPE_TASK_STOP,
    MSG_TYPE_TASK_SET_INTERVAL,
    MSG_TYPE_TASK_SET_OFFSET,
    MSG_TYPE_TASK_ADD_CIRCUIT,
    MSG_TYPE_TASK_REMOVE_CIRCUIT,

    MSG_TYPE_CIRCUIT_ADD_FUNCTION,
    MSG_TYPE_CIRCUIT_REMOVE_FUNCTION,
    MSG_TYPE_CIRCUIT_REORDER_FUNCTION,
    MSG_TYPE_CIRCUIT_CONNECT_OUTPUT,

    MSG_TYPE_FUNCTION_SET_IO_VALUE,
    MSG_TYPE_FUNCTION_SET_IO_FLAG,
    MSG_TYPE_FUNCTION_CONNECT_INPUT,
    MSG_TYPE_FUNCTION_DISCONNECT_INPUT,
    MSG_TYPE_FUNCTION_SET_FLAGS,
    MSG_TYPE_FUNCTION_SET_FLAG,
    MSG_TYPE_FUNCTION_CLEAR_FLAG,
};

typedef uint32_t ptr32_t;


//  Request header

struct MsgRequestHeader_t {
    uint32_t    msgType;
    uint32_t    msgID;
    uint32_t    pointer;
};

// Response header

struct MsgResponseHeader_t {
    uint32_t    msgType;
    uint32_t    msgID;
    uint32_t    result;
    uint32_t    timeStamp;
};

// Message structure

struct MsgResponse_t {
    MsgResponseHeader_t header;
    uint32_t            payload;
};

struct MsgRequest_t {
    MsgRequestHeader_t  header;
    uint32_t            payload;
};

// Info response structs

struct MsgControllerInfo_t {
    uint32_t    pointer;
    uint32_t    freeHeap;
    uint32_t    cpuFreq;
    int32_t     RSSI;
    uint32_t    aliveTime;
    uint32_t    tickCount;
    uint32_t    taskCount;
    ptr32_t     taskList;
};

struct MsgTaskInfo_t {
    uint32_t    pointer;
    uint32_t    interval;
    uint32_t    offset;
    uint32_t    runCount;
    uint32_t    lastCPUTime;
    float       avgCPUTime;
    uint32_t    lastActInterval;
    float       avgActInterval;
    uint32_t    driftTime;
    uint32_t    circuitCount;
    ptr32_t     circuitList;
};

struct MsgCircuitInfo_t {
    uint32_t    pointer;
    uint32_t    funcCount;
    ptr32_t     funcList;
    ptr32_t     outputRefList;
};

struct MsgFunctionInfo_t {
    uint32_t    pointer;
    uint8_t     numInputs;
    uint8_t     numOutputs;
    uint16_t    opcode;
    uint32_t    flags;
    ptr32_t     ioValuesPtr;
    ptr32_t     ioFlagsPtr;
    uint32_t    nameLength;
    ptr32_t     namePtr;
};

// Monitoring response structure

struct MsgMonitoringCollection_t {
    uint32_t    itemCount;
};

struct MsgMonitoringCollectionItem_t {
    uint32_t    pointer;
    uint16_t    offset;
    uint16_t    size;
};

// Create request parameters

struct MsgCreateTask_t {
    uint32_t    interval;
    uint32_t    offset;
};

struct MsgCreateFunction_t {
    uint16_t    opcode;
    uint8_t     numInputs;
    uint8_t     numOutputs;
    uint32_t    flags;
};

struct MsgAddItem_t {
    uint32_t    pointer;
    int32_t     index;
};


typedef void (*send_data_callback_t)(const void* data, size_t len);
typedef void (*send_text_callback_t)(const char* text);


class Link
{
    struct MonitoringCollectionItem_t {
        void*       func;
        void*       values;
        size_t      size;
    };

    struct RequestData_t {
        void*   data;
        size_t  size;
    };

    Controller* controller;
    send_data_callback_t sendData;
    send_text_callback_t sendText;
    bool isConnected = false;

    MonitoringCollectionItem_t* monitoringCollection = nullptr;
    size_t monitoringCollectionCount = 0;
    size_t monitoringCollectionSize = 0;
    void* monitoringCollectionTask = nullptr;

    FIFOBuffer<RequestData_t, 16> dataQueue;

    void handleRequest(void* data, size_t len);

public:

    Link(Controller* controller, send_data_callback_t onSendData, send_text_callback_t onSendText);
    ~Link();

    void connected();
    void disconnected();

    void receiveData(void* data, size_t len);

    void sendConfirmation(MsgRequestHeader_t request, REQUEST_RESULT result);

    void sendResponse(MsgRequestHeader_t request, void* payload = nullptr, size_t payloadSize = 0);

    void monitoringCollectionStart(void* reportingTask, size_t funcCount);
    void monitoringCollectionSend();
    void monitoringCollectionEnd();
    void monitoringValueHandler(void* func, void* values, uint32_t byteSize);
    
    void processData();

    void sendControllerInfo();
};