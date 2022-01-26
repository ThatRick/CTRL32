import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input } from "../GUI/UIElement.js"
import { WebSocketClient } from "../WebSocketClient.js"
import { Color } from "./Colors.js"
import { PanelElementView } from "./PanelElementView.js"

export function WebSocketClientView(client: WebSocketClient)
{
    const HostInput = Input().type('url')
        .style({ width: '120px' })
        .setupNode(node => {
            node.placeholder = 'host ip'
            node.value = '192.168.0.241'
        })
    const ConnectButton = Button('Open', () => { (!client.connected) ? client.connect(HostInput.node.value) : client.disconnect() })
    const Status = TextNode(client.statusText).style({ paddingBottom: '4px' })
    const SentBytes = TextNode('0 bytes')
    const ReceivedBytes = TextNode('0 bytes')

    client.events.subscribeEvents({
        statusChanged:  () => { Status.textContent(client.statusText) },
        sent:           () => { SentBytes.textContent(`${client.sentBytes} bytes`)},
        received:       () => { ReceivedBytes.textContent(`${client.receivedBytes} bytes`)},
        connected:      () => {
            Status.color('#AAFFAA')
            ConnectButton.textContent('Close')
        },
        disconnected:   () => {
            Status.color('#AAAAAA')
            ConnectButton.textContent('Open')
        },
        error:          () => { Status.color('#FFAAAA') },
    })

    const Content = VerticalContainer(
        HorizontalContainer( HostInput, ConnectButton ).style({ flexWrap: 'wrap' }),
        Status,
        HorizontalContainer( TextNode('Sent:'), SentBytes).style({ justifyContent: 'space-between' }),
        HorizontalContainer( TextNode('Received:'), ReceivedBytes).style({ justifyContent: 'space-between' }),
    )
    
    return new PanelElementView('Web Socket Link', Content.node)
}