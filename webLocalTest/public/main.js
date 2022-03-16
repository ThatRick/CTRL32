import { MainView as View } from './View/MainView.js';
import { WebSocketClient } from './WebSocketClient.js';
import { WebSocketClientView } from './View/WebSocketClientView.js';
import { C32DataLink } from './C32/C32DataLink.js';
import { C32ControllerView } from './C32/Views/C32ControllerView.js';
import { createTestTreeView } from './Test/testTree.js';
import { MovableElement } from './UI/MovableElement.js';
import { vec2 } from './Vector2.js';
import { MoveHandle, ResizeHandle } from './UI/UIPointerHandlers.js';
import { Button, Div, TextNode } from './UI/UIElements.js';
import { backgroundGridStyle } from './UI/UIBackgroundPattern.js';
import { UIBlock } from './UI/UIBlock.js';
document.head.title = 'CONTROL-32 IDE';
document.body.style.margin = '0px';
document.body.appendChild(View.Root.node);
const client = new WebSocketClient();
const clientView = WebSocketClientView(client);
View.SidePanel.append(clientView);
const link = new C32DataLink(client);
View.SidePanel.append(createTestTreeView());
link.events.subscribeEvents({
    controllerLoaded: () => View.SidePanel.append(C32ControllerView(link.controller)),
});
let selectedBlock;
function elementSelected(elem, ev) {
    ev.stopPropagation();
    if (selectedBlock)
        selectedBlock.setSelected(false);
    selectedBlock = elem;
    selectedBlock.setSelected(true);
}
const blocks = [
    vec2(20, 20),
    vec2(100, 40),
    vec2(20, 100),
].map(pos => new UIBlock(pos).setup(elem => elem.events.subscribe('clicked', elementSelected)));
const gridView = Div(...blocks)
    .style({
    overflow: 'auto',
    position: 'relative',
    ...backgroundGridStyle(vec2(20), View.Color.PanelElementHeader),
});
const testWindow = new MovableElement(vec2(100, 100), vec2(200, 200))
    .flexContainer('vertical')
    .backgroundColor(View.Color.Panel)
    .setSizeSnap(vec2(20))
    .setup(elem => {
    elem.append(MoveHandle(elem).style({
        width: '100%',
        height: '20px',
        backgroundColor: View.Color.PanelElementHeader
    }).append(TextNode('Test Window').padding(2).userSelect('none'), Button('X', () => elem.remove())
        .userSelect('none')
        .style({
        position: 'absolute',
        right: '0px', top: '0px',
        backgroundColor: 'red', color: 'white'
    })), gridView.flexGrow(), ResizeHandle(elem).style({
        width: '20px', height: '20px',
        position: 'absolute',
        bottom: '0px', right: '0px',
        backgroundColor: View.Color.PanelElement,
    }));
    elem.events.subscribe('clicked', () => selectedBlock?.setSelected(false));
});
View.Desktop.append(testWindow);
