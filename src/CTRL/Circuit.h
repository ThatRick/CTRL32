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

    bool addFunction(FunctionBlock* func);

    void collectMonitoringValues(Link* link);

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt);
};