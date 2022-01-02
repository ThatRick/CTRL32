#include "../FunctionBlock.h"
#include "../FunctionLib.h"

namespace TimerLib
{

enum FUNC_ID
{
    FUNC_ID_ON_DELAY,
    FUNC_ID_OFF_DELAY,
    FUNC_ID_PULSE,
    FUNC_COUNT
};

const char* names[] =
{
    "ON_DELAY",
    "OFF_DELAY",
    "PULSE"
};

class OnDelay : public FunctionBlock
{
    struct Inputs {
        uint32_t    input;
        uint32_t    delay_ms;
        uint32_t    res;
    };

    struct Outputs {
        uint32_t    out;
        uint32_t    left_ms;
    };

public:
    OnDelay() : FunctionBlock(3, 2, OPCODE(LIB_ID_TIMERS, FUNC_ID_ON_DELAY))
    {
        initInput(0, false);
        initInput(1, 5000u);
        initInput(2, false);

        initOutput(0, false);
        initOutput(1, 0u);
    }

    const char* name() { return names[FUNC_ID_ON_DELAY]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const Inputs* inputs = (Inputs*)inputValues;
        Outputs* outputs = (Outputs*)outputValues;

        // Reset output
        if (!inputs->input) {
            outputs->out = false;
            outputs->left_ms = 0;
        }
        // Reset time
        else if (inputs->res) {
            outputs->out = inputs->input;
            outputs->left_ms = 0;
        }
        // Start timer
        else if (inputs->input && !outputs->out && outputs->left_ms == 0) {
            outputs->left_ms = inputs->delay_ms - dt;
        }
        // Time has passed
        else if (inputs->input && !outputs->out && outputs->left_ms < dt) {
            outputs->left_ms = 0;
            outputs->out = true;
        }
        // Reduce time left
        else if (inputs->input && !outputs->out) {
            outputs->left_ms -= dt;
        }
    }
};


class OffDelay : public FunctionBlock
{
    struct Inputs {
        uint32_t    input;
        uint32_t    delay_ms;
        uint32_t    res;
    };

    struct Outputs {
        uint32_t    out;
        uint32_t    left_ms;
    };

public:
    OffDelay() : FunctionBlock(3, 2, OPCODE(LIB_ID_TIMERS, FUNC_ID_OFF_DELAY))
    {
        initInput(0, true);
        initInput(1, 5000u);
        initInput(2, false);

        initOutput(0, true);
        initOutput(1, 0u);
    }

    const char* name() { return names[FUNC_ID_OFF_DELAY]; }

    void run(IOValue* inputValues, IOValue* outputValues, uint32_t dt)
    {
        const Inputs* inputs = (Inputs*)inputValues;
        Outputs* outputs = (Outputs*)outputValues;

        // Set output
        if (inputs->input) {
            outputs->out = true;
            outputs->left_ms = 0;
        }
        // Reset time
        else if (inputs->res) {
            outputs->out = inputs->input;
            outputs->left_ms = 0;
        }
        // Start timer
        else if (!inputs->input && outputs->out && outputs->left_ms == 0) {
            outputs->left_ms = inputs->delay_ms - dt;
        }
        // Time has passed
        else if (!inputs->input && outputs->out && outputs->left_ms < dt) {
            outputs->left_ms = 0;
            outputs->out = false;
        }
        // Reduce time left
        else if (!inputs->input && outputs->out) {
            outputs->left_ms -= dt;
        }
    }
};

class Library: public FunctionLibrary
{
public:
    Library() : FunctionLibrary(LIB_ID_TIMERS, "Timers", FUNC_COUNT, names) {}

    FunctionBlock* createFunction(uint8_t func_id, uint8_t numInputs, uint8_t numOutputs)
    {
        switch(func_id)
        {
            case FUNC_ID_ON_DELAY:      return new OnDelay();   
            case FUNC_ID_OFF_DELAY:     return new OffDelay();   
            
            default:                    return nullptr;
        }
    }
};

}