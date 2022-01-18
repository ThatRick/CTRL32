import Vec2, {vec2} from '../Vector2.js'
import { htmlElement } from '../HTML.js'
import { GUIElement, Movable, Clickable, Resizable } from './GUIElement.js'

const windowStyle: Partial<CSSStyleDeclaration> = {
    backgroundColor: 'grey',
    border: 'solid black 1px',
    display: 'flex',
    flexDirection: 'column',
}

interface GUIWindowOptions {
    size?:          Vec2,
    content?:       HTMLElement,
    title?:         string
    scrollbars?:    boolean,
    autoSize?:      boolean
}

export class GUIWindow extends GUIElement {
    topBar:         HTMLDivElement
    title:          HTMLDivElement
    closeBtn:       HTMLButtonElement
    maximizeBtn:    HTMLButtonElement
    userContainer:  HTMLDivElement
    bottomBar:      HTMLDivElement
    status:         HTMLDivElement
    userControls:   HTMLDivElement
    resizeSymbol:   HTMLDivElement

    userContent:    HTMLElement

    constructor(pos: Vec2, protected options: GUIWindowOptions)
    {
        super(pos, options.size ?? vec2(300, 300), windowStyle)

        this.topBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
                alignItems: 'center'
            },
            parent: this.node
        })

        this.title = htmlElement('div', {
            textContent: options.title || 'GUIWindow',
            style: {
                flexGrow: '1',
                padding: '0px 3px'
            },
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

        this.userContainer = htmlElement('div', {
            style: {
                backgroundColor: 'darkslategray',
                color: 'lemonchiffon',
                flexGrow: '1',
                margin: '0px',
                padding: '0px',
                overflow: options.scrollbars ? 'auto' : 'hidden',
            },
            parent: this.node
        })

        this.bottomBar = htmlElement('div', {
            style: {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            },
            parent: this.node
        })
        this.userControls = htmlElement('div', {
            style: {
                display: 'flex',
                flexGrow: '1'
            },
            parent: this.bottomBar
        })
        this.status = htmlElement('div', {
            parent: this.bottomBar
        })
        this.resizeSymbol = htmlElement('div', {
            textContent: '⋰',
            style: {
                padding: '0px 3px',
            },
            parent: this.bottomBar
        })
        new Resizable(this.resizeSymbol, this)
        
        this.node.appendChild(this.bottomBar)

        if (options.content) {
            this.setContent(options.content)
        }
    }

    setContent(content: HTMLElement) {
        content.style.boxSizing = 'border-box'
        this.userContainer.appendChild(content)
        this.userContent = content
        if (this.options.autoSize) setTimeout(() => this.resizeToContent(), 100)
    }

    resizeToContent() {
        const contentSize = vec2(this.userContent.scrollWidth, this.userContent.scrollHeight)
        const visibleSize = vec2(this.userContainer.clientWidth, this.userContainer.clientHeight)
        console.log('contentSize', contentSize)
        console.log('visible', visibleSize)
        console.log('clientRect', this.userContentSize)
        const hiddenSize = Vec2.sub(contentSize, visibleSize)
        const newSize = Vec2.add(this.currentSize, hiddenSize).limit(vec2(200, 40))
        this.setSize(newSize)
    }

    get userContentSize() {
        const box = this.userContainer.getBoundingClientRect()
        return vec2(box.width, box.height)
    }

    didResize = () => {
        this.status.textContent = this.userContentSize.toString()
    }
}