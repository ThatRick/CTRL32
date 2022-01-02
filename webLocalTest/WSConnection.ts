
export class WSConnection {
    private setStatus(text: string) { this.onSetStatus?.(text) }
    private consoleLine(text: string) { this.onConsoleLine?.(text) }
    private ws: WebSocket
    private hostIP: string
    private hostAddr: string

    constructor(hostIP: string) {
        const hostAddr = 'ws://' + hostIP + '/ws'
        const ws = new WebSocket(hostAddr)

        ws.binaryType = 'arraybuffer'
        
        this.setStatus("Connecting to " + hostAddr)
        
        ws.onopen = () => this.setStatus("Connected to " + this.hostAddr)
        
        ws.onerror = (ev: Event) => {
            const text = `Websocket error [${hostAddr}] `
            console.error(text, ev)
            this.setStatus(text + ev.type)
        }
        
        ws.onclose = () => {
            this.setStatus(`Disconnected from ${hostAddr}`)
        }

        ws.onmessage = (msg: MessageEvent) => {
            if (typeof msg.data == 'string') {
                this.consoleLine('text: ' + msg.data)
            }
            else if (typeof msg.data == 'object') {
                const data = msg.data as ArrayBuffer
                const text = 'Binary data (' + data.byteLength + ' bytes)'
                this.handleMessageData(data)
            }
            else {
                const text = 'Unknown message type: ' + typeof msg.data
                this.consoleLine(text)
            }
        }

        this.hostIP = hostIP
        this.hostAddr = hostAddr
        this.ws = ws
    }

    send(data: ArrayBuffer) {
        this.ws.send(data)
    }

    onSetStatus: (text: string) => void
    onConsoleLine: (text: string) => void
    handleMessageData: (data: ArrayBuffer) => void

}