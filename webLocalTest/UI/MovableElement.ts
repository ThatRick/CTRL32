import Vec2, {vec2} from "../Vector2.js"
import { NodeElement } from "./UIElements.js"
import { EventEmitter } from "../Events.js"


export class MovableElement extends NodeElement {
    readonly currentPos = vec2(0, 0)
    readonly currentSize = vec2(0, 0)
    
    private newPos: Vec2
    private newSize: Vec2

    private animationRequest = 0

    constructor(pos: Vec2, size: Vec2) {
        super('div')
        this.setNodePos(pos)
        this.setNodeSize(size)
        this.node.style.zIndex = '2'
        this.node.style.position = 'absolute'

        this.node.addEventListener('pointerdown', ev => this.events.emit('clicked', ev))
    }

    readonly events = new EventEmitter<typeof this, 'moved' | 'resized' | 'clicked' | 'removed'>(this)

    setPos(pos: Vec2) {
        if (!this.newPos) this.newPos = vec2(pos)
        else this.newPos.set(pos)
        this.requestUpdate()
        return this
    }

    setSize(size: Vec2) {
        if (!this.newSize) this.newSize = vec2(size)
        else this.newSize.set(size)
        this.requestUpdate()
        return this
    }

    setZIndex(zIndex: number) {
        this.node.style.zIndex = zIndex.toString()
    }

    update() {
        if (this.newPos) {
            this.setNodePos(this.newPos)
            this.newPos = null
            this.events.emit('moved')
        }
        if (this.newSize) {
            this.setNodeSize(this.newSize)
            this.newSize = null
            this.events.emit('resized')
        }
        this.animationRequest = 0
    }

    remove() {
        this.events.emit('removed')
        this.events.clear()
        super.remove()
    }

    private requestUpdate() {
        if (!this.animationRequest) this.animationRequest = requestAnimationFrame(this.update.bind(this))
    }

    private setNodePos(pos: Vec2) {
        this.node.style.left =  pos.x + 'px'
        this.node.style.top =   pos.y + 'px'
        this.currentPos.set(pos)
    }

    private setNodeSize(size: Vec2) {
        this.node.style.width =  size.x + 'px'
        this.node.style.height = size.y + 'px'
        this.currentSize.set(size)
    }

}
