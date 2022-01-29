import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, IElement, NodeElement } from "../GUI/UIElements.js"
import { Color } from "./Colors.js"

interface PanelElementViewConfig {
    userContent?:   HTMLElement
    statusText?:    string
    statusColor?:   string
    closable?:      boolean
    onHideChanged?: (hidden: boolean) => void
}

export class PanelElementView extends NodeElement<'div'>
{
    titleBar:           NodeElement<'div'>
        hideIcon:       NodeElement<'div'>
        titleName:      NodeElement<'div'>
        status:         NodeElement<'div'>
    userContainer:      NodeElement<'div'>
        userContent:    HTMLElement

    constructor(titleText: string, config: PanelElementViewConfig = {}) {
        super('div')

        this.backgroundColor(Color.PanelElement)

        this.hideIcon   = TextNode('⌵').width(11).paddingHorizontal(2)

        this.titleName  = TextNode(titleText).paddingRight(6).color('white')

        this.status     = TextNode(config.statusText ?? '').flexGrow()
        if (config.statusColor) this.status.node.style.color = config.statusColor

        this.titleBar   = HorizontalContainer(this.hideIcon, this.titleName, this.status)
            .style({
                userSelect:     'none',
                borderTop:      '1px solid ' + Color.BorderLight,
                borderBottom:   '1px solid ' + Color.BorderDark,
            })
            .backgroundColor(Color.PanelElementHeader)
            .onClick(() => this.setHidden(!this.hidden))

        if (config.closable) this.titleBar.append(
            TextNode('✕').paddingHorizontal(4)
                .color(Color.SecondaryText)
                .onClick(() => this.remove() )
        )

        this.userContainer = VerticalContainer().padding(4).flexGrow()

        this.append(
            this.titleBar,
            this.userContainer
        )

        if (config.userContent) this.setUserContent(config.userContent)
        if (config.onHideChanged) this.onHideChanged = config.onHideChanged
    }

    protected hidden = false

    setHidden(hidden: boolean) {
        this.hidden = hidden
        this.userContainer.node.style.display = this.hidden ? 'none' : 'flex'
        this.hideIcon.textContent( this.hidden ? '>' : '⌵' ) // ⏷:⏵ - 🞂:🞃 - ⯈:⯆ - >:⌵
        this.onHideChanged?.(this.hidden)
        return this
    }

    setUserContent(userContent: HTMLElement) {
        this.userContainer.appendNodes(userContent)
        this.userContent = userContent
        return this
    }

    setStatus(text: string) {
        this.status.textContent(text)
        return this
    }

    onHideChanged: (hidden: boolean) => void
}