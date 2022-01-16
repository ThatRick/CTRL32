import Vec2, { vec2 } from "./Vector2.js";
import { htmlElement } from './HTML.js';
const containerStyle = {
    position: 'relative',
    margin: '0px',
    padding: '0px',
    userSelect: 'none'
};
const windowStyle = {
    backgroundColor: 'grey',
    userSelect: 'none',
    border: 'solid black 1px',
    display: 'flex',
    flexDirection: 'column'
};
class GUIPointerHandler {
    constructor(node) {
        this.node = node;
        this.currentPos = vec2(0, 0);
        this.downPos = vec2(0, 0);
        this.isDown = false;
        node.onpointerdown = ev => {
            var _a;
            this.isDown = true;
            this.downPos.set(ev.pageX, ev.pageY);
            (_a = this.userOnDown) === null || _a === void 0 ? void 0 : _a.call(this);
        };
        node.onpointerup = ev => {
            var _a;
            this.isDown = false;
            if (node.hasPointerCapture(ev.pointerId))
                node.releasePointerCapture(ev.pointerId);
            (_a = this.userOnUp) === null || _a === void 0 ? void 0 : _a.call(this);
        };
        node.onpointermove = ev => {
            var _a, _b;
            this.currentPos.set(ev.pageX, ev.pageY);
            if (this.isDown && this.userOnDrag) {
                if (!node.hasPointerCapture(ev.pointerId)) {
                    node.setPointerCapture(ev.pointerId);
                }
                const dragOffset = Vec2.sub(this.currentPos, this.downPos);
                (_a = this.userOnDrag) === null || _a === void 0 ? void 0 : _a.call(this, dragOffset);
            }
            else
                (_b = this.userOnHover) === null || _b === void 0 ? void 0 : _b.call(this);
        };
    }
}
class Movable extends GUIPointerHandler {
    constructor(eventTarget, moveTarget) {
        super(eventTarget);
        this.moveTarget = moveTarget;
        this.userOnDown = () => {
            this.initPos.set(this.moveTarget.currentPos);
            this.node.style.cursor = 'grabbing';
        };
        this.userOnDrag = (offset) => {
            const maxPos = vec2(document.body.clientWidth - this.moveTarget.currentSize.x, document.body.clientHeight - this.moveTarget.currentSize.y);
            const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), maxPos);
            this.moveTarget.setPos(draggedPos);
        };
        this.userOnUp = () => {
            this.node.style.cursor = 'grab';
        };
        moveTarget.node.style.position = 'absolute';
        this.initPos = vec2(moveTarget.currentPos);
        eventTarget.style.cursor = 'grab';
    }
}
class Resizable extends GUIPointerHandler {
    constructor(eventTarget, resizeTarget) {
        super(eventTarget);
        this.resizeTarget = resizeTarget;
        this.userOnDown = () => {
            this.initSize.set(this.resizeTarget.currentSize);
        };
        this.userOnDrag = (offset) => {
            const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(50, 50), vec2(400, 400));
            this.resizeTarget.setSize(draggedSize);
        };
        this.initSize = vec2(resizeTarget.currentSize);
        eventTarget.style.cursor = 'nwse-resize';
    }
}
class Clickable extends GUIPointerHandler {
    constructor(eventTarget, action) {
        super(eventTarget);
        this.action = action;
        this.userOnUp = this.action;
        eventTarget.style.cursor = '';
    }
}
export class GUIElement {
    constructor(pos, size, style) {
        this.currentPos = vec2(0, 0);
        this.currentSize = vec2(0, 0);
        this.node = document.createElement('div');
        style && Object.assign(this.node.style, style);
        this.setPos(pos);
        this.setSize(size);
        this.node.style.zIndex = '2';
        this.node.onpointerdown = ev => { var _a; (_a = this.gui) === null || _a === void 0 ? void 0 : _a.selectElement(this); };
    }
    highlight(enabled) {
        this.node.style.borderColor = enabled ? 'silver' : 'grey';
        this.node.style.zIndex = enabled ? '3' : '2';
    }
    setPos(pos) {
        if (!this.newPos)
            this.newPos = vec2(pos);
        else
            this.newPos.set(pos);
    }
    setSize(size) {
        if (!this.newSize)
            this.newSize = vec2(size);
        else
            this.newSize.set(size);
    }
    update() {
        if (this.newPos) {
            this.node.style.left = this.newPos.x + 'px';
            this.node.style.top = this.newPos.y + 'px';
            this.currentPos.set(this.newPos);
            this.newPos = null;
        }
        if (this.newSize) {
            this.node.style.width = this.newSize.x + 'px';
            this.node.style.height = this.newSize.y + 'px';
            this.currentSize.set(this.newSize);
            this.newSize = null;
        }
    }
    setGUI(gui) { this.gui = gui; }
    remove() {
        this.node.remove();
    }
}
export class GUIWindow extends GUIElement {
    constructor(pos, size) {
        super(pos, size, windowStyle);
        this.topBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
            },
            parent: this.node
        });
        this.title = htmlElement('div', {
            textContent: 'A Fancy window',
            style: { width: '100%' },
            parent: this.topBar
        });
        new Movable(this.title, this);
        this.maximizeBtn = htmlElement('button', {
            style: {
                padding: '0px 3px'
            },
            textContent: '◰',
            setup: elem => {
                elem.type = 'button';
            },
            parent: this.topBar
        });
        new Clickable(this.maximizeBtn, () => { this.resizeToContent(); });
        this.closeBtn = htmlElement('button', {
            style: {
                backgroundColor: 'FireBrick',
                padding: '0px 3px'
            },
            textContent: '✕',
            setup: elem => {
                elem.type = 'button';
            },
            parent: this.topBar
        });
        new Clickable(this.closeBtn, () => { this.remove(); });
        this.userContent = htmlElement('div', {
            style: {
                backgroundColor: 'darkslategray',
                color: 'lemonchiffon',
                flexGrow: '1',
                margin: '0px',
                overflowX: 'hidden',
                overflowY: 'auto',
            },
            parent: this.node
        });
        this.bottomBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between'
            },
            parent: this.node
        });
        this.status = htmlElement('div', {
            textContent: 'status text',
            style: { width: '100%' },
            parent: this.bottomBar
        });
        this.resizeSymbol = htmlElement('div', {
            textContent: '⋰',
            style: {
                padding: '0px 2px'
            },
            parent: this.bottomBar
        });
        new Resizable(this.resizeSymbol, this);
        this.node.appendChild(this.bottomBar);
    }
    resizeToContent() {
        const contentSize = vec2(this.userContent.scrollWidth, this.userContent.scrollHeight);
        const visibleSize = vec2(this.userContent.clientWidth, this.userContent.clientHeight);
        console.log('contentSize', contentSize);
        console.log('visible', visibleSize);
        const hiddenSize = Vec2.sub(contentSize, visibleSize);
        const newSize = Vec2.add(this.currentSize, hiddenSize);
        this.setSize(newSize);
    }
}
export class GUI {
    constructor(parent) {
        this.elements = new Set();
        this.onPointerDown = (ev) => {
            console.log('target:', ev.target);
            console.log('current:', ev.currentTarget);
        };
        this.node = (parent !== null && parent !== void 0 ? parent : document.createElement('div'));
        document.body.appendChild(this.node);
        document.body.style.userSelect = 'none';
        Object.assign(this.node, containerStyle);
        this.node.onpointerdown = this.onPointerDown;
        this.createTestSet();
        requestAnimationFrame(this.update.bind(this));
    }
    createElement(pos, size) {
        const element = new GUIElement(pos, size);
        this.addElement(element);
        return element;
    }
    addElement(element) {
        this.elements.add(element);
        element.setGUI(this);
        this.node.appendChild(element.node);
    }
    selectElement(element) {
        if (!this.elements.has(element))
            return;
        if (this.selection && this.selection != element) {
            this.selection.highlight(false);
        }
        this.node.appendChild(element.node);
        this.selection = element;
        element.highlight(true);
    }
    createTestSet() {
        const size = vec2(200, 100);
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (window.innerWidth - size.x);
            const y = Math.random() * (window.innerHeight - size.y);
            const element = new GUIWindow(vec2(i * size.x / 2, 100 + i * size.y / 2), size);
            const textArea = htmlElement('textarea', {
                textContent: 'abcdefghijklmnopqrstuvwxyzåäö',
                style: {
                    backgroundColor: 'Cornsilk',
                    width: '100%', height: '100%'
                },
                parent: element.userContent
            });
            this.addElement(element);
        }
    }
    update() {
        this.elements.forEach(elem => elem.update());
        requestAnimationFrame(this.update.bind(this));
    }
}
