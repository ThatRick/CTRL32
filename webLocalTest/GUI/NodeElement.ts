// NodeElement
export interface IElement {
    node: HTMLElement
}

export class NodeElement<NodeType extends keyof HTMLElementTagNameMap> {
    
    readonly node: HTMLElementTagNameMap[NodeType]
    readonly tagName: string

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

    clear() {
        while (this.node.lastChild) this.node.lastChild.remove()
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

    flexGrow(value = 1) { this.node.style.flexGrow = value.toString();  return this }

    align(value: 'left' | 'right' | 'center') { this.node.style.textAlign = value;  return this }

    private static idCounter = 1

    static getUniqueID() {
        return (this.idCounter++).toString()
    }

}
