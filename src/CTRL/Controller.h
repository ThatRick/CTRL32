#pragma once

#include "Common.h"

#define MAX_UPDATE_INTERVAL 100U

class ControllerTask;

class Controller
{
public:
    std::vector<ControllerTask*> tasks;
    uint32_t tickCount = 0;

    Controller();

    // Returns remaining time to next pending update in ms
    uint32_t tick();

    void connected();

    void disconnected();

    int32_t freeHeap();
    int32_t cpuFreq();
    Time getTime();
};