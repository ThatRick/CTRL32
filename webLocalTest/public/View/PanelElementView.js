import { HorizontalContainer, VerticalContainer, TextNode, UIElement } from "../GUI/UIElement.js";
import { Color } from "./Colors.js";
export class PanelElementView extends UIElement {
    constructor(titleText, userContent) {
        super('div');
        this.hidden = false;
        this.style({
            backgroundColor: Color.PanelElement,
            borderTop: '1px solid ' + Color.BorderLight,
            borderBottom: '1px solid ' + Color.BorderDark,
        });
        this.hideIcon = TextNode('⌵').width(11).paddingRight(2);
        this.titleName = TextNode(titleText).paddingRight(6).color('white');
        this.status = TextNode('').flexGrow();
        this.titleBar = HorizontalContainer(this.hideIcon, this.titleName, this.status)
            .style({ userSelect: 'none' })
            .backgroundColor(Color.PanelElementHeader)
            .onClick(() => {
            this.hidden = !this.hidden;
            this.userContainer.node.style.display = this.hidden ? 'none' : 'flex';
            this.hideIcon.textContent(this.hidden ? '>' : '⌵'); // ⏷:⏵ - 🞂:🞃 - ⯈:⯆ - >:⌵
            this.onHideChanged?.(this.hidden);
        });
        this.userContainer = VerticalContainer().padding(4)
            .style({ rowGap: '2px' });
        this.content(this.titleBar, this.userContainer);
        if (userContent)
            this.setUserContent(userContent);
    }
    setUserContent(userContent) {
        this.userContainer.contentNodes(userContent);
        this.userContent = userContent;
    }
    setStatus(text) {
        this.status.textContent(text);
    }
}
