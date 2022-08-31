import { UIConnection } from "./UIConnection.js"
import Vec2, { vec2 } from "../Vector2.js"
import { UIBlock } from "./UIBlock.js"
import { NodeElement } from "../UI/NodeElement.js"
import { MovableElement } from "../UI/MovableElement.js"
import { Colors } from "../View/Colors.js"
import { EventEmitter } from "../Events.js"
import { UICircuitElement } from "./UICircuitElement.js"

const pinWidth  = 0.5
const pinHeight = 0.15
const pinGraphicsByOrientation =
{
    left: {
        size:   vec2(pinWidth, pinHeight),
        offset: vec2(pinWidth, 0.5 - pinHeight/2)
    },
    right: {
        size:   vec2(pinWidth, pinHeight),
        offset: vec2(0.0, 0.5 - pinHeight/2)
    },
    up: {
        size:   vec2(pinHeight, pinWidth),
        offset: vec2(0.5 - pinHeight/2, pinWidth)
    },
    down: {
        size:   vec2(pinHeight, pinWidth),
        offset: vec2(0.5 - pinHeight/2, 0.0)
    }
}

type PortOrientation = 'left' | 'right' | 'up' | 'down'
type PortDataDirection = 'input' | 'output'

export class UIPort extends MovableElement implements UICircuitElement
{
    constructor(
        public readonly parent:         MovableElement,
        public readonly offset:         Vec2,
        public readonly snap:           Vec2,
        public readonly orientation:    PortOrientation,
        public readonly dataDirection:  PortDataDirection,
        public readonly name:           string,
        public readonly ioNum?:         number,
        private         value?:         number
    ) {
        super(offset, snap)
        this.style({
            cursor: 'default',
            backgroundColor: Colors.SelectionDark,
            opacity: '0'
        })

        this.parent.append(this)
        this.parent.events.subscribe('moved', this.onParentMoved.bind(this))

        this.drawPin()
    }
    // UICircuitElement interface

    readonly typeName = 'Port'
    readonly isMovable = false

    set highlighted(selected: boolean) {
        this.node.style.opacity = selected ? '0.5' : '0'
    }

    portEvents = new EventEmitter<typeof this, 'connected' | 'disconnected' | 'valueModified'>(this)

    absolutePos() {
        return Vec2.add(this.parent.currentPos, this.offset)
    }

    getValue() {
        return this.value
    }

    setValue(value: number) {

        this.value = value
    }

    modifyValue(value: number) {
        this.value = value
        this.portEvents.emit('valueModified', this)
    }

    connect(connection: UIConnection) {
        if (!connection) return
        this.connection = connection
        this.events.subscribe('moved', this.connection.update.bind(this))
        this.portEvents.emit('connected', this)
    }

    disconnect() {
        if (!this.connection) return
        this.events.unsubscribe(this.connection.update.bind(this))
    }

    private connection?:    UIConnection
    private pin: NodeElement

    private onParentMoved() {
        this.connection?.update()
    }

    private drawPin() {
        if (this.pin) this.pin.remove()
        const pinGraphics = pinGraphicsByOrientation[this.orientation]
        const size   = Vec2.mul(this.snap, pinGraphics.size).round()
        const offset = Vec2.mul(this.snap, pinGraphics.offset).round()

        this.pin = new NodeElement('div')
            .size(size)
            .position(offset, 'absolute')
            .backgroundColor(Colors.Link)

        this.append(this.pin)
    }
}