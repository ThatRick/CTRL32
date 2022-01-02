#include "Circuit.h"

Circuit::Circuit(uint8_t numInputs, uint8_t numOutputs) : FunctionBlock(numInputs, numOutputs, 0)
{
    outputRefs = new IOValue*[numOutputs] {};
}

Circuit::~Circuit()
{
    for (FunctionBlock* func : funcList) {
        delete func;
    }
    delete[] outputRefs;
}

const char* Circuit::name() { return "Circuit"; }

bool Circuit::addFunction(FunctionBlock* func)
{
    funcList.push_back(func);
    return true;
}

void Circuit::collectMonitoringValues(Link* link) {
    for (FunctionBlock* func : funcList) {
        func->reportMonitoringValues(link);
    }
}

void Circuit::run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
{
    // Update functions
    for (FunctionBlock* func : funcList) {
        func->update(dt);
    }
    // Update circuit outputs from references
    for (int i = 0; i < numOutputs; i++) {
        const IOValue* ref = outputRefs[i];
        if (ref) {
            outputValues[i] = *ref;
        }
    }
}
