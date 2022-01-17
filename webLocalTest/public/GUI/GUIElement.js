import Vec2, { vec2 } from "../Vector2.js";
import { GUIPointerHandler } from './GUIPointerHandlers.js';
export class GUIElement {
    constructor(pos, size, style) {
        this.currentPos = vec2(0, 0);
        this.currentSize = vec2(0, 0);
        this.node = document.createElement('div');
        style && Object.assign(this.node.style, style);
        this.setPos(pos);
        this.setSize(size);
        this.node.style.zIndex = '2';
        this.node.onpointerdown = ev => { var _a; (_a = this.gui) === null || _a === void 0 ? void 0 : _a.selectElement(this); };
    }
    highlight(enabled) {
        this.node.style.borderColor = enabled ? 'silver' : 'grey';
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
        }
        if (this.newSize) {
            this.node.style.width = this.newSize.x + 'px';
            this.node.style.height = this.newSize.y + 'px';
            this.currentSize.set(this.newSize);
            this.newSize = null;
        }
    }
    setGUI(gui) { this.gui = gui; }
    remove() {
        this.node.remove();
    }
}
export class Movable extends GUIPointerHandler {
    constructor(eventTarget, moveTarget) {
        super(eventTarget);
        this.moveTarget = moveTarget;
        this.userOnDown = () => {
            this.initPos.set(this.moveTarget.currentPos);
            this.node.style.cursor = 'grabbing';
        };
        this.userOnDrag = (offset) => {
            const maxPos = vec2(document.body.clientWidth - this.moveTarget.currentSize.x, document.body.clientHeight - this.moveTarget.currentSize.y);
            const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), maxPos);
            this.moveTarget.setPos(draggedPos);
        };
        this.userOnUp = () => {
            this.node.style.cursor = 'grab';
        };
        moveTarget.node.style.position = 'absolute';
        this.initPos = vec2(moveTarget.currentPos);
        eventTarget.style.cursor = 'grab';
    }
}
export class Resizable extends GUIPointerHandler {
    constructor(eventTarget, resizeTarget) {
        super(eventTarget);
        this.resizeTarget = resizeTarget;
        this.userOnDown = () => {
            this.initSize.set(this.resizeTarget.currentSize);
        };
        this.userOnDrag = (offset) => {
            const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(50, 50), vec2(400, 400));
            this.resizeTarget.setSize(draggedSize);
        };
        this.initSize = vec2(resizeTarget.currentSize);
        eventTarget.style.cursor = 'nwse-resize';
    }
}
export class Clickable extends GUIPointerHandler {
    constructor(eventTarget, action) {
        super(eventTarget);
        this.action = action;
        this.userOnUp = this.action;
        eventTarget.style.cursor = '';
    }
}
