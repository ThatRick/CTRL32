#include "ControllerTask.h"
#include "Esp.h"

ControllerTask::ControllerTask(Controller* controller, uint32_t interval_ms, uint32_t offset_ms) :
    controller (controller),
    interval_ms (interval_ms),
    offset_ms (offset_ms)
{
};

void ControllerTask::_start() {
    Time now = controller->getTime();
    running = true;
    uint64_t interval_us = interval_ms * 1000;
    // Align base timer by interval time to make offset time independent from start time
    baseTimer = (now / interval_us) * interval_us;
    while (nextUpdateTime() < now)
        baseTimer += interval_ms * 1000;
}

void ControllerTask::_stop() {
    running = false;
    prevRunTime = 0;
}

// Returns next pending update time
Time ControllerTask::tick() {
    executeCommands();
    if (!running) return UINT64_MAX;
    Time now = controller->getTime();
    if (now >= nextUpdateTime()) {
        do baseTimer += interval_ms * 1000;
        while (nextUpdateTime() <= now);
        update();
    }
    return nextUpdateTime();
}

inline uint64_t ControllerTask::nextUpdateTime() { return baseTimer + offset_ms * 1000; }

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

void ControllerTask::queueCommand(CommandType type, uint32_t time ) {
    Command_t command;
    command.type = type;
    command.time_ms = time;
    while (commandQueueLocked) sleep(1);
    commandQueue.push_back(command);
}
void ControllerTask::queueCommand(CommandType type, Circuit* circuit, int32_t index ) {
    Command_t command;
    command.type = type;
    command.circuit = circuit;
    while (commandQueueLocked) sleep(1);
    commandQueue.push_back(command);
}

void ControllerTask::start()                            { queueCommand(START); }
void ControllerTask::stop()                             { queueCommand(STOP); }

void ControllerTask::setInterval(uint32_t time)         { queueCommand(SET_INTERVAL, time); }
void ControllerTask::setOffset(uint32_t time)           { queueCommand(SET_OFFSET, time); }

void ControllerTask::addCircuit(Circuit* circuit, int32_t index)    { queueCommand(ADD_CIRCUIT, circuit, index); }
void ControllerTask::removeCircuit(Circuit* circuit)    { queueCommand(REMOVE_CIRCUIT, circuit); }

void ControllerTask::executeCommands() {
    commandQueueLocked = true;
    for (Command_t command : commandQueue) {
        switch (command.type) {
            case START:
                _start();
                break;
            case STOP:
                _stop();
                break;
            case SET_INTERVAL:
                interval_ms = command.time_ms;
                _start();
                break;
            case SET_OFFSET:
                offset_ms = command.time_ms;
                break;
            case ADD_CIRCUIT:
                if (command.index > 0 && command.index < circuits.size()) {
                    circuits.insert(circuits.begin() + command.index, command.circuit);
                } else
                    circuits.push_back(command.circuit);
                break;
            case REMOVE_CIRCUIT:
                for (size_t i = 0; i < circuits.size(); i++) {
                    if (circuits.at(i) == command.circuit) {
                        circuits.erase(circuits.begin() + i);
                        break;
                    }
                }
                break;
        }
    }
    commandQueue.clear();
    commandQueueLocked = false;
}

bool ControllerTask::readyForCommand() {
    return (!commandQueueLocked);
}