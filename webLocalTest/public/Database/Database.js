export class ControlDatabase {
    constructor() {
        const openReq = indexedDB.open(ControlDatabase.dbName, ControlDatabase.version);
        openReq.onupgradeneeded = (ev) => {
            const db = openReq.result;
            db.createObjectStore(ControlDatabase.PROGRAM_STORE, { keyPath: 'id' });
            db.createObjectStore(ControlDatabase.TEMPLATE_STORE, { keyPath: 'id' });
        };
        openReq.onsuccess = (ev) => {
            this.db = openReq.result;
            this.db.onerror = err => console.error('Database error:', err.type);
        };
    }
    getProgramIds(callback) {
        this.getStoreKeys(ControlDatabase.PROGRAM_STORE, callback);
    }
    loadProgram(programId, onComplete) {
        this.getObject(ControlDatabase.PROGRAM_STORE, programId, onComplete);
    }
    saveProgram(program, onComplete) {
        this.putObject(ControlDatabase.PROGRAM_STORE, program, onComplete);
    }
    getTemplateIds(callback) {
        this.getStoreKeys(ControlDatabase.TEMPLATE_STORE, callback);
    }
    loadTemplate(templateId, onComplete) {
        this.getObject(ControlDatabase.TEMPLATE_STORE, templateId, onComplete);
    }
    saveTemplate(program, onComplete) {
        this.putObject(ControlDatabase.TEMPLATE_STORE, program, onComplete);
    }
    getStoreKeys(storeName, callback) {
        const t = this.db.transaction(storeName, 'readonly');
        const req = t.objectStore(storeName).getAllKeys();
        req.onsuccess = () => {
            const keys = req.result;
            callback(keys);
        };
    }
    getObject(storeName, key, onComplete) {
        const t = this.db.transaction(storeName, 'readonly');
        const req = t.objectStore(storeName).get(key);
        req.onsuccess = () => onComplete(req.result);
        req.onerror = err => {
            console.error('Database - get object:', err.type);
            onComplete(null);
        };
    }
    putObject(storeName, obj, onComplete) {
        const t = this.db.transaction(storeName, 'readwrite');
        const req = t.objectStore(storeName).put(obj);
        req.onsuccess = () => onComplete(req.result);
        req.onerror = err => {
            console.error('Database - put object:', err.type);
            onComplete(null);
        };
    }
}
ControlDatabase.dbName = 'control.io';
ControlDatabase.version = 1;
ControlDatabase.PROGRAM_STORE = 'programs';
ControlDatabase.TEMPLATE_STORE = 'templates';
