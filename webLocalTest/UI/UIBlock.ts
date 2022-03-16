import Vec2, { vec2 } from "../Vector2.js";
import { MovableElement } from "./MovableElement.js";
import { MoveHandle } from "./UIPointerHandlers.js";

export class UIBlock extends MovableElement
{    
    constructor(pos: Vec2) {
        super(pos, vec2(60, 60))

        this.backgroundColor('gray')
            .setPosSnap(vec2(20))
            .style({
                border: 'solid 1px gray'
            })
        
        MoveHandle(this, this)
    }

    private selected = false

    setSelected(selected: boolean) {
        this.selected = selected
        this.node.style.borderColor = selected ? 'silver' : 'gray'
        this.node.style.zIndex = selected ? '3' : '2'
        return this
    }
}