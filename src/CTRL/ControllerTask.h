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

    bool        running = false;
    Time        baseTimer = 0;
    Time        prevRunTime = 0;
    Controller* controller;

    uint32_t queueCommand(CommandType type, uint32_t time = 0);
    uint32_t queueCommand(CommandType type, Circuit* circuit, int32_t index = -1);
    
    void executeQueuedCommands();
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

    uint32_t start();
    uint32_t stop();
    uint32_t setInterval(uint32_t time);
    uint32_t setOffset(uint32_t time);
    uint32_t addCircuit(Circuit* circuit, int32_t index = -1);
    uint32_t removeCircuit(Circuit* circuit);
};