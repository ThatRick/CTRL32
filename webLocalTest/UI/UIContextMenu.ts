import Vec2, { vec2 } from "../Vector2.js"
import { Colors } from "../View/Colors.js"
import { NodeElement } from "./NodeElement.js"
import { Div, HorizontalContainer, TextNode } from "./UIElements.js"

export interface IUIContextMenuItem
{
    name:       string
    action?:    (name: string, id?: number) => void
    subItems?:  () => IUIContextMenuItem[]
    disabled?:  boolean
    id?:        number
}

const itemHeight = 20
const itemMinWidth = 100

export class UIContextMenu extends NodeElement
{
    private onPointerOverItem = (ev: PointerEvent, elem: NodeElement) => { elem.backgroundColor(Colors.SelectionDark); elem.color(Colors.PrimaryText) }
    private onPointerOutItem = (ev: PointerEvent, elem: NodeElement) => { elem.backgroundColor('transparent'); elem.color(Colors.SecondaryText) }

    private childMenu:  UIContextMenu
    private childMenuIndex: number
    private parentMenu: UIContextMenu
    private pos: Vec2

    private toggleChildMenu(index: number, submenuItems: () => IUIContextMenuItem[])
    {
        const submenuPos = Vec2.add(this.pos, vec2(itemMinWidth, index * itemHeight))
        // Close already open submenu
        if (this.childMenu && index == this.childMenuIndex) {
            this.childMenu.closeSelfAndChildren()
            this.childMenu = null
        }
        // Open submenu
        else {
            if (this.childMenu) this.childMenu.closeSelfAndChildren()
            this.childMenu = new UIContextMenu(submenuPos, submenuItems(), this)
            this.childMenuIndex = index
        }
    }

    constructor(pos: Vec2, items: IUIContextMenuItem[], parentMenu?: UIContextMenu) {
        super('div')
        this.parentMenu = parentMenu
        this.pos = pos

        this.position(pos, 'fixed')
        this.style({
            minWidth: itemMinWidth + 'px',
            zIndex: '9',
            color: Colors.SecondaryText,
            backgroundColor: Colors.PanelElement,
            fontFamily: 'monospace',
            border: '1px solid ' + Colors.Base
        })
        .paddingVertical(6)
        .paddingHorizontal(0)

        const itemNodes = items.map((item, index) => HorizontalContainer(
            TextNode(item.name),
            TextNode(item.subItems ? '>': '').align('right').flexGrow()
        )
            .onClick(() => {    
                if (item.action) {
                    item.action(item.name, item.id)
                    this.childMenu?.closeSelfAndChildren()
                    this.parentMenu?.closeSelfAndParent()
                    this.remove()
                }
                if (item.subItems) {
                    this.toggleChildMenu(index, item.subItems)
                }
            })
            .style({
                height:         itemHeight + 'px',
                lineHeight:     itemHeight + 'px',
            })
            .paddingHorizontal(6)
            .setPointerHandlers({
                onPointerOver:  this.onPointerOverItem,
                onPointerOut:   this.onPointerOutItem,
            })
        )

        this.append(...itemNodes)
        this.appendToNode(document.body)
    }

    closeSelfAndChildren() {
        this.childMenu?.closeSelfAndChildren()
        this.childMenu = null
        this.remove()
    }
    closeSelfAndParent() {
        this.parentMenu?.closeSelfAndParent()
        this.parentMenu = null
        this.remove()
    }
}