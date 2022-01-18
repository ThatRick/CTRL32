import Vec2, {vec2} from '../Vector2.js'
import { htmlElement } from '../HTML.js'
import { GUIElement, Movable, Clickable, Resizable } from './GUIElement.js'

interface GUIWindowOptions {
    size?:              Vec2
    content?:           HTMLElement
    title?:             string
    scrollbars?:        boolean
    autoSize?:          boolean
    noStatusBar?:       boolean
}
const windowStyle: Partial<CSSStyleDeclaration> = {
    backgroundColor:    'DimGray',
    border:             'solid Gray 1px',
    borderRadius:       '3px',
    display:            'flex',
    flexDirection:      'column',
}
const barStyle: Partial<CSSStyleDeclaration> = {
    backgroundColor:    'Gray',
    color:              'White',
    display:            'flex',
    width:              '100%',
    alignItems:         'center',
}
const userContentStyle: Partial<CSSStyleDeclaration> = {
    color:              'White',
    flexGrow:           '1',
    margin:             '0px',
    padding:            '0px',
}
const buttonStyle: Partial<CSSStyleDeclaration> = {
    padding:            '0px 3px',
    borderWidth:        '1px',
    borderRadius:       '3px',
    height:             '20px',
    backgroundColor:    'Silver',
    lineHeight:         '0px'
}

export class GUIWindow extends GUIElement {
    topBar:             HTMLDivElement
        title:          HTMLDivElement
        closeBtn:       HTMLButtonElement
        maximizeBtn:    HTMLButtonElement
    userContainer:      HTMLDivElement
        userContent:    HTMLElement
    bottomBar:          HTMLDivElement
        status:         HTMLDivElement
        userControls:   HTMLDivElement
        resizeSymbol:   HTMLDivElement


    constructor(pos: Vec2, protected options: GUIWindowOptions)
    {
        super(pos, options.size ?? vec2(300, 300), windowStyle)

        this.topBar = htmlElement('div', {
            style: {
                ...barStyle
            },
            parent: this.node
        })

        this.title = htmlElement('div', {
            textContent: options.title || 'GUIWindow',
            style: {
                flexGrow: '1',
                padding: '0px 3px',
            },
            parent: this.topBar
        })
        new Movable(this.title, this)

        this.maximizeBtn = htmlElement('button', {
            style: {
                ...buttonStyle
            },
            textContent: '◰', // ◰
            setup: elem => {
                elem.type = 'button'
            },
            parent: this.topBar
        })
        new Clickable(this.maximizeBtn, () => { this.resizeToContent() })

        this.closeBtn = htmlElement('button', {
            style: {
                ...buttonStyle,
                color: 'FireBrick'
            },
            textContent: '✕',//'✕',
            setup: elem => {
                elem.type = 'button'
            },
            parent: this.topBar
        })
        new Clickable(this.closeBtn, () => { this.remove() })

        this.userContainer = htmlElement('div', {
            style: {
                ...userContentStyle,
                overflow: options.scrollbars ? 'auto' : 'hidden',
            },
            parent: this.node
        })

        if (options.noStatusBar) {
            this.resizeSymbol = htmlElement('div', {
                textContent: '⋰',
                style: {
                    padding: '0px 3px',
                    position: 'absolute',
                    right: '0px',
                    bottom: '0px'
                },
                parent: this.node
            })
            new Resizable(this.resizeSymbol, this)
        } else {
            this.bottomBar = htmlElement('div', {
                style: {
                    ...barStyle,
                    justifyContent: 'space-between',
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

            this.didResize = () => {
                this.status.textContent = this.userContentSize.toString()
            }
        }
        
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

}