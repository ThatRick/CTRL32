#include "../FunctionBlock.h"

namespace MathIntLib
{

enum FUNC_ID {
    FUNC_ID_ADD,
    FUNC_ID_SUB,
    FUNC_ID_MUL,
    FUNC_ID_DIV, 
    FUNC_ID_ABS,
    FUNC_COUNT
};

const char* names[] = {
    "ADD",
    "SUB",
    "MUL",
    "DIV", 
    "ABS",
};

class ADD : public FunctionBlock
{
public:
    ADD(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH_INT, FUNC_ID_ADD))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0);
        initOutput(0, 0);
    }

    const char* name() { return names[FUNC_ID_ADD]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        int32_t result = inputValues[0].i;
        for (int i = 1; i < numInputs; i++) {
            result += inputValues[i].i;
        }
        outputValues[0].i = result;
    }
};

class SUB : public FunctionBlock
{
public:
    SUB() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH_INT, FUNC_ID_SUB))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0);
        initOutput(0, 0);
    }

    const char* name() { return names[FUNC_ID_SUB]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].i = inputValues[0].i - inputValues[1].i;
    }
};

class MUL : public FunctionBlock
{
public:
    MUL(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH_INT, FUNC_ID_MUL))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 1);
        initOutput(0, 1);
    }

    const char* name() { return names[FUNC_ID_MUL]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        int32_t result = inputValues[0].i;
        for (int i = 1; i < numInputs; i++) {
            result *= inputValues[i].i;
        }
        outputValues[0].i = result;
    }
};

class DIV : public FunctionBlock
{
public:
    DIV() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH_INT, FUNC_ID_DIV))
    {
        initInput(0, 0);
        initInput(1, 1);
        initOutput(0, 0);
    }

    const char* name() { return  names[FUNC_ID_DIV]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const int32_t a = inputValues[0].i;
        const int32_t b = inputValues[1].i;
        if (b == 0) return;
        int32_t result = a / b;
        outputValues[0].i = result;
    }
};

class ABS : public FunctionBlock
{
public:
    ABS() : FunctionBlock(1, 1, OPCODE(LIB_ID_MATH_INT, FUNC_ID_ABS))
    {
        initInput(0, 0);
        initOutput(0, 0);
    }

    const char* name() { return  names[FUNC_ID_ABS]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].i = abs(inputValues[0].i);
    }
};

class Library: public FunctionLibrary
{
public:
    Library() : FunctionLibrary(LIB_ID_MATH_INT, "Math Int", FUNC_COUNT, names) {}

    FunctionBlock* createFunction(uint8_t func_id, uint8_t numInputs, uint8_t numOutputs)
    {
        switch(func_id)
        {
            case FUNC_ID_ADD:           return new ADD(numInputs);   
            case FUNC_ID_SUB:           return new SUB();
            case FUNC_ID_MUL:           return new MUL(numInputs);
            case FUNC_ID_DIV:           return new DIV();
            case FUNC_ID_ABS:           return new ABS();
            
            default:                    return nullptr;
        }
    }
};

}