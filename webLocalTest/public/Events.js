export class EventEmitter {
    constructor(eventSource) {
        this.eventSource = eventSource;
        this.subscribers = new Set();
    }
    subscribe(eventNames, callback) {
        this.subscribers.add({ eventNames, callback });
    }
    unsubscribe(callback) {
        let successful = false;
        this.subscribers.forEach(sub => {
            if (sub.callback == callback)
                successful = this.subscribers.delete(sub);
        });
        if (!successful)
            console.error('Could not unsubscribe event subscriber', callback);
    }
    emit(eventName) {
        if (this.subscribers.size == 0)
            return;
        this.subscribers.forEach(({ eventNames, callback }) => {
            if (eventNames.includes(eventName))
                callback(eventName, this.eventSource);
        });
    }
    clear() {
        this.subscribers.clear();
    }
}
