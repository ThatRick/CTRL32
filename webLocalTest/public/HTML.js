export function htmlElement(tagName, options) {
    var _a, _b;
    const elem = document.createElement(tagName);
    if (options.style)
        Object.assign(elem.style, options.style);
    for (let attr in options.attributes) {
        elem.setAttribute(attr, options.attributes[attr]);
    }
    (_a = options.parent) === null || _a === void 0 ? void 0 : _a.appendChild(elem);
    if (options.textContent)
        elem.textContent = options.textContent;
    (_b = options.setup) === null || _b === void 0 ? void 0 : _b.call(options, elem);
    return elem;
}
export class HTMLTable {
    constructor(options) {
        this.rows = [];
        this.cells = [];
        this.element = htmlElement('table', {
            style: options.tableStyle,
            parent: options.parentElement,
        });
        if (options.caption)
            htmlElement('caption', { textContent: options.caption, parent: this.element });
        for (let y = 0; y < options.rows; y++) {
            const row = htmlElement('tr', {
                style: options.rowStyle,
                parent: this.element
            });
            this.rows[y] = row;
            this.cells[y] = [];
            for (let x = 0; x < options.columns; x++) {
                const cell = htmlElement('td', {
                    style: options.cellStyle,
                    parent: row
                });
                this.cells[y][x] = cell;
            }
        }
        if (options.cellIterator)
            this.iterateCells(options.cellIterator);
    }
    delete() {
        this.rows = null,
            this.cells = null;
        this.element.remove();
        this.element = null;
    }
    getCell(row, col) { return this.cells[row][col]; }
    iterateCells(iterator) {
        this.cells.forEach((row, y) => row.forEach((cell, x) => iterator(cell, y, x)));
    }
}
