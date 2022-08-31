import { View } from './View/MainView.js'
import { WebSocketClient } from './WebSocketClient.js'
import { WebSocketClientView } from './View/WebSocketClientView.js'
import { C32DataLink } from './C32/C32DataLink.js'
import { C32ControllerView } from './C32/Views/C32ControllerView.js'
import { C32Task } from './C32/C32Task.js'
import { C32TaskView } from './C32/Views/C32TaskView.js'
import { createTestTreeView } from './Test/testTree.js'
import { MovableElement } from './UI/MovableElement.js'
import { vec2 } from './Vector2.js'
import { createMoveHandle, createResizeHandle } from './UI/UIPointerHandlers.js'
import { Button, Div, HorizontalContainer, TextNode, VerticalContainer } from './UI/UIElements.js'
import { backgroundGridStyle } from './UI/UIBackgroundPattern.js'
import { UIBlock } from './ProgramView/UIBlock.js'
import { UIPolyline } from './ProgramView/UIPolyline.js'
import { UIWindow } from './UI/UIWindow.js'
import { UICircuit } from './ProgramView/UICircuit.js'
import { CircuitSource } from './ProgramModel/CircuitSource.js'
import { ProgramSource } from './ProgramModel/Program.js'

document.head.title = 'CONTROL-32 IDE'

document.body.style.margin = '0px'
document.body.appendChild(View.Root.node)

const client = new WebSocketClient()
const clientView = WebSocketClientView(client)

View.SidePanel.append(clientView)

const link = new C32DataLink(client)

View.SidePanel.append(
    createTestTreeView()
)

link.events.subscribeEvents(
{
    controllerLoaded: () => View.SidePanel.append( C32ControllerView(link.controller) ),
})
const snap = vec2(20)
const prog = new ProgramSource()
const circuitSource = new CircuitSource(prog)

const circuitView = new UICircuit(circuitSource, snap)

const testLine = new UIPolyline([vec2(20, 20), vec2(60, 20), vec2(60, 60), vec2(100, 60)], vec2(20, 20), circuitView.node)
testLine.setSelected(true)
testLine.events.subscribe('lineClicked', () => console.log('Polyline emitted click-event'))

const testWindow = new UIWindow(vec2(100, 100), vec2(400, 300), circuitView).titleText('Test Circuit')

View.Desktop.append(
    testWindow
)