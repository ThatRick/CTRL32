import { PanelHorizontalResizeHandle } from "../GUI/GUIPointerHandlers.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div } from "../GUI/UIElement.js"
import { Color } from "./Colors.js"

const Toolbar = HorizontalContainer().id('Toolbar')
    .style({
        backgroundColor:    Color.Bar,
        borderTop:          '1px solid ' + Color.BorderLight,
        borderBottom:       '1px solid ' + Color.BorderDark,
        columnGap:          '4px',
        padding:            '4px'
    })
    .append(
        TextNode('CONTROL-32 IDE').color('#DDDDAA'),
    )

const SidePanel = VerticalContainer().id('SidePanel')
    .style({
        backgroundColor:    Color.Panel,
        width:              '200px',
        borderRight:        '1px solid ' + Color.BorderDark,
        position:           'relative',
        zIndex:             '9',
        overflowX:          'visible'
    })

Div().id('SidePanelResizeHandle')
    .style({
        backgroundColor:    Color.Selection,
        position:           'absolute',
        height:             '100%',
        width:              '8px',
        right:              '-4px',
        opacity:            '0'
    })
    .setupNode(node => new PanelHorizontalResizeHandle(node, SidePanel.node, 200, 600))
    .appendTo(SidePanel)


const Desktop = Div().id('Desktop')
    .style({
        flexGrow:           '1',
        margin:             '0px',
        overflowX:          'hidden',
        overflowY:          'hidden',
        backgroundColor:    Color.Base,
        boxSizing:          'border-box',
        position:           'relative',
    })

const Root = VerticalContainer().id('Root')
    .style({
        backgroundColor:    'blue',
        color:              'azure',
        height:             '100vh',
        margin:             '0px',
        fontFamily:         'monospace',
        boxSizing:          'border-box'
    })
    .append(
        Toolbar,
        HorizontalContainer().id('Workspace')
            .style({ flexGrow: '1' })
            .append(
                SidePanel,
                Desktop
            )
    )

export const MainView = {
    Color,
    Root,
        Toolbar,
        SidePanel, Desktop,
}