export class EventEmitter {
    constructor(eventSource) {
        this.eventSource = eventSource;
        this.eventCallbacks = new Map();
        this.subscriberCallbacks = new Map();
    }
    subscribe(eventName, callback, subscriber) {
        if (this.eventCallbacks.has(eventName)) {
            this.eventCallbacks.get(eventName).push(callback);
        }
        else {
            this.eventCallbacks.set(eventName, [callback]);
        }
        if (subscriber) {
            if (this.subscriberCallbacks.has(subscriber)) {
                this.subscriberCallbacks.get(subscriber).push(callback);
            }
            else {
                this.subscriberCallbacks.set(subscriber, [callback]);
            }
        }
    }
    subscribeEvents(events, subscriber) {
        Object.entries(events).forEach(([eventName, callback]) => {
            this.subscribe(eventName, callback, subscriber);
        });
    }
    unsubscribeEvents(subscriber) {
        const callbacks = this.subscriberCallbacks.get(subscriber);
        callbacks.forEach(callback => this.unsubscribe(callback));
    }
    unsubscribe(callback) {
        this.eventCallbacks.forEach((callbacks, eventName) => {
            callbacks = callbacks.filter(entry => entry != callback);
            this.eventCallbacks.set(eventName, callbacks);
        });
    }
    emit(eventName, payload) {
        if (this.eventCallbacks.size == 0)
            return;
        const callbacks = this.eventCallbacks.get(eventName);
        callbacks?.forEach(callback => callback(this.eventSource, payload));
    }
    clear() {
        this.eventCallbacks.clear();
    }
}
