#pragma once

#include "../FunctionBlock.h"
#include "../FunctionLib.h"

namespace MathUintLib
{

enum FUNC_ID {
    FUNC_ID_ADD,
    FUNC_ID_SUB,
    FUNC_ID_MUL,
    FUNC_ID_DIV,
    FUNC_COUNT
};

const char* names[] = {
    "ADD",
    "SUB",
    "MUL",
    "DIV", 
};

class ADD : public FunctionBlock
{
public:
    ADD(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH_UINT, FUNC_ID_ADD))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0u);
        initOutput(0, 0u);
    }

    const char* name() { return names[FUNC_ID_ADD]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        uint32_t result = inputValues[0].u;
        for (int i = 1; i < numInputs; i++) {
            result += inputValues[i].u;
        }
        outputValues[0].u = result;
    }
};

class SUB : public FunctionBlock
{
public:
    SUB() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH_UINT, FUNC_ID_SUB))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0u);
        initOutput(0, 0);
    }

    const char* name() { return names[FUNC_ID_SUB]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].u = inputValues[0].u - inputValues[1].u;
    }
};

class MUL : public FunctionBlock
{
public:
    MUL(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH_UINT, FUNC_ID_MUL))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 1u);
        initOutput(0, 1u);
    }

    const char* name() { return names[FUNC_ID_MUL]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        uint32_t result = inputValues[0].u;
        for (int i = 1; i < numInputs; i++) {
            result *= inputValues[i].u;
        }
        outputValues[0].u = result;
    }
};

class DIV : public FunctionBlock
{
public:
    DIV() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH_UINT, FUNC_ID_DIV))
    {
        initInput(0, 0u);
        initInput(1, 1u);
        initOutput(0, 0u);
    }

    const char* name() { return  names[FUNC_ID_DIV]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const uint32_t a = inputValues[0].u;
        const uint32_t b = inputValues[1].u;
        if (b == 0) return;
        const uint32_t result = a / b;
        outputValues[0].u = result;
    }
};

class Library: public FunctionLibrary
{
public:
    Library() : FunctionLibrary(LIB_ID_MATH_UINT, "Math Uint", FUNC_COUNT, names) {}

    FunctionBlock* createFunction(uint8_t func_id, uint8_t numInputs, uint8_t numOutputs)
    {
        switch(func_id)
        {
            case FUNC_ID_ADD:           return new ADD(numInputs);   
            case FUNC_ID_SUB:           return new SUB();
            case FUNC_ID_MUL:           return new MUL(numInputs);
            case FUNC_ID_DIV:           return new DIV();
            
            default:                    return nullptr;
        }
    }
};

}