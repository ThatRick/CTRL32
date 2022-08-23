import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "../UI/MovableElement.js"
import { MoveHandle } from "../UI/UIPointerHandlers.js"

export class UIPointHandle extends MovableElement
{    
    constructor(pos: Vec2, snap: Vec2) {
        super(pos, snap)

        this.backgroundColor('gray')
            .setPosSnap(snap)
            .style({
                opacity: '0.25'
            })
        
        MoveHandle(this, this)
    }

    setVisible(visible: boolean) {
        this.node.style.display = visible ? 'block' : 'none'
        return this
    }
}