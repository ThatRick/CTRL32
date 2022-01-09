import { toHex } from './Util.js'
import { htmlElement, HTMLTable } from './HTML.js'

const UI = {
    connectionStatus:   document.getElementById('connectionStatus') as HTMLParagraphElement,
    connectionControls: document.getElementById('connectionControls') as HTMLDivElement,
    consoleControls:    document.getElementById('consoleControls') as HTMLDivElement,
    panel:              document.getElementById('panel') as HTMLDivElement,
    consoleContainer:   document.getElementById('console') as HTMLDivElement,
}

function setStatus(text: string) { UI.connectionStatus.textContent = text }

class Console
{
    constructor(private consoleDiv: HTMLDivElement) {}

    autoScroll = false

    entry(lines: string[]) {
        const pre = document.createElement('pre')
        lines.forEach(line => pre.textContent += line + '\n')
        this.consoleDiv.appendChild(pre)
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

    clear = () => { while (this.consoleDiv.lastChild) this.consoleDiv.lastChild.remove() }

    scrollToEnd() {
        this.consoleDiv.lastElementChild?.scrollIntoView()
    }
}

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

    static counter = 0
}

const enum COLUMN {
    KEY,
    VALUE
}
export class ObjectView
{
    container: HTMLDivElement
    table: HTMLTable
    valueCellMap: Map<string, HTMLTableCellElement> = new Map()
    valueMap: Map<string, number> = new Map()
    constructor(obj: Record<string, number>, caption?: string) {
        this.container = htmlElement('div', {
            style: {
                border: '1px solid',
                padding: '2px'
            },
            parent: UI.panel
        })
        const entries = Object.entries(obj)
        this.table = new HTMLTable({
            rows: entries.length,
            columns: 2,
            parentElement: this.container,
            caption
        })
        this.table.getCell(0, 0).style.width = '2em'
        this.table.getCell(0, 1).style.width = '8em'
        entries.forEach(([key, value], row) => {
            const keyCell = this.table.getCell(row, COLUMN.KEY)
            const valueCell = this.table.getCell(row, COLUMN.VALUE)
            keyCell.textContent = key
            this.valueCellMap.set(key, valueCell)
            this.setValue(key, value)
        })
    }

    updateValues(obj: Record<string, number>) {
        Object.entries(obj).forEach(([key, value]) => this.setValue(key, value))
    }

    setValue(key: string, value: number) {
        const valueCell = this.valueCellMap.get(key)
        if (!valueCell) return
        const currentValue = this.valueMap.get(key)
        if (currentValue != value) {
            valueCell.textContent = (key.endsWith('List') || key.endsWith('Ptr') || key == 'pointer') ? toHex(value)
                                  : (value % 1) ? value.toPrecision(7) : value.toString()
            this.valueMap.set(key, value)
        }
    }
    remove() {
        this.table.delete()
        this.valueCellMap.clear()
        this.valueMap.clear()
    }
}

export function CreateUI() {
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem) console.error(`UI Element '${key}' not found`)
    });

    const log = new Console(UI.consoleContainer)

    const clearButton = new ActionButton(UI.consoleControls, 'Clear', log.clear)

    const autoScrollToggle = new Checkbox(UI.consoleControls, 'auto scroll', toggled => {
        if (toggled) log.scrollToEnd()
        log.autoScroll = toggled
    })

    return {
        setStatus,
        log,
        connectionControls: UI.connectionControls,
        consoleControls:    UI.consoleControls,
    }
}