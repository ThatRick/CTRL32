import Vec2, { vec2 } from '../Vector2.js';
import { GUIDynamicElement } from './GUIDynamicElement.js';
import { MoveHandle, ResizeHandle } from './GUIPointerHandlers.js';
import { Button, Div, TextNode } from './UIElement.js';
const windowStyle = {
    backgroundColor: 'DimGray',
    border: 'solid Gray 1px',
    borderRadius: '3px',
    display: 'flex',
    flexDirection: 'column',
};
const barStyle = {
    backgroundColor: 'Gray',
    color: 'White',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
};
const userContentStyle = {
    color: 'White',
    flexGrow: '1',
    margin: '0px',
    padding: '0px',
};
const buttonStyle = {
    padding: '0px 3px',
    borderWidth: '1px',
    borderRadius: '3px',
    height: '20px',
    backgroundColor: 'Silver',
    lineHeight: '0px'
};
export class GUIWindow extends GUIDynamicElement {
    constructor(pos, gui, options) {
        super(pos, options.size ?? vec2(300, 300), gui);
        this.options = options;
        this.style(windowStyle);
        this.append(Div(TextNode(options.title || 'GUIWindow')
            .style({ flexGrow: '1', padding: '0px 3px' })
            .setupNode(node => new MoveHandle(node, this)), Button('◰', () => this.resizeToContent())
            .style(buttonStyle), Button('✕', () => this.remove())
            .style(buttonStyle)
            .color('FireBrick'))
            .style(barStyle), Div()
            .setup(elem => this.userContainer = elem)
            .style({
            ...userContentStyle,
            overflow: options.scrollbars ? 'auto' : 'hidden',
        }));
        if (options.noStatusBar) {
            this.append(TextNode('⋰')
                .style({
                padding: '0px 3px',
                position: 'absolute',
                right: '0px',
                bottom: '0px'
            })
                .setupNode(node => new ResizeHandle(node, this)));
        }
        else {
            this.append(Div(Div()
                .setup(elem => this.userControls = elem)
                .style({
                display: 'flex',
                flexGrow: '1'
            }), Div().setup(elem => this.status = elem), TextNode('⋰')
                .style({ padding: '0px 3px' })
                .setupNode(node => new ResizeHandle(node, this)))
                .style({
                ...barStyle,
                justifyContent: 'space-between',
            }));
            this.didResize = () => {
                this.status.textContent(this.userContentSize.toString());
            };
        }
        if (options.content) {
            this.setContent(options.content);
        }
    }
    setContent(content) {
        content.style.boxSizing = 'border-box';
        this.userContainer.appendNodes(content);
        this.userContent = content;
        if (this.options.autoSize)
            setTimeout(() => this.resizeToContent(), 100);
    }
    resizeToContent() {
        const contentSize = this.userContentSize;
        const visibleSize = vec2(this.userContainer.node.clientWidth, this.userContainer.node.clientHeight);
        console.log('contentSize', contentSize);
        console.log('visible', visibleSize);
        console.log('clientRect', this.userContentSize);
        const hiddenSize = Vec2.sub(contentSize, visibleSize);
        const newSize = Vec2.add(this.currentSize, hiddenSize).limit(vec2(200, 40));
        this.setSize(newSize);
    }
    get userContentSize() {
        const box = this.userContent.getBoundingClientRect();
        return vec2(box.width, box.height);
    }
}
