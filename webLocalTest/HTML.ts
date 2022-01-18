
export function htmlElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options: {
    style?: Partial<CSSStyleDeclaration>,
    attributes?: {[key: string]: string},
    textContent?: string,
    parent?: HTMLElement,
    setup?: (elem: HTMLElementTagNameMap[K]) => void
 } = {}): HTMLElementTagNameMap[K]
{
    const elem = document.createElement(tagName)
    options.parent?.appendChild(elem)
    if (options.style) Object.assign(elem.style, options.style)
    for (let attr in options.attributes) {
        elem.setAttribute(attr, options.attributes[attr])
    }
    if (options.textContent) elem.textContent = options.textContent

    options.setup?.(elem)
    return elem
}


type TableCellIterator = (cell: HTMLTableCellElement, row: number, col: number) => void

export class HTMLTable
{
    node: HTMLTableElement
    private rows: HTMLTableRowElement[] = []
    private cells: HTMLTableCellElement[][] = []

    constructor (options: {
        rows: number,
        columns: number,
        parentElement?: HTMLElement,
        tableStyle?: Partial<CSSStyleDeclaration>,
        rowStyle?:   Partial<CSSStyleDeclaration>,
        cellStyle?:  Partial<CSSStyleDeclaration>,
        caption?:    string,
        cellIterator?: TableCellIterator
    }) 
    {
        this.node = htmlElement('table', {
            style: options.tableStyle,
            parent: options.parentElement,
        })

        if (options.caption) htmlElement('caption', { textContent: options.caption, parent: this.node })

        for (let y = 0; y < options.rows; y++) {
            const row = htmlElement('tr', {
                style: options.rowStyle,
                parent: this.node
            })
            this.rows[y] = row
            this.cells[y] = []
            for (let x = 0; x < options.columns; x++) {
                const cell = htmlElement('td', {
                    style: options.cellStyle,
                    parent: row
                })
                this.cells[y][x] = cell
            }
        }
        if (options.cellIterator) this.iterateCells(options.cellIterator)
    }

    delete() {
        this.rows = null,
        this.cells = null
        this.node.remove()
        this.node = null
    }

    getCell(row: number, col: number) { return this.cells[row][col] }

    iterateCells(iterator: TableCellIterator) {
        this.cells.forEach((row, y) => row.forEach((cell, x) => iterator(cell, y, x)))
    }
}