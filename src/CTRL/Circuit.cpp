#include "Circuit.h"
#include <algorithm>

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

void Circuit::addFunction(FunctionBlock* func, int32_t index)
{
    if (index > -1 && index < funcList.size()) {
        funcList.insert(funcList.begin() + index, func);
    }
    else funcList.push_back(func);
}

void Circuit::removeFunction(FunctionBlock* partingFunc) {
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
    // Remove connections to circuit outputs
    for (size_t i = 0; i < numOutputs; i++) {
        if (outputRefs[i] >= partingFunc->outputs() &&
            outputRefs[i] < partingFunc->outputs() + numOutputs) {
                outputRefs[i] = nullptr;
        }
    }
    // Erase parting function from funcList
    for (size_t i = 0; i < funcList.size(); i++) {
        if (funcList.at(i) == partingFunc) {
            funcList.erase(funcList.begin() + i);
            break;
        }
    }
}

void Circuit::collectMonitoringValues(Link* link) {
    for (FunctionBlock* func : funcList) {
        func->reportMonitoringValues(link);
    }
}

void Circuit::executeQueuedCommands(Link* link) {

    for (FunctionBlock* func : funcList) {
        func->executeQueuedCommands(link);
    }
}

void Circuit::run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
{
    // Update functions
    for (FunctionBlock* func : funcList) {
        func->update(dt);
    }
    // Update circuit outputs from references
    for (size_t i = 0; i < numOutputs; i++) {
        const IOValue* ref = outputRefs[i];
        if (ref) {
            outputValues[i] = *ref;
        }
    }
}
