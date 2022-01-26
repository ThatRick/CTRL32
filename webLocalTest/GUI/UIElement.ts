
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

export function Checkbox(label: string, onChange: (checked: boolean) => void, labelOnLeft = false) {
    const id = UIElement.getUniqueID()

    const checkbox = new UIElement('input')
        .type('checkbox')
        .id(id)
        .setupNode(node => node.addEventListener('change', () => onChange(node.checked)))

    const labelNode = new UIElement('label')
        .textContent(label)
        .labelFor(id)

    const container = new UIElement('div')
        .content(...(labelOnLeft ? [labelNode, checkbox] : [checkbox, labelNode]))

    return container
}

// INPUT

export function Input() {
    return new UIElement('input')
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

    textContent(text: string) {
        this.node.textContent = text
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

    height(height: string) {
        this.node.style.height = height
        return this
    }

    appendTo(parent: IElement) {
        parent.node.appendChild(this.node)
        return this
    }

    private static idCounter = 1

    static getUniqueID() {
        return (this.idCounter++).toString()
    }

}
