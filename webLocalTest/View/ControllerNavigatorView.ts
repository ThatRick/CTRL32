import { C32Controller } from "../C32/C32Controller.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, IElement, NodeElement } from "../UI/UIElements.js"
import { Colors } from "./Colors.js"


export class TreeNodeView extends NodeElement
{
    titleBar:           NodeElement
        expandIcon:     NodeElement
        titleName:      NodeElement
    childContainer:     NodeElement

    readonly hasChildren: boolean

    deselect() {
        this.selected = false
        this.titleBar.backgroundColor('transparent')
    }

    expandChildNodes(expanded: boolean) {
        this.expanded = expanded
        this.childContainer.node.style.display = this.expanded ? 'flex' : 'none'
        this.expandIcon.textContent( this.expandIconChar )

        if (this.expanded && !this.childNodes) {
            this.childNodes = this.getChildNodes()
            this.childContainer.append(...this.childNodes)
        }

        return this
    }

    constructor( protected name: string,
                 protected getChildNodes?: () => IElement[] )
    {
        super('div')

        this.hasChildren = (getChildNodes != null)

        this.expandIcon = TextNode( this.hasChildren ? this.expandIconChar : '∙' )
            .width(this.expandIconWidth)
            .paddingHorizontal(2)

        this.titleName  = TextNode(name)
            .color( this.hasChildren ? Colors.PrimaryText : Colors.SecondaryText )

        this.titleBar   = HorizontalContainer( this.expandIcon, this.titleName )
            .style({
                userSelect: 'none',
            })
            .onClick( () => {
                if (this.selected && this.hasChildren) {
                     this.expandChildNodes(!this.expanded)
                }
                else if (!this.selected) {
                    this.selected = true
                    this.titleBar.backgroundColor(Colors.PanelElement)
                }
            })

        this.childContainer = VerticalContainer()
            .paddingLeft(this.expandIconWidth)
            .paddingBottom(2)
            .style({ display: 'none' })

        this.append(
            this.titleBar,
            this.childContainer
        )
    }

    protected readonly expandIconWidth = 11

    protected selected = false
    protected expanded = false

    protected childNodes: IElement[]

    protected get expandIconChar() { return this.expanded ? '⌵' : '>' }

}


export class ControllerNavigatorView extends NodeElement
{
    constructor(protected controller: C32Controller) {
        super('div')
    }



    protected selectedNode: HTMLElement
}