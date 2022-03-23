import Vec2, { vec2 } from "../Vector2.js"

// NodeElement
export interface IElement {
    node: HTMLElement
}

export const enum MouseButton {
    LEFT    = 1,
    RIGHT   = 2,
    MIDDLE  = 4,
    BACK    = 8,
    FORWARD = 16
}

export interface IPointerEvents
{
    onPointerDown?:         (ev: PointerEvent, elem: NodeElement) => void
    onPointerUp?:           (ev: PointerEvent, elem: NodeElement) => void
    onPointerDrag?:         (offset: Vec2, ev: PointerEvent, elem: NodeElement) => void
    onPointerHover?:        (ev: PointerEvent, elem: NodeElement) => void
    onPointerClick?:        (ev: PointerEvent, elem: NodeElement) => void
    onPointerContextMenu?:  (ev: PointerEvent, elem: NodeElement) => void
    onPointerOver?:         (ev: PointerEvent, elem: NodeElement) => void
    onPointerOut?:          (ev: PointerEvent, elem: NodeElement) => void
}

export class NodeElement<NodeType extends keyof HTMLElementTagNameMap = 'div'> {
    
    readonly node: HTMLElementTagNameMap[NodeType]
    readonly tagName: NodeType

    constructor(tagName: NodeType) {
        this.tagName = tagName
        this.node = document.createElement(tagName)
    }

    append(...children: IElement[]) {
        children.forEach(child => this.node.appendChild(child.node))
        return this
    }

    appendNodes(...nodes: HTMLElement[]) {
        nodes.forEach(node => this.node.appendChild(node))
        return this
    }

    textContent(value: string | number) {
        const text = (typeof value == 'number') ? value.toString() : value

        if (text != this.node.textContent) {
            this.node.textContent = text
        }
        return this
    }

    style(cssStyle: Partial<CSSStyleDeclaration>) {
        Object.assign(this.node.style, cssStyle)
        return this
    }

    classList(...tokens: string[]) {
        this.node.classList.add(...tokens)
        return this
    }

    id(id: string) {
        this.node.id = id
        return this
    }

    type(type: string) {
        if (this.tagName == 'input' || this.tagName == 'button') {
            (this.node as HTMLInputElement).type = type
        }
        return this
    }

    labelFor(id: string) {
        if (this.tagName == 'label') {
            (this.node as HTMLLabelElement).htmlFor = id
        }
        return this
    }

    onClick(callback: (ev?: PointerEvent) => void) {
        this.node.style.cursor = 'pointer'
        this.node.addEventListener('click', callback)
        return this
    }

    onChange(callback: (ev?: PointerEvent) => void) {
        this.node.addEventListener('change', callback)
        return this
    }

    setup(callback: (elem: typeof this) => void) {
        callback(this)
        return this
    }

    setupNode(callback: (node: HTMLElementTagNameMap[NodeType]) => void) {
        callback(this.node)
        return this
    }

    remove() {
        this.node.remove()
    }

    color(color: string) {
        this.node.style.color = color
        return this
    }

    backgroundColor(color: string) {
        this.node.style.backgroundColor = color
        return this
    }

    height(value: number) {
        this.node.style.height = value + 'px'
        return this
    }

    width(value: number) {
        this.node.style.width = value + 'px'
        return this
    }

    appendTo(parent: IElement) {
        parent.node.appendChild(this.node)
        return this
    }

    appendToNode(node: HTMLElement) {
        node.appendChild(this.node)
        return this
    }

    clear() {
        while (this.node.lastChild) this.node.lastChild.remove()
        return this
    }

    position(pos: Vec2, mode: 'relative' | 'absolute' | 'fixed' | 'static') {
        this.style({
            position:   mode,
            left:       pos.x + 'px',
            top:        pos.y + 'px'
        })
        return this
    }

    size(size: Vec2) {
        this.style({
            width:      size.x + 'px',
            height:     size.y + 'px'
        })
        return this
    }

    paddingLeft(value: number)   { this.node.style.paddingLeft = value + 'px';    return this }
    paddingRight(value: number)  { this.node.style.paddingRight = value + 'px';   return this }
    paddingTop(value: number)    { this.node.style.paddingTop = value + 'px';     return this }
    paddingBottom(value: number) { this.node.style.paddingBottom = value + 'px';  return this }

    paddingHorizontal(value: number) {
        this.node.style.paddingLeft = value + 'px'
        this.node.style.paddingRight = value + 'px'
        return this
    }

    paddingVertical(value: number) {
        this.node.style.paddingTop = value + 'px'
        this.node.style.paddingBottom = value + 'px'
        return this
    }

    padding(value: number) { this.node.style.padding = value + 'px';  return this }

    flexContainer(direction: 'horizontal' | 'vertical' = 'vertical') {
        this.style({
            display:    'flex',
            flexFlow:   (direction == 'horizontal') ? 'row' : 'column',
        })
        return this
    }

    flexGrow(value = 1) { this.node.style.flexGrow = value.toString();  return this }

    userSelect(mode: 'none' | 'auto' | 'text' | 'contain' |'all') {
        this.style({ userSelect: mode })
        return this
    }

    align(value: 'left' | 'right' | 'center') { this.node.style.textAlign = value;  return this }

    setPointerHandlers(pointerEvents: IPointerEvents) {
        let currentPos = vec2(0, 0)
        let downPos = vec2(0, 0)
        let isDown = false
    
        if (pointerEvents.onPointerDown || pointerEvents.onPointerDrag)
            this.node.addEventListener('pointerdown', ev => {
                isDown = true
                downPos.set(ev.pageX, ev.pageY)
                pointerEvents.onPointerDown?.(ev, this as NodeElement)
                if (pointerEvents.onPointerDown) {
                    this.node.setPointerCapture(ev.pointerId)
                }
            })

        if (pointerEvents.onPointerUp || pointerEvents.onPointerDrag)
            this.node.addEventListener('pointerup', ev => {
                isDown = false
                if (this.node.hasPointerCapture(ev.pointerId)) {
                    this.node.releasePointerCapture(ev.pointerId)
                }
                pointerEvents.onPointerUp?.(ev, this as NodeElement)
            })

        if (pointerEvents.onPointerDrag || pointerEvents.onPointerHover)
            this.node.addEventListener('pointermove', ev => {
                currentPos.set(ev.pageX, ev.pageY)
                if (isDown && pointerEvents.onPointerDrag) {
                    const dragOffset = Vec2.sub(currentPos, downPos)
                    pointerEvents.onPointerDrag?.(dragOffset, ev, this as NodeElement)
                }
                else pointerEvents.onPointerHover?.(ev, this as NodeElement)
            })

        if (pointerEvents.onPointerClick) this.node.addEventListener('click', ev => {
                pointerEvents.onPointerClick?.(ev, this as NodeElement)
            })
        if (pointerEvents.onPointerContextMenu) this.node.addEventListener('contextmenu', ev => {
                pointerEvents.onPointerContextMenu?.(ev, this as NodeElement)
            })
        if (pointerEvents.onPointerClick) this.node.addEventListener('click', ev => {
                pointerEvents.onPointerClick?.(ev, this as NodeElement)
            })

        if (pointerEvents.onPointerOver) this.node.addEventListener('pointerover', ev => {
                pointerEvents.onPointerOver?.(ev, this as NodeElement)
            })

        if (pointerEvents.onPointerOut) this.node.addEventListener('pointerout', ev => {
                pointerEvents.onPointerOut?.(ev, this as NodeElement)
            })
        return this
    }

    private static idCounter = 1

    static getUniqueID() {
        return (this.idCounter++).toString()
    }

}
