import { IFunctionCallMetaData, IIOConnectionMetaData } from "./IDataTypes.js"

class Position
{
    x:  number
    y:  number
}

class FunctionBlockMetaData
{
    id:         number
    comment:    string
    pos:        Position
}

class IOConnectionMetaData
{
    id:         number
    nodePos:    Position[]
}

export class CircuitTypeMetaData
{
    name:                   string
    comment:                string
    ioNames:                string[]
    ioComments:             string[]
    protected _functions:    FunctionBlockMetaData[]
    protected _connections:  IOConnectionMetaData[]
}