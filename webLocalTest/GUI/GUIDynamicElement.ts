import Vec2, {vec2} from "../Vector2.js"
import { GUIPointerHandler } from './GUIPointerHandlers.js'
import { NodeElement } from "./UIElements.js"

export interface IGUI {
    selectElement(elem: GUIDynamicElement): void
    removeElement(elem: GUIDynamicElement): void
    addElement(elem: GUIDynamicElement): void
    scale: number
}

export class GUIDynamicElement extends NodeElement<'div'> {
    readonly currentPos = vec2(0, 0)
    readonly currentSize = vec2(0, 0)
    
    private newPos: Vec2
    private newSize: Vec2

    private _gui: IGUI

    constructor(pos: Vec2, size: Vec2, gui: IGUI) {
        super('div')
        gui.addElement(this)
        this._gui = gui
        this.setPos(pos)
        this.setSize(size)
        this.node.style.zIndex = '2'
        this.node.addEventListener('pointerdown', () => this._gui.selectElement(this) )
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

    get gui() { return this._gui }

    remove() {
        this._gui.removeElement(this)
        super.remove()
    }

    didMove: () => void
    didResize: () => void

}
