import { htmlElement } from "./HTML"

export class EventEmitter<SourceType extends Object, EventNames extends string>
{
    subscribe(eventName: EventNames, callback: (source: SourceType, event?: EventNames) => void): void {
        if (this.subscribers.has(eventName)) {
            this.subscribers.get(eventName).push(callback)
        } else {
            this.subscribers.set(eventName, [callback])
        }
    }

    subscribeEvents(events: Partial<Record<EventNames, (source: SourceType, event?: EventNames) => void>>) {
        Object.entries(events).forEach(([eventName, callback]) => {
            this.subscribe(eventName as EventNames, callback as (source: SourceType, event?: EventNames) => void)
        })
    }

    unsubscribe(callback: () => void) {
        this.subscribers.forEach(callbacks => {
            callbacks = callbacks.filter(entry => entry != callback)
        })
    }
    emit(eventName: EventNames) {
        if (this.subscribers.size == 0) return
        const callbacks = this.subscribers.get(eventName)
        callbacks?.forEach(callback => callback(this.eventSource, eventName))
    }

    clear() {
        this.subscribers.clear()
    }

    constructor(protected eventSource: SourceType) {
    }
    
    protected subscribers = new Map<string, Array<(source: SourceType, event: EventNames) => void>>()
}