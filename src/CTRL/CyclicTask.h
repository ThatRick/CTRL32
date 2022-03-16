#pragma once

#include "Common.h"
#include "FunctionBlock.h"
#include "Controller.h"
#include "Link.h"

class CyclicTask
{
    bool        running = false;
    Time        baseTimer = 0;
    Time        prevRunTime = 0;
    Controller* controller;

public:

    std::vector<FunctionBlock*> funcList;

    Link*       link = nullptr;

    uint32_t    interval_ms = 0;
    uint32_t    offset_ms = 0;

    uint32_t    runCount = 0;

    uint32_t    lastCPUTime = 0;
    uint32_t    cumulativeCPUTime = 0;

    uint32_t    lastActualInterval_ms = 0;
    uint32_t    cumulativeActualInterval_ms = 0;

    uint32_t    drift_us = 0;

    CyclicTask(Controller* controller, uint32_t interval_ms, uint32_t offset_ms=0);

    // Returns next pending update time
    Time tick();

    void update();
    bool isRunning();
    uint64_t inline nextUpdateTime();

    float averageCPUTime();
    float averageActualInterval_ms();

    void start();
    void stop();
    void setInterval(uint32_t time);
    void setOffset(uint32_t time);
    void addFunction(FunctionBlock* func, int32_t index = -1);
    void removeFunction(FunctionBlock* func);
};