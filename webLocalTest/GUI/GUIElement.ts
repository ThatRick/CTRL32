import Vec2, {vec2} from "../Vector2.js"
import { GUIPointerHandler } from './GUIPointerHandlers.js'

interface IGUI {
    selectElement(elem: GUIElement): void
    removeElement(elem: GUIElement): void
    scale: number
}

export class GUIElement {
    node: HTMLDivElement

    readonly currentPos = vec2(0, 0)
    readonly currentSize = vec2(0, 0)
    
    private newPos: Vec2
    private newSize: Vec2

    private _gui: IGUI

    constructor(pos: Vec2, size: Vec2, style?: Partial<CSSStyleDeclaration>) {
        this.node = document.createElement('div')
        style && Object.assign(this.node.style, style)
        this.setPos(pos)
        this.setSize(size)
        this.node.style.zIndex = '2'
        //this.node.addEventListener('pointerdown', () => this.onMouseDown )
        this.node.onpointerdown = this.onMouseDown
    }

    onMouseDown = () => {
        this._gui?.selectElement(this)
    }

    highlight(enabled: boolean) {
        this.node.style.borderColor = enabled ? 'silver' : 'gray'
        this.node.style.zIndex = enabled ? '3' : '2'
    }

    setPos(pos: Vec2) {
        if (!this.newPos) this.newPos = vec2(pos)
        else this.newPos.set(pos)
    }

    setSize(size: Vec2) {
        if (!this.newSize) this.newSize = vec2(size)
        else this.newSize.set(size)
    }

    update() {
        if (this.newPos) {
            this.node.style.left =  this.newPos.x + 'px'
            this.node.style.top =   this.newPos.y + 'px'
            this.currentPos.set(this.newPos)
            this.newPos = null
            this.didMove && setTimeout(this.didMove)
        }
        if (this.newSize) {
            this.node.style.width =  this.newSize.x + 'px'
            this.node.style.height = this.newSize.y + 'px'
            this.currentSize.set(this.newSize)
            this.newSize = null
            this.didResize && setTimeout(this.didResize)
        }
    }

    setGUI(gui: IGUI) { this._gui = gui }

    get gui() { return this._gui }

    remove() {
        this._gui?.removeElement(this)
        this.node.remove()
    }

    didMove: () => void
    didResize: () => void
}


export class Movable extends GUIPointerHandler {
    initPos: Vec2
    maxPos: Vec2
    constructor(protected eventTarget: HTMLElement, protected moveTarget: GUIElement) {
        super(eventTarget)
        moveTarget.node.style.position = 'absolute'
        this.initPos = vec2(moveTarget.currentPos)
        eventTarget.style.cursor = 'grab'
    }
    userOnDown = () => {
        if (this.eventTarget == this.moveTarget.node) this.moveTarget.onMouseDown()
        this.initPos.set(this.moveTarget.currentPos)
        this.node.style.cursor = 'grabbing'
        const parent = this.moveTarget.node.parentElement
        this.maxPos = vec2(parent.clientWidth - this.moveTarget.currentSize.x, parent.clientHeight - this.moveTarget.currentSize.y)
    }
    userOnDrag = (offset: Vec2) => {
        offset.scale( 1/this.moveTarget.gui.scale )
        const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), this.maxPos)
            this.moveTarget.setPos(draggedPos)
        }
    userOnUp = () => {
        this.node.style.cursor = 'grab'
    }
}


export class Resizable extends GUIPointerHandler {
    initSize: Vec2
    maxSize: Vec2
    constructor(eventTarget: HTMLElement, protected resizeTarget: GUIElement) {
        super(eventTarget)
        this.initSize = vec2(resizeTarget.currentSize)
        eventTarget.style.cursor = 'nwse-resize'
    }
    userOnDown = () => {
        this.initSize.set(this.resizeTarget.currentSize)
        const parent = this.resizeTarget.node.parentElement
        this.maxSize = vec2(parent.clientWidth - this.resizeTarget.currentPos.x, parent.clientHeight - this.resizeTarget.currentPos.y)
    }
    userOnDrag = (offset: Vec2) => {
        const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(120, 60), this.maxSize)
        this.resizeTarget.setSize(draggedSize)
    }
}

export class Clickable extends GUIPointerHandler {
    constructor(eventTarget: HTMLElement, protected action: () => void) {
        super(eventTarget)
    }
    userOnClick = this.action
}
