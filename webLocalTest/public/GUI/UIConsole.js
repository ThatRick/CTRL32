import { htmlElement } from "../HTML.js";
import { toHex } from "../Util.js";
export class Console {
    constructor() {
        this.autoScroll = false;
        this.node = htmlElement('div');
    }
    entry(lines) {
        const pre = document.createElement('pre');
        lines.forEach(line => pre.textContent += line + '\n');
        this.node.appendChild(pre);
        if (this.autoScroll)
            this.scrollToEnd();
    }
    record(data) {
        const lines = [];
        for (let key in data) {
            const text = (key + ': ').padStart(20);
            const value = data[key];
            const valueText = (key.endsWith('Ptr') || key.endsWith('List') || key == 'pointer') ? toHex(value) : value;
            lines.push(text + valueText);
        }
        this.entry(lines);
    }
    list(values) {
        const lines = [];
        values.forEach((value, i) => {
            const indexStr = (i + ': ').padStart(20);
            lines.push(indexStr + toHex(value));
        });
        this.entry(lines);
    }
    line(text) { this.entry([text]); }
    clear() { while (this.node.lastChild)
        this.node.lastChild.remove(); }
    scrollToEnd() {
        this.node.lastElementChild?.scrollIntoView();
    }
}
