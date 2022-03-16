export class IOConnection {
    constructor(parentCircuit, data) {
        this.parentCircuit = parentCircuit;
        this.data = data;
    }
    static Connect(parentCircuit, connection) {
        return new IOConnection(parentCircuit, {
            id: parentCircuit.getNewConnectionID(),
            ...connection
        });
    }
}
