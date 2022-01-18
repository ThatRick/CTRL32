import Vec2, {vec2} from "../Vector2.js"

export class GUIPointerHandler {
    currentPos = vec2(0, 0)
    downPos = vec2(0, 0)
    isDown = false

    constructor(protected node: HTMLElement) {
        node.onpointerdown = ev => {
            this.isDown = true
            this.downPos.set(ev.pageX, ev.pageY)
            this.userOnDown?.()
        }
        node.onpointerup = ev => {
            this.isDown = false
            if (node.hasPointerCapture(ev.pointerId)) {
                node.releasePointerCapture(ev.pointerId)
            }
            this.userOnUp?.()
        }
        node.onpointermove = ev => {
            this.currentPos.set(ev.pageX, ev.pageY)
            if (this.isDown && this.userOnDrag) {
                if (!node.hasPointerCapture(ev.pointerId)) {
                    node.setPointerCapture(ev.pointerId)
                }
                const dragOffset = Vec2.sub(this.currentPos, this.downPos)
                this.userOnDrag?.(dragOffset)
            }
            else this.userOnHover?.()
        }
        node.onclick = ev => {
            this.userOnClick?.()
        }
    }
    userOnDown: () => void
    userOnUp: () => void
    userOnDrag: (offset: Vec2) => void
    userOnHover: () => void
    userOnClick: () => void
}


