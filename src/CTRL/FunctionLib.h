#pragma once

enum LIBRARY_ID
{
    LIB_ID_NULL,
    LIB_ID_LOGIC,
    LIB_ID_MATH,
    LIB_ID_MATH_INT,
    LIB_ID_MATH_UINT,
    LIB_ID_TIMERS,
    LIB_ID_CONDITIONALS,
    LIB_COUNT
};

class FunctionLibrary
{
public:

    const uint8_t   id;
    const char*     name;
    const uint8_t   funcCount;
    const char**    funcNames;

    FunctionLibrary( uint8_t id, const char* name, uint8_t functionCount, const char* funcNames[] ) :
        id (id),
        name (name),
        funcCount (functionCount),
        funcNames (funcNames)
    {}

    const char* functionName(uint8_t func_id) {
        if (func_id >= funcCount) return "INVALID";
        return funcNames[func_id];
    }

    virtual FunctionBlock* createFunction(uint8_t funcID, uint8_t numInputs, uint8_t numOutputs) = 0;
};
