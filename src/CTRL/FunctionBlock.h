#pragma once

#include "Common.h"
#include "Link.h"

#define FUNC_FLAG_MONITORING        (1 << 0)
#define FUNC_FLAG_B1                (1 << 1)
#define FUNC_FLAG_B2                (1 << 2)

#define IO_FLAG_TYPE_B0             (1 << 0)
#define IO_FLAG_TYPE_B1             (1 << 1)
#define IO_FLAG_TYPE_B2             (1 << 2)
#define IO_FLAG_BIT3                (1 << 3)
#define IO_FLAG_REF                 (1 << 4)
#define IO_FLAG_REF_INVERT          (1 << 5)
#define IO_FLAG_REF_CONV_TYPE_B0    (1 << 6)
#define IO_FLAG_REF_CONV_TYPE_B1    (1 << 7)

#define IO_FLAG_TYPE_MASK           (IO_FLAG_TYPE_B0 | IO_FLAG_TYPE_B1 | IO_FLAG_TYPE_B2)
#define IO_FLAG_CONV_TYPE_MASK      (IO_FLAG_REF_CONV_TYPE_B0 | IO_FLAG_REF_CONV_TYPE_B1)

#define MS           1
#define SEC      1_000
#define MIN     60_000
#define HOUR 3_600_000

// bits 0, 1 and 2 of IO Flag
enum IO_TYPE
{
    IO_TYPE_BOOL,
    IO_TYPE_INT,
    IO_TYPE_UINT,
    IO_TYPE_FLOAT,
    IO_TYPE_TIME
};

// bits 0, 1 and 2 of IO Flag
enum IO_CONVERSION_TYPE
{
    IO_CONV_NONE        = 0,
    IO_CONV_UNSIGNED    = IO_FLAG_REF_CONV_TYPE_B0,
    IO_CONV_SIGNED      = IO_FLAG_REF_CONV_TYPE_B1,
    IO_CONV_FLOAT       = IO_FLAG_REF_CONV_TYPE_B0 | IO_FLAG_REF_CONV_TYPE_B1,
};

union IOValue
{
    uint32_t    u;
    int32_t     i;
    float       f;
    IOValue*    ref;
};

inline uint16_t OPCODE(uint8_t libID, uint8_t funcID) { return (libID << 8) + funcID; }

class FunctionBlock
{
    bool monitorOnce = false;
public:
    const uint8_t   numInputs;
    const uint8_t   numOutputs;
    const uint16_t  opcode;
    
    uint32_t flags = 0;

    IOValue* ioValues = nullptr;
    uint8_t* ioFlags = nullptr;
    IOValue* monitoringValues = nullptr;

    FunctionBlock(uint8_t numInputs, uint8_t numOutputs, uint16_t opcode);

    virtual const char* name() = 0;
    
    virtual void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt_ms) = 0;

    virtual ~FunctionBlock();

    size_t dataSize();

    void update(uint32_t dt);

    // Return an input value. Dereferece if needed
    IOValue inputValue(uint8_t index);

    // Read all input values to given array. Dereference values if needed
    void readInputValues(IOValue* values);

    void connectInput(uint8_t inputNum, FunctionBlock* sourceFunc, uint8_t outputNum, bool inverted = false);

    inline size_t ioCount() { return numInputs + numOutputs; }

    inline IOValue* inputs() { return ioValues; }
    inline IOValue* outputs() { return ioValues + numInputs; }

    inline uint8_t* inputFlags() { return ioFlags; }
    inline uint8_t* outputFlags() { return ioFlags + numInputs; }

    inline IO_TYPE readFlagIOType(uint8_t ioFlags) {
        return (IO_TYPE) (ioFlags & IO_FLAG_TYPE_MASK );
    }
    inline IO_TYPE readInputType(size_t index) {
        return (IO_TYPE)(ioFlags[index] & IO_FLAG_TYPE_MASK);
    }
    inline IO_TYPE readOutputType(size_t index) {
        return (IO_TYPE)(ioFlags[numInputs + index] & IO_FLAG_TYPE_MASK);
    }

    inline void setInput(uint8_t inputNum, int32_t value) {
        inputs()[inputNum].i = value;
    }
    inline void setInput(uint8_t inputNum, uint32_t value) {
        inputs()[inputNum].u = value;
    }
    inline void setInput(uint8_t inputNum, float value) {
        inputs()[inputNum].f = value;
    }

    inline void setInputFlag(uint8_t inputNum, uint8_t ioFlag) {
        inputFlags()[inputNum] |= ioFlag;
    }
    inline void clearInputFlag(uint8_t inputNum, uint8_t ioFlag) {
        inputFlags()[inputNum] &= ~ioFlag;
    }

    inline void setOutputFlag(uint8_t outputNum, uint8_t ioFlag) {
        outputFlags()[outputNum] |= ioFlag;
    }
    inline void clearOutputFlag(uint8_t outputNum, uint8_t ioFlag) {
        outputFlags()[outputNum] &= ~ioFlag;
    }

    inline void setFuncFlag(uint8_t flag) {
        flags |= flag;
    }
    inline void clearFuncFlag(uint8_t flag) {
        flags &= ~flag;
    }

    inline void setInputConversionType(uint8_t inputNum, IO_CONVERSION_TYPE conversionType) {
        inputFlags()[inputNum] &= ~IO_FLAG_CONV_TYPE_MASK;
        inputFlags()[inputNum] |= conversionType;
    }

    inline IOValue outputValue(uint8_t index) { return outputs()[index]; }

    inline IOValue* getOutputRef(uint8_t index) { return outputs()+index; }

    const char* getIOTypeString(IO_TYPE ioType);

    void enableMonitoring(bool once = false);
    void disableMonitoring();

    void reportMonitoringValues(Link* link);

    void initInput(uint8_t index, bool value);
    void initInput(uint8_t index, uint32_t value);
    void initInput(uint8_t index, int32_t value);
    void initInput(uint8_t index, float value);

    void initOutput(uint8_t index, bool value);
    void initOutput(uint8_t index, uint32_t value);
    void initOutput(uint8_t index, int32_t value);
    void initOutput(uint8_t index, float value);
};