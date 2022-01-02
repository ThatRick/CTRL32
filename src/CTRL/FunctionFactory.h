#pragma once

#include "FunctionBlock.h"
#include "FunctionLib.h"
#include "FuncLibs/LogicLib.h"
#include "FuncLibs/MathLib.h"
#include "FuncLibs/MathIntLib.h"
#include "FuncLibs/MathUintLib.h"
#include "FuncLibs/TimerLib.h"

class FunctionFactory
{
    FunctionLibrary* libs[LIB_COUNT];

    FunctionLibrary* getFunctionLib(uint8_t id) {
        if (id == LIB_ID_NULL || id >= LIB_COUNT) return nullptr;
        return libs[id];
    }
public:
    FunctionFactory()
    {
        libs[LIB_ID_LOGIC] =        new LogicLib::Library();
        libs[LIB_ID_MATH] =         new MathLib::Library();
        libs[LIB_ID_MATH_INT] =     new MathIntLib::Library();
        libs[LIB_ID_MATH_UINT] =    new MathUintLib::Library();
        libs[LIB_ID_TIMERS] =       new TimerLib::Library();
    }

    FunctionBlock* createFunction(uint8_t lib_id, uint8_t func_id, uint8_t numInputs = 0, uint8_t numOutputs = 0)
    {
        FunctionLibrary* lib = getFunctionLib(lib_id);
        if (lib == nullptr) return nullptr;

        return lib->createFunction(func_id, numInputs, numOutputs);
    }
};




