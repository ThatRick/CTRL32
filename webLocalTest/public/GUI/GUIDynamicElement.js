import { vec2 } from "../Vector2.js";
import { NodeElement } from "./UIElements.js";
export class GUIDynamicElement extends NodeElement {
    constructor(pos, size, gui) {
        super('div');
        this.currentPos = vec2(0, 0);
        this.currentSize = vec2(0, 0);
        gui.addElement(this);
        this._gui = gui;
        this.setPos(pos);
        this.setSize(size);
        this.node.style.zIndex = '2';
        this.node.addEventListener('pointerdown', () => this._gui.selectElement(this));
    }
    highlight(enabled) {
        this.node.style.borderColor = enabled ? 'silver' : 'gray';
        this.node.style.zIndex = enabled ? '3' : '2';
    }
    setPos(pos) {
        if (!this.newPos)
            this.newPos = vec2(pos);
        else
            this.newPos.set(pos);
    }
    setSize(size) {
        if (!this.newSize)
            this.newSize = vec2(size);
        else
            this.newSize.set(size);
    }
    update() {
        if (this.newPos) {
            this.node.style.left = this.newPos.x + 'px';
            this.node.style.top = this.newPos.y + 'px';
            this.currentPos.set(this.newPos);
            this.newPos = null;
            this.didMove && setTimeout(this.didMove);
        }
        if (this.newSize) {
            this.node.style.width = this.newSize.x + 'px';
            this.node.style.height = this.newSize.y + 'px';
            this.currentSize.set(this.newSize);
            this.newSize = null;
            this.didResize && setTimeout(this.didResize);
        }
    }
    get gui() { return this._gui; }
    remove() {
        this._gui.removeElement(this);
        super.remove();
    }
}
