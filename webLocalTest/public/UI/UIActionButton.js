import { htmlElement } from "../HTML.js";
export class ActionButton {
    constructor(parent, text, action) {
        this.button = htmlElement('button', {
            setup: elem => {
                elem.textContent = text;
                elem.type = 'button';
                elem.onclick = action;
            },
            parent
        });
    }
}
