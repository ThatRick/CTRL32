
import { IFunctionBlockType, IFunctionLib } from "../IDataTypes.js";

const minimal = {
    noHeader:       true,
    noInputNames:   true,
    noOutputNames:  true,
    width:          3
}

const onlyInputNames = {
    noHeader:       true,
    noOutputNames:  true,
    width:          3
}

const AND: IFunctionBlockType = 
{
    name: 'AND',
    inputs: [
        { name: '0',    type: 'BOOL',   initValue: 1 },
        { name: '1',    type: 'BOOL',   initValue: 1 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 1 },
    ],
    variableInputCount: { min: 2, max: 32 },
    visual: minimal
}

const OR: IFunctionBlockType = 
{
    name: 'OR',
    inputs: [
        { name: '0',    type: 'BOOL',   initValue: 0 },
        { name: '1',    type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    variableInputCount: { min: 2, max: 32 },
    visual: minimal
}

const XOR: IFunctionBlockType = 
{
    name: 'XOR',
    inputs: [
        { name: '0',    type: 'BOOL',   initValue: 0 },
        { name: '1',    type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    variableInputCount: { min: 2, max: 32 },
    visual: minimal
}

const NOT: IFunctionBlockType = 
{
    name: 'NOT',
    inputs: [
        { name: 'in',   type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 1 },
    ],
    visual: minimal
}

const RS: IFunctionBlockType = 
{
    name: 'RS',
    inputs: [
        { name: 'R',    type: 'BOOL',   initValue: 0 },
        { name: 'S',    type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    visual: onlyInputNames
}

const SR: IFunctionBlockType = 
{
    name: 'SR',
    inputs: [
        { name: 'S',    type: 'BOOL',   initValue: 0 },
        { name: 'R',    type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    visual: onlyInputNames
}

const RisingEdge: IFunctionBlockType = 
{
    name: 'Rising',
    inputs: [
        { name: 'in',   type: 'BOOL',   initValue: 0 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    visual: {...minimal, symbol: '_|‾'}
}

const FallingEdge: IFunctionBlockType = 
{
    name: 'Falling',
    inputs: [
        { name: 'in',   type: 'BOOL',   initValue: 1 },
    ],
    outputs: [
        { name: 'out',  type: 'BOOL',   initValue: 0 },
    ],
    visual: {...minimal, symbol: '‾|_'}
}

export const LogicLib: IFunctionLib =
{
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
}