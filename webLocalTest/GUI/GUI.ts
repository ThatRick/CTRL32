
import Vec2, {vec2} from "../Vector2.js"
import { htmlElement } from '../HTML.js'
import { EventEmitter } from "../Events.js"
import { GUIElement } from "./GUIElement.js"

const containerStyle: Partial<CSSStyleDeclaration> = {
    position:   'relative',
    margin:     '0px',
    padding:    '0px',
    userSelect: 'none'
}


export class GUIManager
{
    node: HTMLDivElement

    elements = new Set<GUIElement>()
    
    selection: GUIElement

    constructor(parent?: HTMLElement) {
        this.node = (parent ?? document.createElement('div')) as HTMLDivElement
        document.body.appendChild(this.node)
        document.body.style.userSelect = 'none'
        Object.assign(this.node, containerStyle)

        this.node.onpointerdown = this.onPointerDown

        requestAnimationFrame(this.update.bind(this))
    }

    createElement(pos: Vec2, size: Vec2) {
        const element = new GUIElement(pos, size)
        this.addElement(element)
        return element
    }
    
    addElement(element: GUIElement) {
        this.elements.add(element)
        element.setGUI(this)
        this.node.appendChild(element.node)
    }

    selectElement(element: GUIElement) {
        if (!this.elements.has(element)) return
        if (this.selection && this.selection != element) {
            this.selection.highlight(false)
        }
        this.node.appendChild(element.node)
        this.selection = element
        element.highlight(true)
    }



    onPointerDown = (ev: PointerEvent) => {
        console.log('target:', ev.target )
        console.log('current:', ev.currentTarget )
    }

    update() {
        this.elements.forEach(elem => elem.update())
        requestAnimationFrame(this.update.bind(this))
    }
}