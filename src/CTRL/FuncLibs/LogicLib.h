#pragma once

#include "../FunctionBlock.h"
#include "../FunctionLib.h"

namespace LogicLib
{

enum FUNC_ID
{
    FUNC_ID_AND,
    FUNC_ID_OR,
    FUNC_ID_XOR,
    FUNC_ID_NOT,
    FUNC_ID_RS,
    FUNC_ID_SR,
    FUNC_ID_RisingEdge, 
    FUNC_ID_FallingEdge,
    FUNC_COUNT
};

const char* names[] =
{
    "AND",
    "OR",
    "XOR",
    "NOT",
    "RS",
    "SR",
    "Rising edge", 
    "Falling edge",
};

class AND : public FunctionBlock
{
public:
    AND(uint8_t size = 2) : FunctionBlock(size < 2 ? 2 : size, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_AND))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, true);
        initOutput(0, true);
    }

    const char* name() { return names[FUNC_ID_AND]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        bool result = true;
        for (uint i = 0; i < numInputs; i++) {
            result = (result && inputValues[i].u);
        }
        outputValues[0].u = result;
    }
};

class OR : public FunctionBlock
{
public:
    OR(uint8_t size = 2) : FunctionBlock(size < 2 ? 2 : size, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_OR))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, false);
        initOutput(0, false);
    }

    const char* name() { return names[FUNC_ID_OR]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        int result = false;
        for (int i = 0; i < numInputs; i++) {
            result = (result || inputValues[i].u);
        }
        outputValues[0].u = result;
    }
};

class XOR : public FunctionBlock
{
public:
    XOR(uint8_t size = 2) : FunctionBlock(size < 2 ? 2 : size, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_XOR))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, false);
        initOutput(0, false);
    }

    const char* name() { return names[FUNC_ID_XOR]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        int count = 0;
        for (int i = 0; i < numInputs; i++) {
            count += inputValues[i].u;
        }
        outputValues[0].u = (count == 1);
    }
};

class NOT : public FunctionBlock
{
public:
    NOT() : FunctionBlock(1, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_NOT))
    {
        initInput(0, false);
        initOutput(0, true);
    }

    const char* name() { return names[FUNC_ID_NOT]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        bool input = inputValues[0].u;
        outputValues[0].u = (!input);
    }
};

class RS : public FunctionBlock
{
public:
    RS() : FunctionBlock(2, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_RS))
    {
        initInput(0, false);
        initInput(1, false);
        initOutput(0, false);
    }

    const char* name() { return names[FUNC_ID_RS]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        bool R = inputValues[0].u;
        bool S = inputValues[1].u;

        if (R) outputValues[0].u = 0;
        else if (S) outputValues[0].u = 1;
    }
};

class SR : public FunctionBlock
{
public:
    SR() : FunctionBlock(2, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_SR))
    {
        initInput(0, false);
        initInput(1, false);
        initOutput(0, false);
    }

    const char* name() { return names[FUNC_ID_SR]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        bool S = inputValues[0].u;
        bool R = inputValues[1].u;

        if (S) outputValues[0].u = 0;
        else if (R) outputValues[0].u = 1;
    }
};

class RisingEdge: public FunctionBlock
{
public:
    RisingEdge() : FunctionBlock(1, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_RisingEdge))
    {
        initInput(0, false);
        initOutput(0, false);
    }
    
    const char* name() { return names[FUNC_ID_RisingEdge]; }

    uint prevInput = 0;

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt) {
        bool input = inputValues[0].u;

        outputValues[0].u = (input && !prevInput);
        prevInput = input;
    }
};

class FallingEdge: public FunctionBlock
{
public:
    FallingEdge() : FunctionBlock(1, 1, OPCODE(LIB_ID_LOGIC, FUNC_ID_FallingEdge))
    {
        initInput(0, true);
        initOutput(0, false);
    }

    const char* name() { return names[FUNC_ID_FallingEdge]; }

    uint prevInput = 1;

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt) {
        bool input = inputValues[0].u;

        outputValues[0].u = (!input && prevInput);
        prevInput = input;
    }
};


class Library: public FunctionLibrary
{
public:
    Library() : FunctionLibrary(LIB_ID_LOGIC, "Logic", FUNC_COUNT, names) {}

    FunctionBlock* createFunction(uint8_t func_id, uint8_t numInputs, uint8_t numOutputs)
    {
        switch(func_id)
        {
            case FUNC_ID_AND:           return new AND(numInputs);   
            case FUNC_ID_OR:            return new OR(numInputs);
            case FUNC_ID_XOR:           return new XOR(numInputs);
            case FUNC_ID_NOT:           return new NOT();
            case FUNC_ID_RS:            return new RS();
            case FUNC_ID_SR:            return new SR();
            case FUNC_ID_RisingEdge:    return new RisingEdge();
            case FUNC_ID_FallingEdge:   return new FallingEdge();
            
            default:                    return nullptr;
        }
    }
};

}
