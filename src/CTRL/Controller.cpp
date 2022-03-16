#include "Controller.h"
#include "CyclicTask.h"
#include "Esp.h"
#include "Wifi.h"
#include "Circuit.h"

Controller::Controller() {}

// Returns next update time
Time Controller::tick() {
    tickCount++;
    Time nextUpdateTimeMin = UINT32_MAX;
    for (CyclicTask* task : tasks) {
        Time nextUpdateTime = task->tick();
        nextUpdateTimeMin = min(nextUpdateTimeMin, nextUpdateTime);
    }
    return nextUpdateTimeMin;
}

void Controller::connected() {}

void Controller::disconnected() {}

void Controller::addFunction(FunctionBlock* func, CyclicTask* task) {
    funcList.push_back(func);

    if (task) task->addFunction(func);
}

void Controller::removeFunction(FunctionBlock* partingFunc) {
    // Remove connections to other functions in funList
    for (FunctionBlock* func : funcList) {
        for (size_t i = 0; i < func->numInputs; i++) {
            if (func->inputFlags()[i] & IO_FLAG_REF &&
                func->inputValue(i).ref >= partingFunc->outputs() &&
                func->inputValue(i).ref < (partingFunc->outputs() + partingFunc->numOutputs)) {
                    func->disconnectInput(i);
            }
        }
    }
    // Erase parting function from funcList
    for (size_t i = 0; i < funcList.size(); i++) {
        if (funcList.at(i) == partingFunc) {
            funcList.erase(funcList.begin() + i);
            break;
        }
    }
    // Erase parting function from tasks
    for (CyclicTask* task : tasks) {
        for (size_t i = 0; i < task->funcList.size(); i++) {
            if (task->funcList.at(i) == partingFunc) {
                task->funcList.erase(task->funcList.begin() + i);
                break;
            }
        }
    }
}

uint32_t Controller::freeHeap() { return ESP.getFreeHeap(); }
uint32_t Controller::cpuFreq()  { return ESP.getCpuFreqMHz(); }
    Time Controller::getTime()  { return esp_timer_get_time(); }
  int8_t Controller::getRSSI()  { return WiFi.RSSI(); }


