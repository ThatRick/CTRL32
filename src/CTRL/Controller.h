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

    uint32_t freeHeap();
    uint32_t cpuFreq();
    Time getTime();
    int8_t getRSSI();
};