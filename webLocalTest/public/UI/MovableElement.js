import { vec2 } from "../Vector2.js";
import { NodeElement } from "./UIElements.js";
import { EventEmitter } from "../Events.js";
export class MovableElement extends NodeElement {
    constructor(pos, size) {
        super('div');
        this.currentPos = vec2(0, 0);
        this.currentSize = vec2(0, 0);
        this.animationRequest = 0;
        this.events = new EventEmitter(this);
        this.setNodePos(pos);
        this.setNodeSize(size);
        this.node.style.zIndex = '2';
        this.node.style.position = 'absolute';
        this.node.addEventListener('pointerdown', ev => this.events.emit('clicked', ev));
    }
    setPos(pos) {
        if (!this.newPos)
            this.newPos = vec2(pos);
        else
            this.newPos.set(pos);
        this.requestUpdate();
        return this;
    }
    setSize(size) {
        if (!this.newSize)
            this.newSize = vec2(size);
        else
            this.newSize.set(size);
        this.requestUpdate();
        return this;
    }
    update() {
        if (this.newPos) {
            this.setNodePos(this.newPos);
            this.newPos = null;
            this.events.emit('moved');
        }
        if (this.newSize) {
            this.setNodeSize(this.newSize);
            this.newSize = null;
            this.events.emit('resized');
        }
        this.animationRequest = 0;
    }
    setPosSnap(snap) {
        this.posSnap = snap;
        return this;
    }
    setSizeSnap(snap) {
        this.sizeSnap = snap;
        return this;
    }
    remove() {
        this.events.emit('removed');
        this.events.clear();
        super.remove();
    }
    requestUpdate() {
        if (!this.animationRequest)
            this.animationRequest = requestAnimationFrame(this.update.bind(this));
    }
    setNodePos(pos) {
        this.node.style.left = pos.x + 'px';
        this.node.style.top = pos.y + 'px';
        this.currentPos.set(pos);
    }
    setNodeSize(size) {
        this.node.style.width = size.x + 'px';
        this.node.style.height = size.y + 'px';
        this.currentSize.set(size);
    }
}
