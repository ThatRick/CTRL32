
export class WSConnection {
    private setStatus(text: string) { this.onSetStatus?.(text) }
    private consoleLine(text: string) { this.onConsoleLine?.(text) }
    private ws: WebSocket
    private hostIP: string
    private hostAddr: string
    private isConnected = false

    private onmessage = (msg: MessageEvent) => {
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

    private onopen = () => {
        this.isConnected = true
        this.setStatus(`Connected (${this.hostAddr})`)
    }

    private onclose = () => {
        this.isConnected = false
        this.setStatus(`Disconnected`)
    }

    private onerror = (ev: Event) => {
        this.isConnected = (this.ws.readyState == WebSocket.OPEN)
        const text = `Error (${this.hostAddr}) `
        console.error(text, ev)
        this.setStatus(text + ev.type)
    }

    constructor(hostIP: string) {
        this.hostIP = hostIP
        this.hostAddr = 'ws://' + hostIP + '/ws'
        this.connect()
    }

    connect = () => {
        this.setStatus("Connecting to " + this.hostAddr)
        let ws = new WebSocket(this.hostAddr)
        ws.binaryType = 'arraybuffer'
        
        ws.onmessage = this.onmessage
        ws.onopen = this.onopen
        ws.onclose = this.onclose
        ws.onerror = this.onerror

        this.ws = ws
    }

    disconnect = () => {
        this.ws.close()
    }

    send(data: ArrayBuffer) {
        if (this.ws.readyState == WebSocket.OPEN) this.ws.send(data)
    }

    onSetStatus: (text: string) => void
    onConsoleLine: (text: string) => void
    handleMessageData: (data: ArrayBuffer) => void

}