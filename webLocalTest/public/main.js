import { MainView as View } from './View/MainView.js';
import { WebSocketClient } from './WebSocketClient.js';
import { WebSocketClientView } from './View/WebSocketClientView.js';
import { C32DataLink } from './C32/C32DataLink.js';
import { C32ControllerView } from './C32/Views/C32ControllerView.js';
document.head.title = 'CONTROL-32 IDE';
document.body.style.margin = '0px';
document.body.appendChild(View.Root.node);
const client = new WebSocketClient();
const clientView = WebSocketClientView(client);
View.SidePanel.append(clientView);
const link = new C32DataLink(client);
link.events.subscribeEvents({
    controllerLoaded: () => View.SidePanel.append(C32ControllerView(link.controller)),
});
