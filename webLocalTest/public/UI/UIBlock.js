import { vec2 } from "../Vector2.js";
import { MovableElement } from "./MovableElement.js";
import { MoveHandle } from "./UIPointerHandlers.js";
export class UIBlock extends MovableElement {
    constructor(pos) {
        super(pos, vec2(60, 60));
        this.selected = false;
        this.backgroundColor('gray')
            .setPosSnap(vec2(20))
            .style({
            border: 'solid 1px gray'
        });
        MoveHandle(this, this);
    }
    setSelected(selected) {
        this.selected = selected;
        this.node.style.borderColor = selected ? 'silver' : 'gray';
        this.node.style.zIndex = selected ? '3' : '2';
        return this;
    }
}
