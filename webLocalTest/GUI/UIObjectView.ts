import { htmlElement, HTMLTable } from "../HTML.js"
import { toHex } from "../Util.js"


const enum COLUMN {
    KEY,
    VALUE
}

export class ObjectView
{
    get node() { return this.table.node }
    readonly table: HTMLTable
    protected valueCellMap: Map<string, HTMLTableCellElement> = new Map()
    protected valueMap: Map<string, number> = new Map()

    constructor(obj: Record<string, number>, style: Partial<CSSStyleDeclaration> = { padding: '3px' }) {
        const entries = Object.entries(obj)
        this.table = new HTMLTable({
            rows: entries.length,
            columns: 2,
            tableStyle: style
        })
        //this.table.getCell(0, 0).style.width = '2em'
        //this.table.getCell(0, 1).style.width = '8em'
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

    protected setValue(key: string, value: number) {
        const valueCell = this.valueCellMap.get(key)
        if (!valueCell) return
        const currentValue = this.valueMap.get(key)
        if (currentValue != value) {
            valueCell.textContent = (key.endsWith('List') || key.endsWith('Ptr') || key == 'pointer') ? toHex(value)
                                  : (value % 1) ? value.toPrecision(7)
                                  : value.toString()
            this.valueMap.set(key, value)
        }
    }
    remove() {
        this.table.delete()
        this.valueCellMap.clear()
        this.valueMap.clear()
    }
}