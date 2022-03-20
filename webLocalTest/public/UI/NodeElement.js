import Vec2, { vec2 } from "../Vector2.js";
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
    appendToNode(node) {
        node.appendChild(this.node);
        return this;
    }
    clear() {
        while (this.node.lastChild)
            this.node.lastChild.remove();
        return this;
    }
    position(pos, mode) {
        this.style({
            position: mode,
            left: pos.x + 'px',
            top: pos.y + 'px'
        });
        return this;
    }
    size(size) {
        this.style({
            width: size.x + 'px',
            height: size.y + 'px'
        });
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
    flexContainer(direction = 'vertical') {
        this.style({
            display: 'flex',
            flexFlow: (direction == 'horizontal') ? 'row' : 'column',
        });
        return this;
    }
    flexGrow(value = 1) { this.node.style.flexGrow = value.toString(); return this; }
    userSelect(mode) {
        this.style({ userSelect: mode });
        return this;
    }
    align(value) { this.node.style.textAlign = value; return this; }
    setPointerHandlers(pointerEvents) {
        let currentPos = vec2(0, 0);
        let downPos = vec2(0, 0);
        let isDown = false;
        if (pointerEvents.onPointerDown || pointerEvents.onPointerDrag)
            this.node.addEventListener('pointerdown', ev => {
                isDown = true;
                downPos.set(ev.pageX, ev.pageY);
                pointerEvents.onPointerDown?.(ev, this);
                if (pointerEvents.onPointerDown) {
                    this.node.setPointerCapture(ev.pointerId);
                }
            });
        if (pointerEvents.onPointerUp || pointerEvents.onPointerDrag)
            this.node.addEventListener('pointerup', ev => {
                isDown = false;
                if (this.node.hasPointerCapture(ev.pointerId)) {
                    this.node.releasePointerCapture(ev.pointerId);
                }
                pointerEvents.onPointerUp?.(ev, this);
            });
        if (pointerEvents.onPointerDrag || pointerEvents.onPointerHover)
            this.node.addEventListener('pointermove', ev => {
                currentPos.set(ev.pageX, ev.pageY);
                if (isDown && pointerEvents.onPointerDrag) {
                    const dragOffset = Vec2.sub(currentPos, downPos);
                    pointerEvents.onPointerDrag?.(dragOffset, ev, this);
                }
                else
                    pointerEvents.onPointerHover?.(ev, this);
            });
        if (pointerEvents.onPointerClick)
            this.node.addEventListener('click', ev => {
                pointerEvents.onPointerClick?.(ev, this);
            });
        if (pointerEvents.onPointerContextMenu)
            this.node.addEventListener('contextmenu', ev => {
                pointerEvents.onPointerContextMenu?.(ev, this);
            });
        if (pointerEvents.onPointerClick)
            this.node.addEventListener('click', ev => {
                pointerEvents.onPointerClick?.(ev, this);
            });
        if (pointerEvents.onPointerOver)
            this.node.addEventListener('pointerover', ev => {
                pointerEvents.onPointerOver?.(ev, this);
            });
        if (pointerEvents.onPointerOut)
            this.node.addEventListener('pointerout', ev => {
                pointerEvents.onPointerOut?.(ev, this);
            });
        return this;
    }
    static getUniqueID() {
        return (this.idCounter++).toString();
    }
}
NodeElement.idCounter = 1;
