const AND = {
    name: 'AND',
    inputs: [
        { name: '0', type: 'BOOL', initValue: 1 },
        { name: '1', type: 'BOOL', initValue: 1 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 1 },
    ],
    variableInputCount: { min: 2, max: 32 }
};
const OR = {
    name: 'OR',
    inputs: [
        { name: '0', type: 'BOOL', initValue: 0 },
        { name: '1', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ],
    variableInputCount: { min: 2, max: 32 }
};
const XOR = {
    name: 'XOR',
    inputs: [
        { name: '0', type: 'BOOL', initValue: 0 },
        { name: '1', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ],
    variableInputCount: { min: 2, max: 32 }
};
const NOT = {
    name: 'NOT',
    inputs: [
        { name: 'in', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 1 },
    ]
};
const RS = {
    name: 'RS',
    inputs: [
        { name: 'R', type: 'BOOL', initValue: 0 },
        { name: 'S', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ]
};
const SR = {
    name: 'SR',
    inputs: [
        { name: 'S', type: 'BOOL', initValue: 0 },
        { name: 'R', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ]
};
const RisingEdge = {
    name: 'RisingEdge',
    inputs: [
        { name: 'in', type: 'BOOL', initValue: 0 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ]
};
const FallingEdge = {
    name: 'FallingEdge',
    inputs: [
        { name: 'in', type: 'BOOL', initValue: 1 },
    ],
    outputs: [
        { name: 'out', type: 'BOOL', initValue: 0 },
    ]
};
export const LogicLib = {
    name: 'Logic',
    functions: [
        AND,
        OR,
        XOR,
        NOT,
        RS,
        SR,
        RisingEdge,
        FallingEdge
    ]
};
