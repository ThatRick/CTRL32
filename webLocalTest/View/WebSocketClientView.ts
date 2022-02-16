import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, TableCell, Table, TableRow } from "../GUI/UIElements.js"
import { WebSocketClient } from "../WebSocketClient.js"
import { PanelElementView } from "./PanelElementView.js"
import { valueWithSeparators } from "../Util.js"
import { Color } from "./Colors.js"

export function WebSocketClientView(client: WebSocketClient)
{
    const HostInput = Input('url').width(0).flexGrow()
        .setupNode(node => {
            node.placeholder = 'host ip'
            node.value = '192.168.0.241'
        })
    const ConnectButton = Button('Connect', () => {
        (!client.connected) ? client.connect(HostInput.node.value) : client.disconnect()
    })
    const Status        = TextNode('Ready').paddingBottom(6)

    const SentBytes     = TableCell('0').align('right').paddingRight(4).color(Color.PrimaryText).flexGrow()
    const ReceivedBytes = TableCell('0').align('right').paddingRight(4).color(Color.PrimaryText).flexGrow()

    const Content = VerticalContainer(
        HorizontalContainer( HostInput, ConnectButton ),
        HorizontalContainer( Status ),
        Table(
            TableRow( TableCell('Sent'),     SentBytes,     TableCell('bytes') ),
            TableRow( TableCell('Received'), ReceivedBytes, TableCell('bytes') ),
        ).color(Color.SecondaryText)
    )

    const PanelElement = new PanelElementView('WebSocket', {
        userContent:    Content.node,
        statusText:     'Offline',
        statusColor:    '#AAAAAA',
    })


    client.events.subscribeEvents(
    {
        sent:      () => requestAnimationFrame(() => { SentBytes.textContent( valueWithSeparators(client.sentBytes) )} ),
        received:  () => requestAnimationFrame(() => { ReceivedBytes.textContent( valueWithSeparators(client.receivedBytes) )} ),
        connected: () => {
            PanelElement.status.textContent('Online')
            PanelElement.status.color('#AAFFAA')
            ConnectButton.textContent('Close')
            HostInput.node.disabled = true
        },
        disconnected: () => {
            PanelElement.status.textContent('Offline')
            PanelElement.status.color('#AAAAAA')
            ConnectButton.textContent('Connect')
            HostInput.node.disabled = false
        },
        error: () => {
            PanelElement.status.textContent('Error')
            PanelElement.status.color('#FFAAAA')
        },
        statusChanged: () => { Status.textContent(client.statusText)}
    })
    
    return PanelElement
}