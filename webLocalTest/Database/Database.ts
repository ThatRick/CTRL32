import { IProgramSource, ICircuitSource } from "../ProgramModel/IDataTypes.js"


export class ControlDatabase
{
    private static readonly dbName = 'control.io'
    private static readonly version = 1

    private static readonly PROGRAM_STORE = 'programs'
    private static readonly TEMPLATE_STORE = 'templates'
    
    private db: IDBDatabase

    constructor()
    {
        const openReq = indexedDB.open(ControlDatabase.dbName, ControlDatabase.version)

        openReq.onupgradeneeded = (ev) => {
            const db = openReq.result
            db.createObjectStore(ControlDatabase.PROGRAM_STORE, {keyPath: 'id'})
            db.createObjectStore(ControlDatabase.TEMPLATE_STORE, {keyPath: 'id'})
        }

        openReq.onsuccess = (ev) => {
            this.db = openReq.result

            this.db.onerror = err => console.error('Database error:', err.type)
        }
    }

    getProgramIds(callback: (keys: IDBValidKey[]) => void) {
        this.getStoreKeys(ControlDatabase.PROGRAM_STORE, callback)
    }
    loadProgram(programId: number, onComplete: (program: IProgramSource) => void) {
        this.getObject(ControlDatabase.PROGRAM_STORE, programId, onComplete)
    }
    saveProgram(program: IProgramSource, onComplete: (result: IDBValidKey) => void) {
        this.putObject(ControlDatabase.PROGRAM_STORE, program, onComplete)
    }

    getTemplateIds(callback: (keys: IDBValidKey[]) => void) {
        this.getStoreKeys(ControlDatabase.TEMPLATE_STORE, callback)
    }
    loadTemplate(templateId: number, onComplete: (circuit: ICircuitSource) => void) {
        this.getObject(ControlDatabase.TEMPLATE_STORE, templateId, onComplete)
    }
    saveTemplate(program: ICircuitSource, onComplete: (result: IDBValidKey) => void) {
        this.putObject(ControlDatabase.TEMPLATE_STORE, program, onComplete)
    }


    private getStoreKeys(storeName: string, callback: (keys: IDBValidKey[]) => void) {
        const t = this.db.transaction(storeName, 'readonly')
        const req = t.objectStore(storeName).getAllKeys()
        req.onsuccess = () => {
            const keys = req.result
            callback(keys)
        }
    }

    private getObject<T extends Object>(storeName: string, key: IDBValidKey, onComplete: (obj: T) => void) {
        const t = this.db.transaction(storeName, 'readonly')
        const req = t.objectStore(storeName).get(key)
        req.onsuccess = () => onComplete(req.result as T)
        req.onerror = err => {
            console.error('Database - get object:', err.type)
            onComplete(null)
        }
    }

    private putObject<T extends Object>(storeName: string, obj: T, onComplete: (result: IDBValidKey) => void) {
        const t = this.db.transaction(storeName, 'readwrite')
        const req = t.objectStore(storeName).put(obj)
        
        req.onsuccess = () => onComplete(req.result)
        req.onerror = err => {
            console.error('Database - put object:', err.type)
            onComplete(null)
        }
    }
}