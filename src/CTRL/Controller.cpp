#include "Controller.h"
#include "ControllerTask.h"
#include "Esp.h"
#include "Wifi.h"

Controller::Controller() {}

// Returns next update time
Time Controller::tick() {
    tickCount++;
    Time nextUpdateTimeMin = UINT32_MAX;
    for (ControllerTask* task : tasks) {
        Time nextUpdateTime = task->tick();
        nextUpdateTimeMin = min(nextUpdateTimeMin, nextUpdateTime);
    }
    return nextUpdateTimeMin;
}

void Controller::connected() {
}

void Controller::disconnected() {
}

uint32_t Controller::freeHeap() { return ESP.getFreeHeap(); }
uint32_t Controller::cpuFreq()  { return ESP.getCpuFreqMHz(); }
    Time Controller::getTime()  { return esp_timer_get_time(); }
  int8_t Controller::getRSSI()  { return WiFi.RSSI(); }


