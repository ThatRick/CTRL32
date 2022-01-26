// DIV
export function Div(...content) {
    return new UIElement('div').content(...content);
}
// TEXT
export function TextNode(text) {
    return new UIElement('div').textContent(text);
}
//  BUTTON
export function Button(name, onClick) {
    const button = new UIElement('button').type('button')
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
        height: '100%'
    });
}
// CHECKBOX
export function Checkbox(label, onChange, labelOnLeft = false) {
    const id = UIElement.getUniqueID();
    const checkbox = new UIElement('input')
        .type('checkbox')
        .id(id)
        .setupNode(node => node.addEventListener('change', () => onChange(node.checked)));
    const labelNode = new UIElement('label')
        .textContent(label)
        .labelFor(id);
    const container = new UIElement('div')
        .content(...(labelOnLeft ? [labelNode, checkbox] : [checkbox, labelNode]));
    return container;
}
// INPUT
export function Input() {
    return new UIElement('input');
}
// UIElement
export class UIElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.node = document.createElement(tagName);
    }
    content(...children) {
        children.forEach(child => this.node.appendChild(child.node));
        return this;
    }
    contentNodes(...nodes) {
        nodes.forEach(node => this.node.appendChild(node));
        return this;
    }
    textContent(text) {
        this.node.textContent = text;
        return this;
    }
    style(cssStyle) {
        Object.assign(this.node.style, cssStyle);
        return this;
    }
    classList(...tokens) {
        this.node.classList.add(...tokens);
        return this;
    }
    id(id) {
        this.node.id = id;
        return this;
    }
    type(type) {
        if (this.tagName == 'input' || this.tagName == 'button') {
            this.node.type = type;
        }
        return this;
    }
    labelFor(id) {
        if (this.tagName == 'label') {
            this.node.htmlFor = id;
        }
        return this;
    }
    onClick(callback) {
        this.node.addEventListener('click', callback);
        return this;
    }
    onChange(callback) {
        this.node.addEventListener('change', callback);
        return this;
    }
    setup(callback) {
        callback(this);
        return this;
    }
    setupNode(callback) {
        callback(this.node);
        return this;
    }
    remove() {
        this.node.remove();
    }
    color(color) {
        this.node.style.color = color;
        return this;
    }
    backgroundColor(color) {
        this.node.style.backgroundColor = color;
        return this;
    }
    height(height) {
        this.node.style.height = height;
        return this;
    }
    appendTo(parent) {
        parent.node.appendChild(this.node);
        return this;
    }
    static getUniqueID() {
        return (this.idCounter++).toString();
    }
}
UIElement.idCounter = 1;
