#include "ControllerTask.h"
#include "Esp.h"

ControllerTask::ControllerTask(Controller* controller, uint32_t interval_ms, uint32_t offset_ms) :
    controller (controller),
    interval_ms (interval_ms),
    offset_ms (offset_ms)
{
};

void ControllerTask::start() {
    Time now = controller->getTime();
    running = true;
    uint64_t interval_us = interval_ms * 1000;
    // Align base timer by interval time to make offset time independent from start time
    baseTimer = (now / interval_us) * interval_us;
    while (nextUpdateTime() < now)
        baseTimer += interval_ms * 1000;
}

void ControllerTask::stop() {
    running = false;
    prevRunTime = 0;
}

// Returns next pending update time
Time ControllerTask::tick() {
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

inline Time ControllerTask::nextUpdateTime() { return baseTimer + offset_ms * 1000; }

void ControllerTask::update() {
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
    // Update all circuits attached to this task
    for (Circuit* circuit : circuits) {
        circuit->update(interval_ms);
    }
    Time endTime = controller->getTime();
    lastCPUTime = endTime - startTime;
    if (running) cumulativeCPUTime += lastCPUTime;
    if (link) collectMonitoringValues();
}

float ControllerTask::averageCPUTime() {
    return runCount ? (float)cumulativeCPUTime / runCount : 0.f;
}

float ControllerTask::averageActualInterval_ms() {
    return runCount ? (float)cumulativeActualInterval_ms / runCount : 0.f;
}

bool ControllerTask::isRunning() {
    return running;
}

void ControllerTask::collectMonitoringValues() {
    size_t itemCount = 0;
    for (Circuit* circuit : circuits) {
        for (FunctionBlock* func : circuit->funcList) {
            if (func->flags & FUNC_FLAG_MONITORING) itemCount++;
        }
    }
    link->monitoringCollectionStart(this, itemCount);
    for (Circuit* circuit : circuits) {
        circuit->collectMonitoringValues(link);
    }
    link->monitoringCollectionSend();
}

void ControllerTask::setInterval(uint32_t time) {
    interval_ms = time;
    start();
}

void ControllerTask::setOffset(uint32_t time) {
    offset_ms = time;
}

void ControllerTask::addCircuit(Circuit* circuit, int32_t index) {
    if (index > 0 && index < circuits.size()) {
        circuits.insert(circuits.begin() + index, circuit);
    } else
        circuits.push_back(circuit);
}

void ControllerTask::removeCircuit(Circuit* circuit) {
    for (size_t i = 0; i < circuits.size(); i++) {
        if (circuits.at(i) == circuit) {
            circuits.erase(circuits.begin() + i);
            break;
        }
    }
}