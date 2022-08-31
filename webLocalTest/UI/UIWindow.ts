import Vec2 from "../Vector2.js"
import { Colors } from "../View/Colors.js"
import { MovableElement } from "./MovableElement.js"
import { NodeElement } from "./NodeElement.js"
import { Button, HorizontalContainer, TextNode } from "./UIElements.js"
import { createMoveHandle, createResizeHandle } from "./UIPointerHandlers.js"

export class UIWindow extends MovableElement
{
    private titleTextNode: NodeElement

    constructor(pos: Vec2, size: Vec2, content: NodeElement) {
        super(pos, size)

        const titleBar = HorizontalContainer(
            createMoveHandle(this).textContent('Text Window')
                .setup(elem => this.titleTextNode = elem)
                .userSelect('none')
                .padding(2)
                .backgroundColor(Colors.PanelElementHeader)
                .flexGrow(),
            Button('✕', () => console.log('CLOSE BUTTON PRESSED!')) //this.close.bind(this))
                .userSelect('none')
                .style({
                    padding: '0px 3px',
                    backgroundColor: 'FireBrick', color: 'white'
                })
        )

        this.flexContainer('vertical')
            .backgroundColor(Colors.Panel)
            .append(
                titleBar,
                content.flexGrow(),
                createResizeHandle(this).append(
                    TextNode('⋰').style({
                        color: Colors.BorderLight,
                        textAlign: 'right',
                        position: 'absolute',
                        bottom: '0px', right: '0px',
                        paddingRight: '4px'
                    })
                ).style({
                    position: 'absolute',
                    bottom: '0px', right: '0px',
                    width: '20px', height: '20px',
                    userSelect: 'none'
                }),
        )
    }

    titleText(text: string) { this.titleTextNode.textContent(text); return this }

    close() {
        console.log('Closing window')
        this.remove()
    }
}