#include "CyclicTask.h"
#include "Circuit.h"
#include "Esp.h"

CyclicTask::CyclicTask(Controller* controller, uint32_t interval_ms, uint32_t offset_ms) :
    controller (controller),
    interval_ms (interval_ms),
    offset_ms (offset_ms)
{}

void CyclicTask::start() {
    Time now = controller->getTime();
    running = true;
    uint64_t interval_us = interval_ms * 1000;
    // Align base timer by interval time to make offset time independent from start time
    baseTimer = (now / interval_us) * interval_us;
    while (nextUpdateTime() < now)
        baseTimer += interval_ms * 1000;
}

void CyclicTask::stop() {
    running = false;
    prevRunTime = 0;
}

// Returns next pending update time
Time CyclicTask::tick() {
    if (!running) return UINT64_MAX;
    Time now = controller->getTime();
    if (now >= nextUpdateTime()) {
        drift_us = now - nextUpdateTime();
        do baseTimer += interval_ms * 1000;
        while (nextUpdateTime() <= now);
        update();
    }
    return nextUpdateTime();
}

inline Time CyclicTask::nextUpdateTime() { return baseTimer + offset_ms * 1000; }

void CyclicTask::update() {
    Time startTime = controller->getTime();
    if (running) {
        // Skip statistics on the first run
        if (prevRunTime > 0) {
            lastActualInterval_ms = (startTime - prevRunTime) / 1000;
            cumulativeActualInterval_ms += lastActualInterval_ms;
            runCount++;
        }
        prevRunTime = startTime;
    }
    // Update all functions attached to this task
    for (FunctionBlock* func : funcList) {
        func->update(interval_ms);
    }
    Time endTime = controller->getTime();
    lastCPUTime = endTime - startTime;
    if (running) cumulativeCPUTime += lastCPUTime;
}

float CyclicTask::averageCPUTime() {
    return runCount ? (float)cumulativeCPUTime / runCount : 0.f;
}

float CyclicTask::averageActualInterval_ms() {
    return runCount ? (float)cumulativeActualInterval_ms / runCount : 0.f;
}

bool CyclicTask::isRunning() {
    return running;
}

void CyclicTask::setInterval(uint32_t time) {
    interval_ms = time;
    start();
}

void CyclicTask::setOffset(uint32_t time) {
    offset_ms = time;
}

void CyclicTask::addFunction(FunctionBlock* func, int32_t index) {
    if (index > 0 && index < funcList.size()) {
        funcList.insert(funcList.begin() + index, func);
    } else
        funcList.push_back(func);
}

void CyclicTask::removeFunction(FunctionBlock* func) {
    for (size_t i = 0; i < funcList.size(); i++) {
        if (funcList.at(i) == func) {
            funcList.erase(funcList.begin() + i);
            break;
        }
    }
}