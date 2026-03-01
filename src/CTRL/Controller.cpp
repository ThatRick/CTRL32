#include "Controller.h"
#include "CyclicTask.h"
#include "FunctionBlock.h"
#include "Circuit.h"
#include "Platform.h"

Controller::Controller() {}

// Returns next update time
Time Controller::tick() {
    tickCount++;
    Time nextUpdateTimeMin = UINT64_MAX;
    for (CyclicTask* task : tasks) {
        Time nextUpdateTime = task->tick();
        nextUpdateTimeMin = std::min(nextUpdateTimeMin, nextUpdateTime);
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
    // Remove connections to other functions in funcList
    for (FunctionBlock* func : funcList) {
        for (size_t i = 0; i < func->numInputs; i++) {
            if (func->inputRefs[i] &&
                func->inputRefs[i] >= partingFunc->outputs() &&
                func->inputRefs[i] < (partingFunc->outputs() + partingFunc->numOutputs)) {
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
        task->removeFunction(partingFunc);
    }
}

uint32_t Controller::freeHeap() { return Platform::freeHeap(); }
uint32_t Controller::cpuFreq()  { return Platform::cpuFreq(); }
    Time Controller::getTime()  { return Platform::getTime(); }
  int8_t Controller::getRSSI()  { return Platform::rssi(); }
