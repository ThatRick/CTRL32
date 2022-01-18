import { htmlElement } from "../HTML.js"

export class Checkbox
{
    input: HTMLInputElement
    label: HTMLLabelElement
    id: string
    constructor(parent: HTMLElement, text: string, changed: (toggled: boolean) => void) {
        this.id = 'checkbox' + Checkbox.counter++
        this.input = htmlElement('input', {
            setup: elem => {
                elem.type = 'checkbox'
                elem.id = this.id
                elem.onchange = () => { changed(elem.checked) }
            },
            parent
        })
        this.label= htmlElement('label', {
            textContent: text,
            setup: elem => elem.htmlFor = this.id,
            parent
        })
    }

    setState(state: boolean) {
        this.input.checked = state
    }

    get checked() { return this.input.checked }

    static counter = 0
}