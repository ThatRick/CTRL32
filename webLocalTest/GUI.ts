
import Vec2, {vec2} from "./Vector2.js"
import { htmlElement } from './HTML.js'
import { EventEmitter } from "./Events.js"


const containerStyle: Partial<CSSStyleDeclaration> = {
    position:   'relative',
    margin:     '0px',
    padding:    '0px',
    userSelect: 'none'
}

const windowStyle: Partial<CSSStyleDeclaration> = {
    backgroundColor: 'grey',
    userSelect: 'none',
    border: 'solid black 1px',
    display: 'flex',
    flexDirection: 'column'
}

class GUIPointerHandler {
    currentPos = vec2(0, 0)
    downPos = vec2(0, 0)
    isDown = false

    constructor(protected node: HTMLElement) {
        node.onpointerdown = ev => {
            this.isDown = true
            this.downPos.set(ev.pageX, ev.pageY)
            this.userOnDown?.()
        }
        node.onpointerup = ev => {
            this.isDown = false
            if (node.hasPointerCapture(ev.pointerId)) node.releasePointerCapture(ev.pointerId)
            this.userOnUp?.()
        }
        node.onpointermove = ev => {
            this.currentPos.set(ev.pageX, ev.pageY)
            if (this.isDown && this.userOnDrag) {
                if (!node.hasPointerCapture(ev.pointerId)) {
                    node.setPointerCapture(ev.pointerId)
                }
                const dragOffset = Vec2.sub(this.currentPos, this.downPos)
                this.userOnDrag?.(dragOffset)
            }
            else this.userOnHover?.()
        }
    }
    userOnDown: () => void
    userOnUp: () => void
    userOnDrag: (offset: Vec2) => void
    userOnHover: () => void
}


class Movable extends GUIPointerHandler {
    initPos: Vec2

    constructor(eventTarget: HTMLElement, protected moveTarget: GUIElement) {
        super(eventTarget)
        moveTarget.node.style.position = 'absolute'
        this.initPos = vec2(moveTarget.currentPos)
        eventTarget.style.cursor = 'grab'
    }
    userOnDown = () => {
        this.initPos.set(this.moveTarget.currentPos)
        this.node.style.cursor = 'grabbing'
    }
    userOnDrag = (offset: Vec2) => {
        const maxPos = vec2(document.body.clientWidth - this.moveTarget.currentSize.x,
            document.body.clientHeight - this.moveTarget.currentSize.y)
            const draggedPos = Vec2.add(this.initPos, offset).limit(vec2(0, 0), maxPos)
            this.moveTarget.setPos(draggedPos)
        }
    userOnUp = () => {
        this.node.style.cursor = 'grab'            
    }
}


class Resizable extends GUIPointerHandler {
    initSize: Vec2
    constructor(eventTarget: HTMLElement, protected resizeTarget: GUIElement) {
        super(eventTarget)
        this.initSize = vec2(resizeTarget.currentSize)
        eventTarget.style.cursor = 'nwse-resize'
    }
    userOnDown = () => {
        this.initSize.set(this.resizeTarget.currentSize)
    }
    userOnDrag = (offset: Vec2) => {
        const draggedSize = Vec2.add(this.initSize, offset).limit(vec2(50, 50), vec2(400, 400))
        this.resizeTarget.setSize(draggedSize)
    }
}

class Clickable extends GUIPointerHandler {
    constructor(eventTarget: HTMLElement, protected action: () => void) {
        super(eventTarget)
        eventTarget.style.cursor = ''
    }
    userOnUp = this.action
}

export class GUIElement {
    node: HTMLDivElement

    readonly currentPos = vec2(0, 0)
    readonly currentSize = vec2(0, 0)
    
    private newPos: Vec2
    private newSize: Vec2

    private gui: GUI

    constructor(pos: Vec2, size: Vec2, style?: Partial<CSSStyleDeclaration>) {
        this.node = document.createElement('div')
        style && Object.assign(this.node.style, style)
        this.setPos(pos)
        this.setSize(size)
        this.node.style.zIndex = '2'
        this.node.onpointerdown = ev => { this.gui?.selectElement(this) }
    }

    highlight(enabled: boolean) {
        this.node.style.borderColor = enabled ? 'silver' : 'grey'
        this.node.style.zIndex = enabled ? '3' : '2'
    }

    setPos(pos: Vec2) {
        if (!this.newPos) this.newPos = vec2(pos)
        else this.newPos.set(pos)
    }

    setSize(size: Vec2) {
        if (!this.newSize) this.newSize = vec2(size)
        else this.newSize.set(size)
    }

    update() {
        if (this.newPos) {
            this.node.style.left =  this.newPos.x + 'px'
            this.node.style.top =   this.newPos.y + 'px'
            this.currentPos.set(this.newPos)
            this.newPos = null
        }
        if (this.newSize) {
            this.node.style.width =  this.newSize.x + 'px'
            this.node.style.height = this.newSize.y + 'px'
            this.currentSize.set(this.newSize)
            this.newSize = null
        }
    }

    setGUI(gui: GUI) { this.gui = gui }

    remove() {
        this.node.remove()
    }
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

export class GUI
{
    node: HTMLDivElement

    elements = new Set<GUIElement>()
    
    selection: GUIElement

    constructor(parent?: HTMLElement) {
        this.node = (parent ?? document.createElement('div')) as HTMLDivElement
        document.body.appendChild(this.node)
        document.body.style.userSelect = 'none'
        Object.assign(this.node, containerStyle)

        this.node.onpointerdown = this.onPointerDown

        this.createTestSet()

        requestAnimationFrame(this.update.bind(this))
    }

    createElement(pos: Vec2, size: Vec2) {
        const element = new GUIElement(pos, size)
        this.addElement(element)
        return element
    }
    
    addElement(element: GUIElement) {
        this.elements.add(element)
        element.setGUI(this)
        this.node.appendChild(element.node)
    }

    selectElement(element: GUIElement) {
        if (!this.elements.has(element)) return
        if (this.selection && this.selection != element) {
            this.selection.highlight(false)
        }
        this.node.appendChild(element.node)
        this.selection = element
        element.highlight(true)
    }

    createTestSet() {
        const size = vec2(200, 100)

        for (let i=0; i<5; i++) {
            const x = Math.random() * (window.innerWidth - size.x)
            const y = Math.random() * (window.innerHeight - size.y)
            const element = new GUIWindow(vec2(i*size.x / 2, 100+i*size.y / 2), size)
            const textArea = htmlElement('textarea', {
                textContent: 'abcdefghijklmnopqrstuvwxyzåäö',
                style: {
                    backgroundColor: 'Cornsilk',
                    width: '100%', height: '100%'
                },
                parent: element.userContent
            })
            this.addElement(element)
        }
    }

    onPointerDown = (ev: PointerEvent) => {
        console.log('target:', ev.target )
        console.log('current:', ev.currentTarget )
    }

    update() {
        this.elements.forEach(elem => elem.update())
        requestAnimationFrame(this.update.bind(this))
    }
}