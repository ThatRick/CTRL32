#pragma once

#include "Common.h"
#include "FunctionBlock.h"
#include "Link.h"

class Circuit : public FunctionBlock
{
public:
    std::vector<FunctionBlock*> funcList;
    IOValue** outputRefs;

    Circuit(uint8_t numInputs, uint8_t numOutputs);

    ~Circuit();

    const char* name();

    void addFunction(FunctionBlock* func, int32_t index = -1);
    void removeFunction(FunctionBlock* func);

    void collectMonitoringValues(Link* link);

    void executeQueuedCommands(Link* link);

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt);
};