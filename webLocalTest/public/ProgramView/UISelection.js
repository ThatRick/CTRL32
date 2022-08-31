export class UISelection {
    constructor() {
        // Private
        this.elements = new Set();
    }
    set(...elements) {
        this.deselectAll();
        this.add(...elements);
    }
    add(...elements) {
        elements.forEach(this.addElement.bind(this));
    }
    deselect(element) {
        element.highlighted = false;
        this.elements.delete(element);
    }
    toggle(element) {
        this.elements.has(element) ? this.deselect(element) : this.add(element);
    }
    deselectAll() {
        this.elements.forEach(elem => elem.highlighted = false);
        this.elements.clear();
    }
    getSelected(type) {
        const selected = [...this.elements.values()];
        return selected.filter(elem => elem instanceof type);
    }
    addElement(element) {
        element.highlighted = true;
        this.elements.add(element);
    }
}
