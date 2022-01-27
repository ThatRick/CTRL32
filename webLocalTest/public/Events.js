export class EventEmitter {
    constructor(eventSource) {
        this.eventSource = eventSource;
        this.subscribers = new Map();
    }
    subscribe(eventName, callback) {
        if (this.subscribers.has(eventName)) {
            this.subscribers.get(eventName).push(callback);
        }
        else {
            this.subscribers.set(eventName, [callback]);
        }
    }
    subscribeEvents(events) {
        Object.entries(events).forEach(([eventName, callback]) => {
            this.subscribe(eventName, callback);
        });
    }
    unsubscribe(callback) {
        this.subscribers.forEach(callbacks => {
            callbacks = callbacks.filter(entry => entry != callback);
        });
    }
    emit(eventName, payload) {
        if (this.subscribers.size == 0)
            return;
        const callbacks = this.subscribers.get(eventName);
        callbacks?.forEach(callback => callback(this.eventSource, payload));
    }
    clear() {
        this.subscribers.clear();
    }
}
