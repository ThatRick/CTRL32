#pragma once

#include "Common.h"

#define MAX_UPDATE_INTERVAL 100U

#define OPCODE_CIRCUIT 0

class CyclicTask;
class FunctionBlock;
class Link;

class Controller
{
public:
    std::vector<FunctionBlock*> funcList;
    std::vector<CyclicTask*> tasks;

    uint32_t tickCount = 0;

    Controller();

    // Returns next pending update time in ms
    Time tick();

    void connected();
    void disconnected();

    void addFunction(FunctionBlock* func, CyclicTask* taskNum = nullptr);
    void removeFunction(FunctionBlock* func);

    uint32_t    freeHeap();
    uint32_t    cpuFreq();
    Time        getTime();
    int8_t      getRSSI();
};