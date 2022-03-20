export class ProgramSource {
    constructor(source) {
        this.source = source;
    }
    addTask(task) {
        const source = this.source;
        if (source.tasks.find(aTask => aTask.id == task.id)) {
            console.error('Program: Can not add Task with duplicate id:', task.id);
            return false;
        }
        source.tasks.push(task);
        return true;
    }
    removeTask(taskId) {
        this.source.tasks = this.source.tasks.filter(task => task.id != taskId);
    }
    addCircuitType(circuitType) {
        if (this.source.repository.find(aCircType => aCircType.name == circuitType.name)) {
            console.error('Program: Can not add Circuit type with duplicate name:', circuitType.name);
            return false;
        }
        this.source.repository.push(circuitType);
        return true;
    }
    removeCircuitType(typeName) {
        // Check if circuit type is used in program
        const refs = this.getCircuitTypeReferences(typeName);
        if (refs.length > 0) {
            console.error(`Program: Can not remove Circuit type '${typeName}'. ${refs.length} types with reference found:`, refs.map(ref => ref.name));
            return false;
        }
        this.source.repository = this.source.repository.filter(circType => circType.name != typeName);
        return true;
    }
    getCircuitType(typeName) {
        return this.source.repository.find(aCircType => aCircType.name == typeName);
    }
    listCircuitTypes() {
        return this.source.repository.map(item => item.name);
    }
    getCircuitTypeReferences(typeName) {
        const isOfTypeName = (func) => (func.circuitType == typeName);
        const hasRefToTypeName = (circType) => (circType.functionCalls.find(isOfTypeName));
        return this.source.repository.filter(hasRefToTypeName);
    }
}
