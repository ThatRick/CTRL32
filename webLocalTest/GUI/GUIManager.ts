import Vec2, {vec2} from "../Vector2.js"
import { GUIDynamicElement } from "./GUIDynamicElement.js"
import { htmlElement } from "../HTML.js"


export class GUIManager
{
    node: HTMLDivElement

    elements = new Set<GUIDynamicElement>()
    
    selection: GUIDynamicElement

    private _scale = 1

    constructor(parent?: HTMLElement, style: Partial<CSSStyleDeclaration> = {}) {
        this.node = htmlElement('div', {
            style: {
                position:   'relative',
                margin:     '0px',
                padding:    '0px',
                boxSizing:  'border-box',
                transformOrigin: 'top left',
                ...style
            },
            parent
        })

        this.node.onpointerdown = this.onPointerDown

        requestAnimationFrame(this.update.bind(this))
    }
    
    addElement(element: GUIDynamicElement) {
        this.elements.add(element)
        this.node.appendChild(element.node)
    }

    deselect() {
        if (!this.selection) return
        this.selection.highlight(false)
        this.node.appendChild(this.selection.node)
        this.selection = null
    }

    selectElement(element: GUIDynamicElement) {
        if (!this.elements.has(element)) return
        if (this.selection && this.selection != element) {
            this.deselect()
        }
        this.selection = element
        element.highlight(true)
    }

    removeElement(element: GUIDynamicElement) {
        if (this.selection == element) this.selection = null
        this.elements.delete(element)
    }

    onPointerDown = (ev: PointerEvent) => {
        if (ev.target == this.node) this.deselect()
        // ev.stopPropagation()
    }

    update() {
        this.elements.forEach(elem => elem.update())
        requestAnimationFrame(this.update.bind(this))
    }

    setScale(scale: number) {
        this._scale = scale
        this.node.style.transform = `scale(${scale})`
    }

    get scale() { return this._scale }
}