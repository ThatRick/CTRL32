import Vec2, { vec2 } from "../Vector2.js";
export class GUIPointerHandler {
    constructor(node) {
        this.node = node;
        this.currentPos = vec2(0, 0);
        this.downPos = vec2(0, 0);
        this.isDown = false;
        node.addEventListener('pointerdown', ev => {
            this.isDown = true;
            this.downPos.set(ev.pageX, ev.pageY);
            this.userOnDown?.();
            if (this.userOnDrag) {
                node.setPointerCapture(ev.pointerId);
            }
        });
        node.addEventListener('pointerup', ev => {
            this.isDown = false;
            if (node.hasPointerCapture(ev.pointerId)) {
                node.releasePointerCapture(ev.pointerId);
            }
            this.userOnUp?.();
        });
        node.addEventListener('pointermove', ev => {
            this.currentPos.set(ev.pageX, ev.pageY);
            if (this.isDown && this.userOnDrag) {
                const dragOffset = Vec2.sub(this.currentPos, this.downPos);
                this.userOnDrag?.(dragOffset);
            }
            else
                this.userOnHover?.();
        });
        node.addEventListener('click', ev => {
            this.userOnClick?.();
        });
        node.addEventListener('pointerover', ev => {
            this.userOnOver?.();
        });
        node.addEventListener('pointerout', ev => {
            this.userOnOut?.();
        });
    }
}
export class MoveHandle extends GUIPointerHandler {
    constructor(eventTarget, moveTarget) {
        super(eventTarget);
        this.eventTarget = eventTarget;
        this.moveTarget = moveTarget;
        this.userOnDown = () => {
            //if (this.eventTarget == this.moveTarget.node) this.moveTarget.onMouseDown()
            this.initPos.set(this.moveTarget.currentPos);
            this.node.style.cursor = 'grabbing';
            const parent = this.moveTarget.node.parentElement;
            this.maxPos = vec2(parent.clientWidth - this.moveTarget.currentSize.x, parent.clientHeight - this.moveTarget.currentSize.y);
        };
        this.userOnDrag = (offset) => {
            offset.scale(1 / this.moveTarget.gui.scale);
            const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), this.maxPos);
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
export class ResizeHandle extends GUIPointerHandler {
    constructor(eventTarget, resizeTarget) {
        super(eventTarget);
        this.resizeTarget = resizeTarget;
        this.userOnDown = () => {
            this.initSize.set(this.resizeTarget.currentSize);
            const parent = this.resizeTarget.node.parentElement;
            this.maxSize = vec2(parent.clientWidth - this.resizeTarget.currentPos.x, parent.clientHeight - this.resizeTarget.currentPos.y);
        };
        this.userOnDrag = (offset) => {
            const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(120, 60), this.maxSize);
            this.resizeTarget.setSize(draggedSize);
        };
        this.initSize = vec2(resizeTarget.currentSize);
        eventTarget.style.cursor = 'nwse-resize';
    }
}
export class PanelHorizontalResizeHandle extends GUIPointerHandler {
    constructor(eventTarget, resizeTarget, minWidth, maxWidth) {
        super(eventTarget);
        this.eventTarget = eventTarget;
        this.resizeTarget = resizeTarget;
        this.userOnDown = () => {
            this.initWidth = this.resizeTarget.clientWidth;
        };
        this.userOnDrag = (offset) => {
            let newWidth = (this.initWidth + offset.x);
            if (this.minWidth)
                newWidth = Math.max(this.minWidth, newWidth);
            if (this.maxWidth)
                newWidth = Math.min(this.maxWidth, newWidth);
            if (this.targetWidth == null) {
                requestAnimationFrame(this.resize);
            }
            this.targetWidth = newWidth;
        };
        this.userOnOver = () => {
            this.effectTimer = setTimeout(() => this.eventTarget.style.opacity = '0.2', 100);
        };
        this.userOnOut = () => {
            clearTimeout(this.effectTimer);
            this.eventTarget.style.opacity = '0';
        };
        this.resize = () => {
            if (this.targetWidth) {
                this.resizeTarget.style.width = this.targetWidth + 'px';
                this.targetWidth = null;
            }
        };
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.initWidth = resizeTarget.clientWidth;
        eventTarget.style.cursor = 'ew-resize';
    }
}
