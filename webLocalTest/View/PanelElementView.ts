import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, IElement, UIElement } from "../GUI/UIElement.js"
import { WebSocketClient } from "../WebSocketClient.js"
import { Color } from "./Colors.js"

export class PanelElementView extends UIElement<'div'>
{
    header: UIElement<'div'>
    userContainer: UIElement<'div'>
    userContent: HTMLElement

    constructor(titleText: string, userContent?: HTMLElement) {
        super('div')

        this.style({
            backgroundColor: Color.PanelElement,
            borderTop:          '1px solid ' + Color.BorderLight,
            borderBottom:       '1px solid ' + Color.BorderDark,
        })

        this.header = TextNode(titleText).backgroundColor(Color.PanelElementHeader)
            .style({ paddingLeft: '4px'})

        this.userContainer = VerticalContainer()
            .style({
                padding: '4px',
                rowGap: '2px'
            })

        this.content(
            this.header,
            this.userContainer
        )

        if (userContent) this.setUserContent(userContent)
    }

    setUserContent(userContent: HTMLElement) {
        this.userContainer.contentNodes(userContent)
        this.userContent = userContent
    }
}