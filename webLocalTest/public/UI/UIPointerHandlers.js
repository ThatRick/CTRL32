import Vec2, { vec2 } from "../Vector2.js";
import { Div } from "./UIElements.js";
export function createMoveHandle(targetElement, handleElement, snapSize, noBubbling = false) {
    handleElement = handleElement ?? Div();
    handleElement.node.style.cursor = 'grab';
    let initPos = vec2(targetElement.currentPos);
    let maxPos;
    handleElement.setPointerHandlers({
        onPointerDown: () => {
            initPos.set(targetElement.currentPos);
            handleElement.node.style.cursor = 'grabbing';
            const parent = targetElement.node.parentElement;
            maxPos = vec2(parent.clientWidth - targetElement.currentSize.x, parent.clientHeight - targetElement.currentSize.y);
        },
        onPointerDrag: (offset) => {
            const draggedPos = Vec2.add(initPos, offset).limit(vec2(0, 0), maxPos);
            targetElement.setPos(draggedPos);
        },
        onPointerUp: () => {
            handleElement.node.style.cursor = 'grab';
            if (snapSize) {
                targetElement.setPos(Vec2.snap(targetElement.currentPos, snapSize));
            }
        }
    }, noBubbling);
    return handleElement;
}
export function createResizeHandle(targetElement, elem, minSize = vec2(16, 16), maxSize = vec2(Number.MAX_VALUE, Number.MAX_VALUE), snapSize) {
    elem = elem ?? Div();
    elem.node.style.cursor = 'nwse-resize';
    let initSize = vec2(targetElement.currentSize);
    let dynamicMaxSizeLimit;
    elem.setPointerHandlers({
        onPointerDown: () => {
            initSize.set(targetElement.currentSize);
            const parent = targetElement.node.parentElement;
            dynamicMaxSizeLimit = Vec2.min(maxSize, vec2(parent.clientWidth - targetElement.currentPos.x, parent.clientHeight - targetElement.currentPos.y));
        },
        onPointerDrag: (offset) => {
            const draggedSize = Vec2.add(initSize, offset).limit(minSize, dynamicMaxSizeLimit);
            targetElement.setSize(draggedSize);
        },
        onPointerUp: () => {
            if (snapSize) {
                targetElement.setSize(Vec2.snap(targetElement.currentSize, snapSize));
            }
        }
    });
    return elem;
}
