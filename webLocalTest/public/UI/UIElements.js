import { NodeElement } from "./NodeElement.js";
export { NodeElement };
// DIV
export function Div(...content) {
    return new NodeElement('div').append(...content);
}
// TEXT
export function TextNode(text) {
    return new NodeElement('div').textContent(text);
}
// TEXT SPAN
export function TextSpan(text) {
    return new NodeElement('span').textContent(text);
}
// BUTTON
export function Button(name, onClick) {
    const button = new NodeElement('button').type('button')
        .textContent(name)
        .onClick(onClick);
    return button;
}
// HORIZONTAL CONTAINER
export function HorizontalContainer(...children) {
    return Div(...children)
        .style({
        display: 'flex',
        flexFlow: 'row',
    });
}
// VERTICAL CONTAINER
export function VerticalContainer(...children) {
    return Div(...children)
        .style({
        display: 'flex',
        flexFlow: 'column',
    });
}
// CHECKBOX
export class Checkbox extends NodeElement {
    constructor(labelText, onCheckedChange) {
        super('div');
        this.onCheckedChange = onCheckedChange;
        const id = NodeElement.getUniqueID();
        this.checkbox = new NodeElement('input').type('checkbox').id(id)
            .setupNode(node => node.addEventListener('change', () => onCheckedChange(node.checked)));
        this.label = new NodeElement('label').paddingLeft(2)
            .textContent(labelText)
            .labelFor(id);
        this.append(this.checkbox, this.label)
            .style({
            display: 'flex',
            flexFlow: 'row',
            alignItems: 'center'
        });
    }
    get isChecked() { return this.checkbox.node.checked; }
    setChecked(checked) {
        this.checkbox.node.checked = checked;
        this.onCheckedChange(checked);
        return this;
    }
}
// INPUT
export function Input(type = 'text') {
    return new NodeElement('input').type(type);
}
// TABLE
export function Table(...content) {
    return new NodeElement('table').append(...content)
        .style({
        tableLayout: 'auto',
        borderCollapse: 'collapse',
    });
}
export function TableRow(...content) {
    return new NodeElement('tr').append(...content);
}
export function TableCell(text) {
    return new NodeElement('td').textContent(text);
}
