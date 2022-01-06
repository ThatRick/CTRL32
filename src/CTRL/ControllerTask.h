#pragma once

#include "Common.h"
#include "Circuit.h"
#include "Controller.h"
#include "Link.h"

class ControllerTask
{
    enum CommandType {
        START,
        STOP,
        SET_INTERVAL,
        SET_OFFSET,
        ADD_CIRCUIT,
        REMOVE_CIRCUIT
    };

    union CommandParameter {
        Circuit* circuit = nullptr;
        uint32_t time_ms;
    };

    struct Command_t {
        CommandType type;
        union {
            Circuit* circuit = nullptr;
            uint32_t time_ms;
        };
        int32_t index = -1;
    };

    std::vector<Command_t> commandQueue;

    bool        commandQueueLocked = false;

    bool        running = false;
    Time        baseTimer = 0;
    Time        prevRunTime = 0;
    Controller* controller;

    void queueCommand(CommandType type, uint32_t time = 0);
    void queueCommand(CommandType type, Circuit* circuit, int32_t index = -1);
    void executeCommands();
    void collectMonitoringValues();

    void _start();
    void _stop();

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

    // Returns next pending update time
    Time tick();

    void update();
    bool isRunning();
    inline uint64_t nextUpdateTime();

    float averageCPUTime();
    float averageActualInterval_ms();

    // Commands to be queued for execution on next tick()
    bool readyForCommand();

    void start();
    void stop();
    void setInterval(uint32_t time);
    void setOffset(uint32_t time);
    void addCircuit(Circuit* circuit, int32_t index = -1);
    void removeCircuit(Circuit* circuit);

};