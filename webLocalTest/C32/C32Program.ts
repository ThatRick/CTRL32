
export interface IInitValue
{
    ioNum:          number
    value:          number
}

export interface IFunctionBlock
{
    opcode:         number
    numInputs?:     number
    numOutputs?:    number
    initValues?:    IInitValue[]
    circuit?:       ICircuit
    templateRef?:   number
}

export interface IConnection
{
    targetBlock:    number  // circuit: -1
    targetIO:       number
    sourceBlock:    number  // circuit: -1
    sourceIO:       number
    inverted?:      boolean
}

export interface ICircuit
{
    id:             number
    ioTypes:        number,
    funcList:       IFunctionBlock[]
    connections:    IConnection[]
}

export interface ITask
{
    interval:       number
    offset:         number
    funcList:       number[]
}

export interface IProgram extends ICircuit
{
    tasks:          ITask[]
    templates?:     ICircuit[]
}

export interface IPosition
{
    x:              number
    y:              number
}

export interface ICircuitLayout
{
    id:             number
    name:           string
    desc:           string
    ioNames:        string[]
    funcDescs:      string[]
    funcPositions:  IPosition[]
    connRoutes:     IPosition[][]
}