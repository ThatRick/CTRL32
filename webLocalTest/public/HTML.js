export function htmlElement(tagName, options = {}) {
    const elem = document.createElement(tagName);
    options.parent?.appendChild(elem);
    if (options.style)
        Object.assign(elem.style, options.style);
    for (let attr in options.attributes) {
        elem.setAttribute(attr, options.attributes[attr]);
    }
    if (options.textContent)
        elem.textContent = options.textContent;
    options.setup?.(elem);
    return elem;
}
export class HTMLTable {
    constructor(options) {
        this.rows = [];
        this.cells = [];
        this.node = htmlElement('table', {
            style: options.tableStyle,
            parent: options.parentElement,
        });
        if (options.caption)
            htmlElement('caption', { textContent: options.caption, parent: this.node });
        for (let y = 0; y < options.rows; y++) {
            const row = htmlElement('tr', {
                style: options.rowStyle,
                parent: this.node
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
        this.node.remove();
        this.node = null;
    }
    getCell(row, col) { return this.cells[row][col]; }
    iterateCells(iterator) {
        this.cells.forEach((row, y) => row.forEach((cell, x) => iterator(cell, y, x)));
    }
}
export function backgroundGridStyle(scale, lineColor) {
    return {
        backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    };
}
export function backgroundLinesStyle(scale, lineColor) {
    return {
        backgroundImage: `linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    };
}
export function backgroundDotStyle(scale, lineColor) {
    return {
        backgroundImage: `radial-gradient(circle, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    };
}
