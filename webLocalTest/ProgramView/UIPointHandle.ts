import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "../UI/MovableElement.js"
import { createMoveHandle } from "../UI/UIPointerHandlers.js"

export class UIPointHandle extends MovableElement
{    
    constructor(pos: Vec2, snapSize: Vec2) {
        super(pos, snapSize)

        this.backgroundColor('gray')
            .style({
                opacity: '0.25'
            })
        
        createMoveHandle(this, this, snapSize)
    }

    setVisible(visible: boolean) {
        this.node.style.display = visible ? 'block' : 'none'
        return this
    }
}