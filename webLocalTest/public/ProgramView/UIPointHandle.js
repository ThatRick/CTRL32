import { MovableElement } from "../UI/MovableElement.js";
import { createMoveHandle } from "../UI/UIPointerHandlers.js";
export class UIPointHandle extends MovableElement {
    constructor(pos, snapSize) {
        super(pos, snapSize);
        this.backgroundColor('gray')
            .style({
            opacity: '0.25'
        });
        createMoveHandle(this, this, snapSize);
    }
    setVisible(visible) {
        this.node.style.display = visible ? 'block' : 'none';
        return this;
    }
}
