import { VerticalContainer, TextNode, UIElement } from "../GUI/UIElement.js";
import { Color } from "./Colors.js";
export class PanelElementView extends UIElement {
    constructor(titleText, userContent) {
        super('div');
        this.style({
            backgroundColor: Color.PanelElement,
            borderTop: '1px solid ' + Color.BorderLight,
            borderBottom: '1px solid ' + Color.BorderDark,
        });
        this.header = TextNode(titleText).backgroundColor(Color.PanelElementHeader)
            .style({ paddingLeft: '4px' });
        this.userContainer = VerticalContainer()
            .style({
            padding: '4px',
            rowGap: '2px'
        });
        this.content(this.header, this.userContainer);
        if (userContent)
            this.setUserContent(userContent);
    }
    setUserContent(userContent) {
        this.userContainer.contentNodes(userContent);
        this.userContent = userContent;
    }
}
