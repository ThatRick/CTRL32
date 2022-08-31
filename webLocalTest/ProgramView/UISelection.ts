
import { UIBlock } from "./UIBlock.js"
import { UIPort } from "./UIPort.js"
import { UIConnection } from "./UIConnection.js"
import { UIPointHandle } from "./UIPointHandle.js"

export interface SelectableElement
{
    set highlighted(value: boolean)
}

export class UISelection
{
    public set(...elements: SelectableElement[]) {
        this.deselectAll()
        this.add(...elements)
    }

    public add(...elements: SelectableElement[]) {
        elements.forEach(this.addElement.bind(this))
    }

    public deselect(element: SelectableElement) {
        element.highlighted = false
        this.elements.delete(element)
    }

    public toggle(element: SelectableElement) {
        this.elements.has(element) ? this.deselect(element) : this.add(element)
    }

    public deselectAll() {
        this.elements.forEach(elem => elem.highlighted = false)
        this.elements.clear()
    }

    public getSelected<T>(type: new() => T):  T[] {
        const selected = [...this.elements.values()]
        return selected.filter(elem => elem instanceof type) as unknown[] as T[]
    }
    
    // Private

    private elements = new Set<SelectableElement>()
    
    private addElement(element: SelectableElement) {
        element.highlighted = true
        this.elements.add(element)
    }

}