import Vec2, { vec2 } from "../Vector2.js";
export class GUIPointerHandler {
    constructor(node) {
        this.node = node;
        this.currentPos = vec2(0, 0);
        this.downPos = vec2(0, 0);
        this.isDown = false;
        node.onpointerdown = ev => {
            var _a;
            this.isDown = true;
            this.downPos.set(ev.pageX, ev.pageY);
            (_a = this.userOnDown) === null || _a === void 0 ? void 0 : _a.call(this);
        };
        node.onpointerup = ev => {
            var _a;
            this.isDown = false;
            if (node.hasPointerCapture(ev.pointerId))
                node.releasePointerCapture(ev.pointerId);
            (_a = this.userOnUp) === null || _a === void 0 ? void 0 : _a.call(this);
        };
        node.onpointermove = ev => {
            var _a, _b;
            this.currentPos.set(ev.pageX, ev.pageY);
            if (this.isDown && this.userOnDrag) {
                if (!node.hasPointerCapture(ev.pointerId)) {
                    node.setPointerCapture(ev.pointerId);
                }
                const dragOffset = Vec2.sub(this.currentPos, this.downPos);
                (_a = this.userOnDrag) === null || _a === void 0 ? void 0 : _a.call(this, dragOffset);
            }
            else
                (_b = this.userOnHover) === null || _b === void 0 ? void 0 : _b.call(this);
        };
    }
}
