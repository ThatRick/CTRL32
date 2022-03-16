import { HTMLTable } from "../HTML.js";
import { toHex } from "../Util.js";
export class ObjectView {
    constructor(obj, style = { padding: '3px' }) {
        this.valueCellMap = new Map();
        this.valueMap = new Map();
        const entries = Object.entries(obj);
        this.table = new HTMLTable({
            rows: entries.length,
            columns: 2,
            tableStyle: style
        });
        //this.table.getCell(0, 0).style.width = '2em'
        //this.table.getCell(0, 1).style.width = '8em'
        entries.forEach(([key, value], row) => {
            const keyCell = this.table.getCell(row, 0 /* KEY */);
            const valueCell = this.table.getCell(row, 1 /* VALUE */);
            keyCell.textContent = key;
            this.valueCellMap.set(key, valueCell);
            this.setValue(key, value);
        });
    }
    get node() { return this.table.node; }
    updateValues(obj) {
        Object.entries(obj).forEach(([key, value]) => this.setValue(key, value));
    }
    setValue(key, value) {
        const valueCell = this.valueCellMap.get(key);
        if (!valueCell)
            return;
        const currentValue = this.valueMap.get(key);
        if (currentValue != value) {
            valueCell.textContent = (key.endsWith('List') || key.endsWith('Ptr') || key == 'pointer') ? toHex(value)
                : (value % 1) ? value.toPrecision(7) : value.toString();
            this.valueMap.set(key, value);
        }
    }
    remove() {
        this.table.delete();
        this.valueCellMap.clear();
        this.valueMap.clear();
    }
}
