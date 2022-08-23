import { MovableElement } from "../UI/MovableElement.js";
import { MoveHandle } from "../UI/UIPointerHandlers.js";
export class UIPointHandle extends MovableElement {
    constructor(pos, snap) {
        super(pos, snap);
        this.backgroundColor('gray')
            .setPosSnap(snap)
            .style({
            opacity: '0.25'
        });
        MoveHandle(this, this);
    }
    setVisible(visible) {
        this.node.style.display = visible ? 'block' : 'none';
        return this;
    }
}
