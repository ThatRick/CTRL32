import Vec2, {vec2} from '../Vector2.js'
import { htmlElement } from '../HTML.js'
import { GUIElement, Movable, Clickable, Resizable } from './GUIElement.js'

const windowStyle: Partial<CSSStyleDeclaration> = {
    backgroundColor: 'grey',
    userSelect: 'none',
    border: 'solid black 1px',
    display: 'flex',
    flexDirection: 'column'
}

export class GUIWindow extends GUIElement {
    topBar:         HTMLDivElement
    title:          HTMLDivElement
    closeBtn:       HTMLButtonElement
    maximizeBtn:    HTMLButtonElement
    userContent:    HTMLDivElement
    bottomBar:      HTMLDivElement
    status:         HTMLDivElement
    resizeSymbol:   HTMLDivElement

    constructor(pos: Vec2, size: Vec2) {
        super(pos, size, windowStyle)

        this.topBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
                //justifyContent: 'space-between'
            },
            parent: this.node
        })

        this.title = htmlElement('div', {
            textContent: 'A Fancy window',
            style: { width: '100%' },
            parent: this.topBar
        })
        new Movable(this.title, this)

        this.maximizeBtn = htmlElement('button', {
            style: {
                padding: '0px 3px'
            },
            textContent: '◰',
            setup: elem => {
                elem.type = 'button'
            },
            parent: this.topBar
        })
        new Clickable(this.maximizeBtn, () => { this.resizeToContent() })

        this.closeBtn = htmlElement('button', {
            style: {
                backgroundColor: 'FireBrick',
                padding: '0px 3px'
            },
            textContent: '✕',
            setup: elem => {
                elem.type = 'button'
            },
            parent: this.topBar
        })
        new Clickable(this.closeBtn, () => { this.remove() })

        this.userContent = htmlElement('div', {
            style: {
                backgroundColor: 'darkslategray',
                color: 'lemonchiffon',
                flexGrow: '1',
                margin: '0px',
                overflowX: 'hidden',
                overflowY: 'auto',
            },
            parent: this.node
        })

        this.bottomBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between'
            },
            parent: this.node
        })
        this.status = htmlElement('div', {
            textContent: 'status text',
            style: { width: '100%' },
            parent: this.bottomBar
        })
        this.resizeSymbol = htmlElement('div', {
            textContent: '⋰',
            style: {
                padding: '0px 2px'
            },
            parent: this.bottomBar
        })
        new Resizable(this.resizeSymbol, this)
        
        this.node.appendChild(this.bottomBar)
    }

    resizeToContent() {
        const contentSize = vec2(this.userContent.scrollWidth, this.userContent.scrollHeight)
        const visibleSize = vec2(this.userContent.clientWidth, this.userContent.clientHeight)
        console.log('contentSize', contentSize)
        console.log('visible', visibleSize)
        const hiddenSize = Vec2.sub(contentSize, visibleSize)
        const newSize = Vec2.add(this.currentSize, hiddenSize)
        this.setSize(newSize)
    }
}