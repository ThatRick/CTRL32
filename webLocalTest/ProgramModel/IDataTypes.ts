

export type IODataType = 
    'BOOL' |
    'INT' |
    'UINT' |
    'FLOAT' |
    'TIME'

export interface IDataPin
{
    name:       string
    type:       IODataType
    initValue:  number
}

export interface IVariableIOCount
{
    min:        number
    max:        number
}

export interface IFunctionBlockInterface
{
    name:                   string
    inputs:                 IDataPin[]
    outputs:                IDataPin[]
}

export interface IFunctionBlockType extends IFunctionBlockInterface
{
    name:                   string
    inputs:                 IDataPin[]
    outputs:                IDataPin[]
    variableInputCount?:    IVariableIOCount
    variableOutputCount?:   IVariableIOCount
}

export interface ICircuitSource extends IFunctionBlockInterface
{
    name:                   string
    inputs:                 IDataPin[]
    outputs:                IDataPin[]
    functionCalls:          IFunctionBlockCall[]
    connections:            IIOConnectionData[]

    editorMetaData:         ICircuitSourceMetaData
}

export interface IPosition
{
    x:          number
    y:          number
}

export interface IFunctionCallMetaData
{
    id:         number
    pos:        IPosition
    comment:    string
}

export interface IIOConnectionMetaData
{
    id:         number
    nodePos:    IPosition[]
}

export interface ICircuitSourceMetaData
{
    functionsCalls: IFunctionCallMetaData[]
    connections:    IIOConnectionMetaData[]
}

export interface IFunctionLib
{
    name:           string
    functions:      IFunctionBlockType[]
}

export interface IIOConnectionData
{
    id:             number
    targetBlock:    number
    targetIO:       number
    sourceBlock:    number
    sourceIO:       number
    inverted:       boolean
}

export interface IFunctionBlockCall
{
    id:             number
    opcode:         number
    inputValues:    number[]
    outputValues:   number[]
    circuitType?:   string
}

export interface ITaskSource
{
    id:             number
    interval:       number
    offset:         number
    functionBlocks: number[]
}

export interface IProgramSource
{
    id:             number
    tasks:          ITaskSource[]
    mainCircuit:    IFunctionBlockCall
    repository:     ICircuitSource[]
    metaData:       ICircuitSourceMetaData[]
}
