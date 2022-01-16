export type Subscriber<EventType, SourceType> = (event: Event<EventType, SourceType>) => void

interface Event<EventType, SourceType> {
    type:   EventType
    source: SourceType
} 

export class EventEmitter<EventType extends number, SourceType extends Object>
{
    subscribe(fn: Subscriber<EventType, SourceType>, eventMask?: EventType[]): void {
        const typeMask = eventMask ? eventMask.reduce((mask, type) => mask += (1 << type), 0) : null
        this.subscribers.set(fn, typeMask)
    }
    unsubscribe(fn: Subscriber<EventType, SourceType>): void {
        const successful = this.subscribers.delete(fn)
        if (!successful) console.error('Could not unsubscribe event listener', fn, [...this.subscribers.keys()])
    }
    emit(type: EventType) {
        if (this.subscribers.size == 0) return
        const event = { type, source: this.eventSource }
        this.subscribers.forEach((typeMask, fn) => {
            if (typeMask == null || ((1 << type) & typeMask)) fn(event)
        })
    }

    clear() {
        this.subscribers.clear()
    }

    constructor(protected eventSource: SourceType) {

    }
    
    protected subscribers = new Map<Subscriber<EventType, SourceType>, number>()
}