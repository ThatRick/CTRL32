import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "./MovableElement.js"
import { IElement, NodeElement } from "./NodeElement.js"
import { Div } from "./UIElements.js"

export function MoveHandle(targetElement: MovableElement, elem?: NodeElement, noBubbling = false)
{
    elem = elem ?? Div()

    elem.node.style.cursor = 'grab'

    let initPos = vec2(targetElement.currentPos)
    let maxPos: Vec2

    elem.setPointerHandlers(
    {
        onPointerDown: () => {
            initPos.set(targetElement.currentPos)
            elem.node.style.cursor = 'grabbing'
            const parent = targetElement.node.parentElement
            maxPos = vec2(parent.clientWidth - targetElement.currentSize.x, parent.clientHeight - targetElement.currentSize.y)
        },
        onPointerDrag: (offset: Vec2) => {
            const draggedPos = Vec2.add(initPos, offset).limit(vec2(0, 0), maxPos)
                targetElement.setPos(draggedPos)
        },
        onPointerUp: () => {
            elem.node.style.cursor = 'grab'
            if (targetElement.posSnap) {
                targetElement.setPos(Vec2.snap(targetElement.currentPos, targetElement.posSnap))
            }
        }
    }, noBubbling)

    return elem
}

export function ResizeHandle(targetElement: MovableElement, elem?: NodeElement, minSize = vec2(16, 16), maxSize = vec2(Number.MAX_VALUE, Number.MAX_VALUE))
{
    elem = elem ?? Div()
    elem.node.style.cursor = 'nwse-resize'

    let initSize = vec2(targetElement.currentSize)
    let dynamicMaxSizeLimit: Vec2

    elem.setPointerHandlers({
        onPointerDown: () => {
            initSize.set(targetElement.currentSize)
            const parent = targetElement.node.parentElement
            dynamicMaxSizeLimit = Vec2.min(maxSize, vec2(parent.clientWidth - targetElement.currentPos.x, parent.clientHeight - targetElement.currentPos.y))
        },
        onPointerDrag: (offset: Vec2) => {
            const draggedSize = Vec2.add(initSize, offset).limit(minSize, dynamicMaxSizeLimit)
            targetElement.setSize(draggedSize)
        },
        onPointerUp: () => {
            if (targetElement.sizeSnap) {
                targetElement.setSize(Vec2.snap(targetElement.currentSize, targetElement.sizeSnap))
            }
        }
    })

    return elem
}