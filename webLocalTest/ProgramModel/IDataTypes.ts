

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

export interface IFunctionBlockType
{
    name:                   string
    inputs:                 IDataPin[]
    outputs:                IDataPin[]
    variableInputCount?:    IVariableIOCount
    variableOutputCount?:   IVariableIOCount
    visual?: {
        noHeader?:          boolean
        noInputNames?:      boolean
        noOutputNames?:     boolean
        symbol?:            string,
        width?:             number
    }
}

export interface ICircuitSource extends IFunctionBlockType
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

export interface IFunctionLib
{
    name:           string
    functions:      IFunctionBlockType[]
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
