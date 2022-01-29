
import { NodeElement, IElement } from "./NodeElement.js"

export { NodeElement, IElement }

// DIV

export function Div(...content: IElement[]) {
    return new NodeElement('div').append(...content)
}

// TEXT

export function TextNode(text: string) {
    return new NodeElement('div').textContent(text)
}

// TEXT SPAN

export function TextSpan(text: string) {
    return new NodeElement('span').textContent(text)
}

//  BUTTON

export function Button(name: string, onClick: () => void) {
    const button = new NodeElement('button').type('button')
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
        })
}

// CHECKBOX

export class Checkbox extends NodeElement<'div'> {
    
    checkbox:   NodeElement<'input'>
    label:      NodeElement<'label'>

    constructor (labelText: string, private onCheckedChange: (checked: boolean) => void) {
        super('div')
        const id = NodeElement.getUniqueID()

        const checkbox = new NodeElement('input').type('checkbox').id(id)
            .setupNode(node => node.addEventListener('change', () => onCheckedChange(node.checked)))
    
        const label = new NodeElement('label').paddingLeft(2)
            .textContent(labelText)
            .labelFor(id)
    
        this.append( checkbox, label )
            .style({ alignItems: 'center' })
    }

    get isChecked() { return this.checkbox.node.checked }

    setChecked(checked: boolean) {
        this.checkbox.node.checked = checked
        this.onCheckedChange(checked)
        return this
    }
}

// INPUT

export function Input() {
    return new NodeElement('input')
}

// TABLE

export function Table(...content: { node: HTMLTableRowElement }[] ) {
    return new NodeElement('table').append(...content)
        .style({
            tableLayout: 'auto',
            borderCollapse: 'collapse',
        })
}

export function TableRow(...content: { node: HTMLTableCellElement }[] ) {
    return new NodeElement('tr').append(...content)
}

export function TableCell(text: string) {
    return new NodeElement('td').textContent(text)
}

