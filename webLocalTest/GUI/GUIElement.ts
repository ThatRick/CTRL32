import Vec2, {vec2} from "../Vector2.js"
import { GUIPointerHandler } from './GUIPointerHandlers.js'

interface IGUI {
    selectElement(elem: GUIElement)
}

export class GUIElement {
    node: HTMLDivElement

    readonly currentPos = vec2(0, 0)
    readonly currentSize = vec2(0, 0)
    
    private newPos: Vec2
    private newSize: Vec2

    private gui: IGUI

    constructor(pos: Vec2, size: Vec2, style?: Partial<CSSStyleDeclaration>) {
        this.node = document.createElement('div')
        style && Object.assign(this.node.style, style)
        this.setPos(pos)
        this.setSize(size)
        this.node.style.zIndex = '2'
        this.node.onpointerdown = ev => { this.gui?.selectElement(this) }
    }

    highlight(enabled: boolean) {
        this.node.style.borderColor = enabled ? 'silver' : 'grey'
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
        }
        if (this.newSize) {
            this.node.style.width =  this.newSize.x + 'px'
            this.node.style.height = this.newSize.y + 'px'
            this.currentSize.set(this.newSize)
            this.newSize = null
        }
    }

    setGUI(gui: IGUI) { this.gui = gui }

    remove() {
        this.node.remove()
    }
}


export class Movable extends GUIPointerHandler {
    initPos: Vec2

    constructor(eventTarget: HTMLElement, protected moveTarget: GUIElement) {
        super(eventTarget)
        moveTarget.node.style.position = 'absolute'
        this.initPos = vec2(moveTarget.currentPos)
        eventTarget.style.cursor = 'grab'
    }
    userOnDown = () => {
        this.initPos.set(this.moveTarget.currentPos)
        this.node.style.cursor = 'grabbing'
    }
    userOnDrag = (offset: Vec2) => {
        const maxPos = vec2(document.body.clientWidth - this.moveTarget.currentSize.x,
            document.body.clientHeight - this.moveTarget.currentSize.y)
            const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), maxPos)
            this.moveTarget.setPos(draggedPos)
        }
    userOnUp = () => {
        this.node.style.cursor = 'grab'            
    }
}


export class Resizable extends GUIPointerHandler {
    initSize: Vec2
    constructor(eventTarget: HTMLElement, protected resizeTarget: GUIElement) {
        super(eventTarget)
        this.initSize = vec2(resizeTarget.currentSize)
        eventTarget.style.cursor = 'nwse-resize'
    }
    userOnDown = () => {
        this.initSize.set(this.resizeTarget.currentSize)
    }
    userOnDrag = (offset: Vec2) => {
        const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(50, 50), vec2(400, 400))
        this.resizeTarget.setSize(draggedSize)
    }
}

export class Clickable extends GUIPointerHandler {
    constructor(eventTarget: HTMLElement, protected action: () => void) {
        super(eventTarget)
        eventTarget.style.cursor = ''
    }
    userOnUp = this.action
}
