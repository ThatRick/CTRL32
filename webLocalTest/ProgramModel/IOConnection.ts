import { CircuitSource } from "./CircuitSource.js"
import { FunctionBlockCall } from "./FunctionBlockCall.js"
import { IIOConnectionData } from "./IDataTypes.js"

export class IOConnection
{
    data: IIOConnectionData

    parentCircuit: CircuitSource

    constructor(parentCircuit: CircuitSource, data: IIOConnectionData)
    {
        this.parentCircuit = parentCircuit
        this.data = data
    }

    static Connect(parentCircuit: CircuitSource, connection: Omit<IIOConnectionData, 'id'>) {
        return new IOConnection(parentCircuit, {
            id: parentCircuit.getNewConnectionID(),
            ...connection
        })
    }
}