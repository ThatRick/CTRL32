import { DataTable } from "../DataViewer"

export interface IElement {
    node: HTMLElement
}

// DIV

export function Div(...content: IElement[]) {
    return new UIElement('div').content(...content)
}

// TEXT

export function TextNode(text: string) {
    return new UIElement('div').textContent(text)
}

// TEXT SPAN

export function TextSpan(text: string) {
    return new UIElement('span').textContent(text)
}

//  BUTTON

export function Button(name: string, onClick: () => void) {
    const button = new UIElement('button').type('button')
        .textContent(name)
        .onClick(onClick)

    return button
}

// HORIZONTAL CONTAINER

export function HorizontalContainer(...children: IElement[]) {
    return Div(...children)
        .style({
            display:    'flex',
            flexFlow:   'row',
        })
}

// VERTICAL CONTAINER

export function VerticalContainer(...children: IElement[]) {
    return Div(...children)
        .style({
            display:    'flex',
            flexFlow:   'column',
            height:     '100%'
        })
}

// CHECKBOX
export interface CheckboxHandle {
    checkbox?: HTMLInputElement
    label?: HTMLLabelElement
}
export function Checkbox(label: string, onChange: (checked: boolean) => void, handle?: CheckboxHandle) {
    const id = UIElement.getUniqueID()

    const checkbox = new UIElement('input').type('checkbox').id(id)
        .setupNode(node => node.addEventListener('change', () => onChange(node.checked)))

    const labelNode = new UIElement('label').paddingLeft(2)
        .textContent(label)
        .labelFor(id)

    const container = HorizontalContainer( checkbox, labelNode )
        .style({ alignItems: 'center' })

    if (handle) {
        handle.checkbox = checkbox.node
        handle.label = labelNode.node
    }

    return container
}

// INPUT

export function Input() {
    return new UIElement('input')
}

// TABLE

export function Table(...content: { node: HTMLTableRowElement }[] ) {
    return new UIElement('table').content(...content)
        .style({
            tableLayout: 'auto',
            borderCollapse: 'collapse',
        })
}

export function TableRow(...content: { node: HTMLTableCellElement }[] ) {
    return new UIElement('tr').content(...content)
}

export function TableCell(text: string) {
    return new UIElement('td').textContent(text)
}

// UIElement

export class UIElement<NodeType extends keyof HTMLElementTagNameMap> {
    
    readonly node: HTMLElementTagNameMap[NodeType]
    readonly tagName: string

    constructor(tagName: NodeType) {
        this.tagName = tagName
        this.node = document.createElement(tagName)
    }

    content(...children: IElement[]) {
        children.forEach(child => this.node.appendChild(child.node))
        return this
    }

    contentNodes(...nodes: HTMLElement[]) {
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
