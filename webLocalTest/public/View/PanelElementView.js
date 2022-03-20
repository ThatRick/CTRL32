import { HorizontalContainer, VerticalContainer, TextNode, NodeElement } from "../UI/UIElements.js";
import { Colors } from "./Colors.js";
export class PanelElementView extends NodeElement {
    constructor(titleText, config = {}) {
        super('div');
        this.hidden = false;
        this.backgroundColor(Colors.PanelElement);
        this.hideIcon = TextNode('⌵').width(11).paddingHorizontal(2);
        this.titleName = TextNode(titleText).paddingRight(6).color('white');
        this.status = TextNode(config.statusText ?? '').flexGrow();
        if (config.statusColor)
            this.status.node.style.color = config.statusColor;
        this.titleBar = HorizontalContainer(this.hideIcon, this.titleName, this.status)
            .style({
            userSelect: 'none',
            borderTop: '1px solid ' + Colors.BorderLight,
            borderBottom: '1px solid ' + Colors.BorderDark,
        })
            .backgroundColor(Colors.PanelElementHeader)
            .onClick(() => this.setHidden(!this.hidden));
        if (config.closable)
            this.titleBar.append(TextNode('✕').paddingHorizontal(4)
                .color(Colors.SecondaryText)
                .onClick(() => this.remove()));
        this.userContainer = VerticalContainer().padding(4).flexGrow();
        this.append(this.titleBar, this.userContainer);
        if (config.userContent)
            this.setUserContent(config.userContent);
        if (config.onHideChanged)
            this.onHideChanged = config.onHideChanged;
    }
    setHidden(hidden) {
        this.hidden = hidden;
        this.userContainer.node.style.display = this.hidden ? 'none' : 'flex';
        this.hideIcon.textContent(this.hidden ? '>' : '⌵'); // ⏷:⏵ - 🞂:🞃 - ⯈:⯆ - >:⌵
        this.onHideChanged?.(this.hidden);
        return this;
    }
    setUserContent(userContent) {
        this.userContainer.appendNodes(userContent);
        this.userContent = userContent;
        return this;
    }
    setStatus(text) {
        this.status.textContent(text);
        return this;
    }
}
