import Vec2, { vec2 } from "../Vector2.js";
import { Colors } from "../View/Colors.js";
import { NodeElement } from "./NodeElement.js";
import { HorizontalContainer, TextNode } from "./UIElements.js";
const itemHeight = 20;
const itemMinWidth = 100;
export class UIContextMenu extends NodeElement {
    constructor(pos, items, parentMenu) {
        super('div');
        this.onPointerOverItem = (ev, elem) => { elem.backgroundColor(Colors.SelectionDark); elem.color(Colors.PrimaryText); };
        this.onPointerOutItem = (ev, elem) => { elem.backgroundColor('transparent'); elem.color(Colors.SecondaryText); };
        this.parentMenu = parentMenu;
        this.pos = pos;
        this.position(pos, 'fixed');
        this.style({
            minWidth: itemMinWidth + 'px',
            zIndex: '9',
            color: Colors.SecondaryText,
            backgroundColor: Colors.PanelElement,
            fontFamily: 'monospace',
            border: '1px solid ' + Colors.Base
        })
            .paddingVertical(6)
            .paddingHorizontal(0);
        const itemNodes = items.map((item, index) => HorizontalContainer(TextNode(item.name), TextNode(item.subItems ? '>' : '').align('right').flexGrow())
            .onClick(() => {
            if (item.action) {
                item.action(item.name, index);
                this.childMenu?.closeSelfAndChildren();
                this.parentMenu?.closeSelfAndParent();
                this.remove();
            }
            if (item.subItems) {
                this.toggleChildMenu(index, item.subItems);
            }
        })
            .style({
            height: itemHeight + 'px',
            lineHeight: itemHeight + 'px',
        })
            .paddingHorizontal(6)
            .setPointerHandlers({
            onPointerOver: this.onPointerOverItem,
            onPointerOut: this.onPointerOutItem,
        }));
        this.append(...itemNodes);
        this.appendToNode(document.body);
    }
    toggleChildMenu(index, submenuItems) {
        const submenuPos = Vec2.add(this.pos, vec2(itemMinWidth, index * itemHeight));
        // Close already open submenu
        if (this.childMenu && index == this.childMenuIndex) {
            this.childMenu.closeSelfAndChildren();
            this.childMenu = null;
        }
        // Open submenu
        else {
            if (this.childMenu)
                this.childMenu.closeSelfAndChildren();
            this.childMenu = new UIContextMenu(submenuPos, submenuItems(), this);
            this.childMenuIndex = index;
        }
    }
    closeSelfAndChildren() {
        this.childMenu?.closeSelfAndChildren();
        this.childMenu = null;
        this.remove();
    }
    closeSelfAndParent() {
        this.parentMenu?.closeSelfAndParent();
        this.parentMenu = null;
        this.remove();
    }
}
