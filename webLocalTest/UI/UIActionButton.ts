import { htmlElement } from "../HTML.js"

export class ActionButton
{
    button: HTMLButtonElement
    constructor(parent: HTMLElement, text: string, action: () => void) {
        this.button = htmlElement('button', {
            setup: elem => {
                elem.textContent = text
                elem.type = 'button'
                elem.onclick = action
            },
            parent
        })
    }
}