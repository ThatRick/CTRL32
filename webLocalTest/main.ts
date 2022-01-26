import { MainView as View } from './View/MainView.js'
import { WebSocketClient } from './WebSocketClient.js'
import { WebSocketClientView } from './View/WebSocketClientView.js'
import { C32DataLink } from './C32/C32DataLink.js'

document.head.title = 'CONTROL-32 IDE'

document.body.style.margin = '0px'
document.body.appendChild(View.Root.node)

const client = new WebSocketClient()
const clientView = WebSocketClientView(client)

View.SidePanel.content(clientView)

const link = new C32DataLink(client)
