import Vec2, {vec2} from "../Vector2.js"
import { GUIDynamicElement } from "./GUIDynamicElement.js"


export class GUIPointerHandler
{
    currentPos = vec2(0, 0)
    downPos = vec2(0, 0)
    isDown = false

    constructor(protected node: HTMLElement)
    {
        node.addEventListener('pointerdown', ev => {
            this.isDown = true
            this.downPos.set(ev.pageX, ev.pageY)
            this.userOnDown?.()
        })

        node.addEventListener('pointerup', ev => {
            this.isDown = false
            if (node.hasPointerCapture(ev.pointerId)) {
                node.releasePointerCapture(ev.pointerId)
            }
            this.userOnUp?.()
        })

        node.addEventListener('pointermove', ev => {
            this.currentPos.set(ev.pageX, ev.pageY)
            if (this.isDown && this.userOnDrag) {
                if (!node.hasPointerCapture(ev.pointerId)) {
                    node.setPointerCapture(ev.pointerId)
                }
                const dragOffset = Vec2.sub(this.currentPos, this.downPos)
                this.userOnDrag?.(dragOffset)
            }
            else this.userOnHover?.()
        })

        node.addEventListener('click', ev => {
            this.userOnClick?.()
        })
    }

    userOnDown: () => void
    userOnUp: () => void
    userOnDrag: (offset: Vec2) => void
    userOnHover: () => void
    userOnClick: () => void
}

export class MoveHandle extends GUIPointerHandler {
    initPos: Vec2
    maxPos: Vec2

    constructor(protected eventTarget: HTMLElement, protected moveTarget: GUIDynamicElement) {
        super(eventTarget)
        moveTarget.node.style.position = 'absolute'
        this.initPos = vec2(moveTarget.currentPos)
        eventTarget.style.cursor = 'grab'
    }
    userOnDown = () => {
        //if (this.eventTarget == this.moveTarget.node) this.moveTarget.onMouseDown()
        this.initPos.set(this.moveTarget.currentPos)
        this.node.style.cursor = 'grabbing'
        const parent = this.moveTarget.node.parentElement
        this.maxPos = vec2(parent.clientWidth - this.moveTarget.currentSize.x, parent.clientHeight - this.moveTarget.currentSize.y)
    }
    userOnDrag = (offset: Vec2) => {
        offset.scale( 1/this.moveTarget.gui.scale )
        const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), this.maxPos)
            this.moveTarget.setPos(draggedPos)
        }
    userOnUp = () => {
        this.node.style.cursor = 'grab'
    }
}


export class ResizeHandle extends GUIPointerHandler {
    initSize: Vec2
    maxSize: Vec2
    
    constructor(eventTarget: HTMLElement, protected resizeTarget: GUIDynamicElement) {
        super(eventTarget)
        this.initSize = vec2(resizeTarget.currentSize)
        eventTarget.style.cursor = 'nwse-resize'
    }
    userOnDown = () => {
        this.initSize.set(this.resizeTarget.currentSize)
        const parent = this.resizeTarget.node.parentElement
        this.maxSize = vec2(parent.clientWidth - this.resizeTarget.currentPos.x, parent.clientHeight - this.resizeTarget.currentPos.y)
    }
    userOnDrag = (offset: Vec2) => {
        const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(120, 60), this.maxSize)
        this.resizeTarget.setSize(draggedSize)
    }
}


