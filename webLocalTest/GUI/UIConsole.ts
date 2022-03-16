import { htmlElement } from "../HTML.js"
import { toHex } from "../Util.js"

export class Console
{
    node: HTMLDivElement
    constructor() {
        this.node = htmlElement('div')
    }

    autoScroll = false

    entry(lines: string[]) {
        const pre = document.createElement('pre')
        lines.forEach(line => pre.textContent += line + '\n')
        this.node.appendChild(pre)
        if (this.autoScroll) this.scrollToEnd()
    }
    record(data: {[key: string]: number}) {
        const lines: string[] = []
        for (let key in data) {
            const text = (key + ': ').padStart(20)
            const value = data[key]
            const valueText = (key.endsWith('Ptr') || key.endsWith('List') || key == 'pointer') ? toHex(value) : value
            lines.push(text + valueText)
        }
        this.entry(lines)
    }
    list(values: number[]) {
        const lines: string[] = []
        values.forEach((value, i) => {
            const indexStr = (i + ': ').padStart(20)
            lines.push(indexStr + toHex(value))
        })
        this.entry(lines)
    }
    line(text: string) { this.entry([text]) }

    clear = () => { while (this.node.lastChild) this.node.lastChild.remove() }

    scrollToEnd() {
        this.node.lastElementChild?.scrollIntoView()
    }
}