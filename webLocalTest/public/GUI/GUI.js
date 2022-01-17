import { GUIElement } from "./GUIElement.js";
const containerStyle = {
    position: 'relative',
    margin: '0px',
    padding: '0px',
    userSelect: 'none'
};
export class GUIManager {
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
    update() {
        this.elements.forEach(elem => elem.update());
        requestAnimationFrame(this.update.bind(this));
    }
}
