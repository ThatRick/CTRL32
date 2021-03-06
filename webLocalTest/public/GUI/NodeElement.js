export class NodeElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.node = document.createElement(tagName);
    }
    append(...children) {
        children.forEach(child => this.node.appendChild(child.node));
        return this;
    }
    appendNodes(...nodes) {
        nodes.forEach(node => this.node.appendChild(node));
        return this;
    }
    textContent(value) {
        const text = (typeof value == 'number') ? value.toString() : value;
        if (text != this.node.textContent) {
            this.node.textContent = text;
        }
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
        this.node.style.cursor = 'pointer';
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
    height(value) {
        this.node.style.height = value + 'px';
        return this;
    }
    width(value) {
        this.node.style.width = value + 'px';
        return this;
    }
    appendTo(parent) {
        parent.node.appendChild(this.node);
        return this;
    }
    clear() {
        while (this.node.lastChild)
            this.node.lastChild.remove();
        return this;
    }
    paddingLeft(value) { this.node.style.paddingLeft = value + 'px'; return this; }
    paddingRight(value) { this.node.style.paddingRight = value + 'px'; return this; }
    paddingTop(value) { this.node.style.paddingTop = value + 'px'; return this; }
    paddingBottom(value) { this.node.style.paddingBottom = value + 'px'; return this; }
    paddingHorizontal(value) {
        this.node.style.paddingLeft = value + 'px';
        this.node.style.paddingRight = value + 'px';
        return this;
    }
    paddingVertical(value) {
        this.node.style.paddingTop = value + 'px';
        this.node.style.paddingBottom = value + 'px';
        return this;
    }
    padding(value) { this.node.style.padding = value + 'px'; return this; }
    flexGrow(value = 1) { this.node.style.flexGrow = value.toString(); return this; }
    align(value) { this.node.style.textAlign = value; return this; }
    static getUniqueID() {
        return (this.idCounter++).toString();
    }
}
NodeElement.idCounter = 1;
