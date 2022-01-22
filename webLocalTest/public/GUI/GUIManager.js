import { GUIElement } from "./GUIElement.js";
import { htmlElement } from "../HTML.js";
export class GUIManager {
    constructor(parent, style = {}) {
        this.elements = new Set();
        this._scale = 1;
        this.onPointerDown = (ev) => {
            if (ev.target == this.node)
                this.deselect();
            // ev.stopPropagation()
        };
        this.node = htmlElement('div', {
            style: {
                position: 'relative',
                margin: '0px',
                padding: '0px',
                boxSizing: 'border-box',
                transformOrigin: 'top left',
                ...style
            },
            parent
        });
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
    deselect() {
        if (!this.selection)
            return;
        this.selection.highlight(false);
        this.node.appendChild(this.selection.node);
        this.selection = null;
    }
    selectElement(element) {
        if (!this.elements.has(element))
            return;
        if (this.selection && this.selection != element) {
            this.deselect();
        }
        this.selection = element;
        element.highlight(true);
    }
    removeElement(element) {
        if (this.selection == element)
            this.selection = null;
        this.elements.delete(element);
    }
    update() {
        this.elements.forEach(elem => elem.update());
        requestAnimationFrame(this.update.bind(this));
    }
    setScale(scale) {
        this._scale = scale;
        this.node.style.transform = `scale(${scale})`;
    }
    get scale() { return this._scale; }
}
