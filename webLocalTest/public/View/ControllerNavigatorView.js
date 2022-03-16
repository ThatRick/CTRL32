import { HorizontalContainer, VerticalContainer, TextNode, NodeElement } from "../UI/UIElements.js";
import { Color } from "./Colors.js";
export class TreeNodeView extends NodeElement {
    constructor(name, getChildNodes) {
        super('div');
        this.name = name;
        this.getChildNodes = getChildNodes;
        this.expandIconWidth = 11;
        this.selected = false;
        this.expanded = false;
        this.hasChildren = (getChildNodes != null);
        this.expandIcon = TextNode(this.hasChildren ? this.expandIconChar : '∙')
            .width(this.expandIconWidth)
            .paddingHorizontal(2);
        this.titleName = TextNode(name)
            .color(this.hasChildren ? Color.PrimaryText : Color.SecondaryText);
        this.titleBar = HorizontalContainer(this.expandIcon, this.titleName)
            .style({
            userSelect: 'none',
        })
            .onClick(() => {
            if (this.selected && this.hasChildren) {
                this.expandChildNodes(!this.expanded);
            }
            else if (!this.selected) {
                this.selected = true;
                this.titleBar.backgroundColor(Color.PanelElement);
            }
        });
        this.childContainer = VerticalContainer()
            .paddingLeft(this.expandIconWidth)
            .paddingBottom(2)
            .style({ display: 'none' });
        this.append(this.titleBar, this.childContainer);
    }
    deselect() {
        this.selected = false;
        this.titleBar.backgroundColor('transparent');
    }
    expandChildNodes(expanded) {
        this.expanded = expanded;
        this.childContainer.node.style.display = this.expanded ? 'flex' : 'none';
        this.expandIcon.textContent(this.expandIconChar);
        if (this.expanded && !this.childNodes) {
            this.childNodes = this.getChildNodes();
            this.childContainer.append(...this.childNodes);
        }
        return this;
    }
    get expandIconChar() { return this.expanded ? '⌵' : '>'; }
}
export class ControllerNavigatorView extends NodeElement {
    constructor(controller) {
        super('div');
        this.controller = controller;
    }
}
