#include "FunctionBlock.h"
#include "Esp.h"

FunctionBlock::FunctionBlock(uint8_t numInputs, uint8_t numOutputs, uint16_t opcode) :
    numInputs (numInputs),
    numOutputs (numOutputs),
    opcode (opcode)
{
    const size_t ioCount = numInputs + numOutputs;
    ioValues = (IOValue*)calloc(sizeof(IOValue), ioCount);
    ioFlags = (uint8_t*)calloc(sizeof(uint8_t), ioCount);
}

FunctionBlock::~FunctionBlock() {
    free(ioValues);
    free(ioFlags);
    free(monitoringValues);
}

size_t FunctionBlock::dataSize() {
    const size_t ioCount = numInputs + numOutputs;
    return ioCount * 4 + ioCount;
}

void IRAM_ATTR FunctionBlock::update(uint32_t dt)
{
    // Create temporary array for input values
    IOValue inputValues[numInputs];
    // Read input values
    readInputValues(inputValues);
    // Run function
    run(inputValues, outputs(), dt);
    // Update monitoring values
    if (monitoringValues) {
        for (int i = 0; i < numInputs; i++) {
            //monitoringValues[i] = inputValues[i];
        }
        for (int i = numInputs; i < ioCount(); i++) {
            //monitoringValues[i] = outputs()[i];
        }
        // Copy input values
        memcpy(&monitoringValues[0], &inputValues[0], numInputs * sizeof(IOValue));
        // Copy output values
        memcpy(&monitoringValues[numInputs], outputs(), numOutputs * sizeof(IOValue));
    }
}

// Return an input value. Dereferece if needed
IOValue IRAM_ATTR FunctionBlock::inputValue(uint8_t index) {
    const uint8_t flags = inputFlag(index);
    IOValue value = inputs()[index];
    // Check if input is a reference
    if (flags & IO_FLAG_REF) {
        value = *value.ref;
        // Check if value needs type conversion
        // Serial.printf("flag: %x mask: %x AND: %x \n", flags, IO_FLAG_CONV_TYPE_MASK, (flags & IO_FLAG_CONV_TYPE_MASK));
        if (flags & IO_FLAG_CONV_TYPE_MASK) {
            const uint8_t ioConvType = (flags & IO_FLAG_CONV_TYPE_MASK);
            const uint8_t inputType = (flags & IO_FLAG_TYPE_MASK);
            switch (inputType) {
                case IO_TYPE_BOOL:
                case IO_TYPE_UINT:
                case IO_TYPE_TIME:
                    if (ioConvType == IO_CONV_FLOAT)    { value.u = value.f;  break; }
                    if (ioConvType == IO_CONV_SIGNED)   { value.u = value.i;  break; }
                    break;
                case IO_TYPE_FLOAT:
                    if (ioConvType == IO_CONV_UNSIGNED) { value.f = value.u;  break; }
                    if (ioConvType == IO_CONV_SIGNED)   { value.f = 420;  break; }
                    break;
                case IO_TYPE_INT:
                    if (ioConvType == IO_CONV_FLOAT)    { value.i = value.f;  break; }
                    if (ioConvType == IO_CONV_UNSIGNED) { value.i = value.u;  break; }
                    break;
            }
        }
        // Check if value needs inversion
        if (flags & IO_FLAG_REF_INVERT) {
            value.u = (value.u) ? 0 : 1;
        }
    }
    return value;
}

// Read all input values to given array. Dereference values if needed
void IRAM_ATTR FunctionBlock::readInputValues(IOValue* values) {
    for (size_t index = 0; index < numInputs; index++) {
        const uint8_t flags = inputFlag(index);
        IOValue value = inputs()[index];
        // Check if input is a reference
        if (flags & IO_FLAG_REF) {
            value = *value.ref;
            // Check if value needs type conversion
            if (flags & IO_FLAG_CONV_TYPE_MASK) {
                const uint8_t ioConvType = (flags & IO_FLAG_CONV_TYPE_MASK);
                const uint8_t inputType = (flags & IO_FLAG_TYPE_MASK);
                switch (inputType) {
                    case IO_TYPE_BOOL:
                    case IO_TYPE_UINT:
                    case IO_TYPE_TIME:
                        if (ioConvType == IO_CONV_FLOAT)    { value.u = value.f;  break; }
                        if (ioConvType == IO_CONV_SIGNED)   { value.u = value.i;  break; }
                        break;
                    case IO_TYPE_FLOAT:
                        if (ioConvType == IO_CONV_UNSIGNED) { value.f = value.u;  break; }
                        if (ioConvType == IO_CONV_SIGNED)   { value.f = value.i;  break; }
                        break;
                    case IO_TYPE_INT:
                        if (ioConvType == IO_CONV_FLOAT)    { value.i = value.f;  break; }
                        if (ioConvType == IO_CONV_UNSIGNED) { value.i = value.u;  break; }
                        break;
                }
            }
            // Check if value needs inversion
            if (flags & IO_FLAG_REF_INVERT) {
                if (value.u != 0) value.u = 0;
                else value.u = 1;
            }
        }
        values[index] = value;
    }
}

void FunctionBlock::connectInput(uint8_t inputNum, FunctionBlock* sourceFunc, uint8_t outputNum, bool inverted)
{
    inputs()[inputNum].ref = sourceFunc->getOutputRef(outputNum);
    setInputFlag(inputNum, IO_FLAG_REF);
    
    // Check if input reference needs type conversion
    uint8_t outputFlags = sourceFunc->outputFlags()[outputNum];
    IO_TYPE outputType = readFlagIOType(outputFlags);
    IO_TYPE inputType = readInputType(inputNum);
    setInputConversionType(inputNum, IO_CONV_NONE);
    switch (inputType) {
        case IO_TYPE_BOOL:
        case IO_TYPE_UINT:
        case IO_TYPE_TIME:
            if (outputType == IO_TYPE_FLOAT)    setInputConversionType(inputNum, IO_CONV_FLOAT);
            else if (outputType == IO_TYPE_INT) setInputConversionType(inputNum, IO_CONV_SIGNED);
            break;
        case IO_TYPE_INT:
            if (outputType == IO_TYPE_FLOAT)    setInputConversionType(inputNum, IO_CONV_FLOAT);
            else if (outputType != IO_TYPE_INT) setInputConversionType(inputNum, IO_CONV_UNSIGNED);
            break;
        case IO_TYPE_FLOAT:
            if (outputType == IO_TYPE_INT)      setInputConversionType(inputNum, IO_CONV_SIGNED);
            else if (outputType != IO_TYPE_FLOAT) setInputConversionType(inputNum, IO_CONV_UNSIGNED);
            break;
    }
    // Check if input is inverted
    if (inverted && inputType == IO_TYPE_BOOL)
        setInputFlag(inputNum, IO_FLAG_REF_INVERT);
    else
        clearInputFlag(inputNum, IO_FLAG_REF_INVERT);
}

void FunctionBlock::disconnectInput(uint8_t inputNum) {
    IOValue value = inputValue(inputNum);
    clearInputFlag(inputNum, IO_FLAG_REF | IO_FLAG_REF_INVERT | IO_FLAG_CONV_TYPE_MASK);
    setInput(inputNum, value);
}

const char* FunctionBlock::getIOTypeString(IO_TYPE ioType)
{
    switch (ioType) {
        case IO_TYPE_BOOL:  return "BOOL";
        case IO_TYPE_UINT:  return "UINT";
        case IO_TYPE_INT:   return "INT";
        case IO_TYPE_FLOAT: return "FLOAT";
        case IO_TYPE_TIME:  return "TIME";
        default:            return "UNKNOWN";
    }
}

void FunctionBlock::enableMonitoring(bool once) {
    monitorOnce = once;
    setFuncFlag(FUNC_FLAG_MONITORING);
    if (!monitoringValues) monitoringValues = (IOValue*)calloc(sizeof(IOValue), numInputs + numOutputs);
}

void FunctionBlock::disableMonitoring() {
    clearFuncFlag(FUNC_FLAG_MONITORING);
    free(monitoringValues);
    monitoringValues = nullptr;
    monitorOnce = false;
}

void IRAM_ATTR FunctionBlock::reportMonitoringValues(Link* link) {
    if (!monitoringValues) return;
    link->monitoringValueHandler(this, monitoringValues, (numInputs + numOutputs) * sizeof(IOValue));
    if (monitorOnce) disableMonitoring();
}

void FunctionBlock::executeQueuedCommands(Link* link) {

}

void FunctionBlock::initInput(uint8_t index, bool value) {
    inputs()[index].u = value;
    inputFlags()[index] = IO_TYPE_BOOL;
}
void FunctionBlock::initInput(uint8_t index, uint32_t value) {
    inputs()[index].u = value;
    inputFlags()[index] = IO_TYPE_UINT;
}
void FunctionBlock::initInput(uint8_t index, int32_t value) {
    inputs()[index].i = value;
    inputFlags()[index] = IO_TYPE_INT;
}
void FunctionBlock::initInput(uint8_t index, float value) {
    inputs()[index].f = value;
    inputFlags()[index] = IO_TYPE_FLOAT;
}

void FunctionBlock::initOutput(uint8_t index, bool value) {
    outputs()[index].u = value;
    outputFlags()[index] = IO_TYPE_BOOL;
}
void FunctionBlock::initOutput(uint8_t index, uint32_t value) {
    outputs()[index].u = value;
    outputFlags()[index] = IO_TYPE_UINT;
}
void FunctionBlock::initOutput(uint8_t index, int32_t value) {
    outputs()[index].i = value;
    outputFlags()[index] = IO_TYPE_INT;
}
void FunctionBlock::initOutput(uint8_t index, float value) {
    outputs()[index].f = value;
    outputFlags()[index] = IO_TYPE_FLOAT;
}
