import { htmlElement } from "./HTML"

export class EventEmitter<SourceType extends Object, EventNames extends string>
{
    subscribe(eventName: EventNames, callback: (source: SourceType, payload?: any) => void, subscriber?: Object): void {
        if (this.eventCallbacks.has(eventName)) {
            this.eventCallbacks.get(eventName).push(callback)
        } else {
            this.eventCallbacks.set(eventName, [callback])
        }

        if (subscriber) {
            if (this.subscriberCallbacks.has(subscriber)) {
                this.subscriberCallbacks.get(subscriber).push(callback)
            } else {
                this.subscriberCallbacks.set(subscriber, [callback])
            }            
        }

    }

    subscribeEvents(events: Partial<Record<EventNames, (source: SourceType, payload?: any) => void>>, subscriber?: Object) {
        Object.entries(events).forEach(([eventName, callback]) => {
            this.subscribe(eventName as EventNames, callback as (source: SourceType, payload?: any) => void, subscriber)
        })
    }

    unsubscribeEvents(subscriber: Object) {
        const callbacks = this.subscriberCallbacks.get(subscriber)
        callbacks.forEach(callback => this.unsubscribe(callback))
    }

    unsubscribe(callback: (...any) => void) {
        this.eventCallbacks.forEach((callbacks, eventName) => {
            callbacks = callbacks.filter(entry => entry != callback)
            this.eventCallbacks.set(eventName, callbacks)
        })
    }
    emit(eventName: EventNames, payload?: any) {
        if (this.eventCallbacks.size == 0) return
        const callbacks = this.eventCallbacks.get(eventName)
        callbacks?.forEach(callback => callback(this.eventSource, payload))
    }

    clear() {
        this.eventCallbacks.clear()
    }

    constructor(protected eventSource: SourceType) {}
    
    protected eventCallbacks = new Map<string, Array<(source: SourceType, event: EventNames) => void>>()

    protected subscriberCallbacks = new Map<Object, Array<(source: SourceType, event: EventNames) => void>>()
}