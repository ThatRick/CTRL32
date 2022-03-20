import { PanelHorizontalResizeHandle } from "../GUI/GUIPointerHandlers.js";
import { HorizontalContainer, VerticalContainer, TextNode, Div } from "../UI/UIElements.js";
import { Colors } from "./Colors.js";
const Toolbar = HorizontalContainer().id('Toolbar')
    .style({
    backgroundColor: Colors.Bar,
    borderTop: '1px solid ' + Colors.BorderLight,
    borderBottom: '1px solid ' + Colors.BorderDark,
    columnGap: '4px',
    padding: '4px'
})
    .append(TextNode('CONTROL-32 IDE').color('#DDDDAA'));
const SidePanel = VerticalContainer().id('SidePanel')
    .style({
    backgroundColor: Colors.Panel,
    width: '200px',
    borderRight: '1px solid ' + Colors.BorderDark,
    position: 'relative',
    zIndex: '9',
    overflowX: 'visible'
});
Div().id('SidePanelResizeHandle')
    .style({
    backgroundColor: Colors.Selection,
    position: 'absolute',
    height: '100%',
    width: '8px',
    right: '-4px',
    opacity: '0'
})
    .setupNode(node => new PanelHorizontalResizeHandle(node, SidePanel.node, 200, 600))
    .appendTo(SidePanel);
const Taskbar = HorizontalContainer()
    .style({
    backgroundColor: Colors.Panel,
    height: '18px',
    borderBottom: '1px solid ' + Colors.BorderDark,
});
const Desktop = Div().id('Desktop')
    .style({
    flexGrow: '1',
    margin: '0px',
    overflowX: 'hidden',
    overflowY: 'hidden',
    backgroundColor: Colors.Base,
    boxSizing: 'border-box',
    position: 'relative',
});
const Root = VerticalContainer().id('Root')
    .style({
    backgroundColor: 'blue',
    color: 'azure',
    height: '100vh',
    margin: '0px',
    fontFamily: 'monospace',
    boxSizing: 'border-box'
})
    .append(Toolbar, HorizontalContainer().id('Workspace').flexGrow()
    .append(SidePanel, VerticalContainer(Taskbar, Desktop).flexGrow(1)));
export const View = {
    Colors,
    Root,
    Toolbar,
    SidePanel,
    Taskbar,
    Desktop,
};
