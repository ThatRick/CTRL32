import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, IElement, UIElement } from "../GUI/UIElement.js"
import { Color } from "./Colors.js"

export class PanelElementView extends UIElement<'div'>
{
    titleBar:           UIElement<'div'>
        hideIcon:       UIElement<'div'>
        titleName:      UIElement<'div'>
        status:         UIElement<'div'>
    userContainer:      UIElement<'div'>
        userContent:    HTMLElement

    constructor(titleText: string, userContent?: HTMLElement) {
        super('div')

        this.style({
            backgroundColor:    Color.PanelElement,
            borderTop:          '1px solid ' + Color.BorderLight,
            borderBottom:       '1px solid ' + Color.BorderDark,
        })

        this.hideIcon   = TextNode('⌵').width(11).paddingRight(2)

        this.titleName  = TextNode(titleText).paddingRight(6).color('white')

        this.status     = TextNode('').flexGrow()

        this.titleBar   = HorizontalContainer(this.hideIcon, this.titleName, this.status)
            .style({ userSelect: 'none' })
            .backgroundColor(Color.PanelElementHeader)
            .onClick(() => {
                this.hidden = !this.hidden
                this.userContainer.node.style.display = this.hidden ? 'none' : 'flex'
                this.hideIcon.textContent( this.hidden ? '>' : '⌵' ) // ⏷:⏵ - 🞂:🞃 - ⯈:⯆ - >:⌵
                this.onHideChanged?.(this.hidden)
            })

        this.userContainer = VerticalContainer().padding(4)
            .style({ rowGap: '2px' })

        this.content(
            this.titleBar,
            this.userContainer
        )

        if (userContent) this.setUserContent(userContent)
    }

    protected hidden = false

    setUserContent(userContent: HTMLElement) {
        this.userContainer.contentNodes(userContent)
        this.userContent = userContent
    }

    setStatus(text: string) {
        this.status.textContent(text)
    }

    onHideChanged: (hidden: boolean) => void
}