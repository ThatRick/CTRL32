#pragma once

#include "Common.h"
#include "Circuit.h"
#include "Controller.h"
#include "Link.h"

class ControllerTask
{
    bool        running = false;
    Time        baseTimer = 0;
    Time        prevRunTime = 0;
    Controller* controller;

public:
    std::vector<Circuit*> circuits;
    Link*       link = nullptr;

    uint32_t    interval_ms = 0;
    uint32_t    offset_ms = 0;

    uint32_t    runCount = 0;

    uint32_t    lastCPUTime = 0;
    uint32_t    cumulativeCPUTime = 0;

    uint32_t    lastActualInterval_ms = 0;
    uint32_t    cumulativeActualInterval_ms = 0;

    ControllerTask(Controller* controller, uint32_t interval_ms, uint32_t offset_ms=0);

    void start();

    void stop();

    // Returns next pending update time
    Time tick();

    inline uint64_t nextUpdateTime();

    void run();

    float averageCPUTime();

    float averageActualInterval_ms();

    bool isRunning();
    void collectMonitoringValues();
};