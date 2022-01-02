#include "Controller.h"
#include "ControllerTask.h"
#include "Esp.h"

Controller::Controller() {}

// Returns remaining time to next pending update in ms
uint32_t Controller::tick() {
    tickCount++;
    uint32_t nextUpdateTimeMin = UINT32_MAX;
    for (ControllerTask* task : tasks) {
        uint32_t nextUpdateTime = task->tick();
        nextUpdateTimeMin = min(nextUpdateTimeMin, nextUpdateTime);
    }
    uint32_t remainingTime_ms = (nextUpdateTimeMin - esp_timer_get_time()) / 1000;
    return min(remainingTime_ms, MAX_UPDATE_INTERVAL);
}

void Controller::connected() {
}

void Controller::disconnected() {
}

int32_t Controller::freeHeap() { return ESP.getFreeHeap(); }
int32_t Controller::cpuFreq() { return ESP.getCpuFreqMHz(); }
Time Controller::getTime() { return esp_timer_get_time(); }
