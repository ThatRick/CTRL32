
export class EventEmitter<SourceType extends Object, EventNames extends string>
{
    subscribe(eventNames: EventNames[], callback: (event: EventNames, source: SourceType) => void): void {
        this.subscribers.add({ eventNames, callback })
    }

    unsubscribe(callback: () => void) {
        let successful = false
        this.subscribers.forEach(sub => {
            if (sub.callback == callback) successful = this.subscribers.delete(sub)
        })
        if (!successful) console.error('Could not unsubscribe event subscriber', callback)
    }
    emit(eventName: EventNames) {
        if (this.subscribers.size == 0) return
        this.subscribers.forEach(({eventNames, callback}) => {
            if (eventNames.includes(eventName)) callback(eventName, this.eventSource)
        })
    }

    clear() {
        this.subscribers.clear()
    }

    constructor(protected eventSource: SourceType) {

    }
    
    protected subscribers = new Set<{eventNames: EventNames[], callback: (name: EventNames, source: SourceType) => void}>()
}