#include "../FunctionBlock.h"

namespace MathLib
{

enum FUNC_ID {
    FUNC_ID_ADD,
    FUNC_ID_SUB,
    FUNC_ID_MUL,
    FUNC_ID_DIV, 
    FUNC_ID_ABS,
    FUNC_ID_SIN,
    FUNC_ID_COS,
    FUNC_ID_POW,
    FUNC_ID_SQRT,
    FUNC_COUNT
};

const char* names[] = {
    "ADD",
    "SUB",
    "MUL",
    "DIV", 
    "ABS",
    "SIN",
    "COS",
    "POW",
    "SQRT",
};

class ADD : public FunctionBlock
{
public:
    ADD(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH, FUNC_ID_ADD))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return names[FUNC_ID_ADD]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        float result = inputValues[0].f;
        for (int i = 1; i < numInputs; i++) {
            result += inputValues[i].f;
        }
        outputValues[0].f = result;
    }
};

class SUB : public FunctionBlock
{
public:
    SUB() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH, FUNC_ID_SUB))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 0.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return names[FUNC_ID_SUB]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].f = inputValues[0].f - inputValues[1].f;
    }
};

class MUL : public FunctionBlock
{
public:
    MUL(uint8_t size = 2) : FunctionBlock(max((uint8_t)2, size), 1, OPCODE(LIB_ID_MATH, FUNC_ID_MUL))
    {
        for (int i = 0; i < numInputs; i++) initInput(i, 1.0f);
        initOutput(0, 1.0f);
    }

    const char* name() { return names[FUNC_ID_MUL]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        float result = inputValues[0].f;
        for (int i = 1; i < numInputs; i++) {
            result *= inputValues[i].f;
        }
        outputValues[0].f = result;
    }
};

class DIV : public FunctionBlock
{
public:
    DIV() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH, FUNC_ID_DIV))
    {
        initInput(0, 0.0f);
        initInput(1, 1.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return  names[FUNC_ID_DIV]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const float a = inputValues[0].f;
        const float b = inputValues[1].f;
        if (b == 0.f) return;
        float result = a / b;
        outputValues[0].f = result;
    }
};

class ABS : public FunctionBlock
{
public:
    ABS() : FunctionBlock(1, 1, OPCODE(LIB_ID_MATH, FUNC_ID_ABS))
    {
        initInput(0, 0.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return  names[FUNC_ID_ABS]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].f = abs(inputValues[0].f);
    }
};

class SIN : public FunctionBlock
{
public:
    SIN() : FunctionBlock(1, 1, OPCODE(LIB_ID_MATH, FUNC_ID_SIN))
    {
        initInput(0, 0.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return  names[FUNC_ID_SIN]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].f = sinf(inputValues[0].f);
    }
};

class COS : public FunctionBlock
{
public:
    COS() : FunctionBlock(1, 1, OPCODE(LIB_ID_MATH, FUNC_ID_COS))
    {
        initInput(0, 0.0f);
        initOutput(0, 0.0f);
    }

    const char* name() { return  names[FUNC_ID_COS]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].f = cosf(inputValues[0].f);
    }
};

class POW : public FunctionBlock
{
public:
    POW() : FunctionBlock(2, 1, OPCODE(LIB_ID_MATH, FUNC_ID_POW))
    {
        initInput(0, 1.0f);
        initInput(1, 1.0f);
        initOutput(0, 1.0f);
    }

    const char* name() { return  names[FUNC_ID_POW]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const float a = inputValues[0].f;
        const float b = inputValues[1].f;
        float result = powf(a, b);
        outputValues[0].f = result;
    }
};

class SQRT : public FunctionBlock
{
public:
    SQRT() : FunctionBlock(1, 1, OPCODE(LIB_ID_MATH, FUNC_ID_SQRT))
    {
        initInput(0, 1.0f);
        initOutput(0, 1.0f);
    }

    const char* name() { return  names[FUNC_ID_SQRT]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        outputValues[0].f = sqrtf(inputValues[0].f);
    }
};

class Library: public FunctionLibrary
{
public:
    Library() : FunctionLibrary(LIB_ID_MATH, "Math", FUNC_COUNT, names) {}

    FunctionBlock* createFunction(uint8_t func_id, uint8_t numInputs, uint8_t numOutputs)
    {
        switch(func_id)
        {
            case FUNC_ID_ADD:           return new ADD(numInputs);   
            case FUNC_ID_SUB:           return new SUB();
            case FUNC_ID_MUL:           return new MUL(numInputs);
            case FUNC_ID_DIV:           return new DIV();
            case FUNC_ID_ABS:           return new ABS();
            case FUNC_ID_SIN:           return new SIN();
            case FUNC_ID_COS:           return new COS();
            case FUNC_ID_POW:           return new POW();
            case FUNC_ID_SQRT:          return new SQRT();
            
            default:                    return nullptr;
        }
    }
};

}