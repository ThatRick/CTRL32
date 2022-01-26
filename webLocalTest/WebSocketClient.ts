import { EventEmitter } from "./Events.js"

export class WebSocketClient
{
    protected _ws: WebSocket
    protected _hostIp: string
    protected _status = ''
    protected _sentBytes = 0
    protected _receivedBytes = 0
    protected _connectionStartTime = 0

    protected setStatus(status: string) {
        this._status = status
        this.events.emit('statusChanged')
    }

    protected onopen(ev: MessageEvent) {
        this.events.emit('connected')
        this._connectionStartTime = Date.now()
    }

    protected onclose(ev: CloseEvent) {
        this.events.emit('disconnected')
    }

    protected onerror(ev: MessageEvent) {
        this.events.emit('error')
    }

    protected onmessage(ev: MessageEvent) {
        if (typeof ev.data == 'string') {
            this._receivedBytes += ev.data.length
            this.config.onTextReceived?.(ev.data)
        }
        else if (typeof ev.data == 'object') {
            const data = ev.data as ArrayBuffer
            this._receivedBytes += data.byteLength
            this.config.onBinaryDataReceived?.(data)
        }
        else {
            console.error('Unknown message data type:', typeof ev.data)
        }
        this.events.emit('received')
    }

    constructor(protected config: {
        onBinaryDataReceived?: (data: ArrayBuffer) => void
        onTextReceived?: (text: string) => void
        address?: string
    }) {
        if (config.address) this.setHostIp(config.address)
    }

    sendBinaryData(data: ArrayBuffer) {
        if (this._ws.readyState == WebSocket.OPEN) {
            this._sentBytes += data.byteLength
            this._ws.send(data)
            this.events.emit('sent')
        }
    }

    sendText(text: string) {
        if (this._ws.readyState == WebSocket.OPEN) {
            this._sentBytes += text.length
            this._ws.send(text)
            this.events.emit('sent')
        }
    }

    connect() {
        if (!this._hostIp) return

        this.setStatus("Connecting to " + this._hostIp)
        const ws = new WebSocket(this._hostIp)
        ws.binaryType = 'arraybuffer'
        
        ws.onmessage = this.onmessage
        ws.onopen = this.onopen
        ws.onclose = this.onclose
        ws.onerror = this.onerror

        this._ws = ws
    }

    disconnect() {
        this._ws.close()
    }

    setHostIp(address: string) {
        this._hostIp = address
        this.events.emit('hostIpChanged')
    }

    get statusText()    { return this._status }
    get hostIp()        { return this._hostIp }

    get sendBytes()     { return this._sentBytes }
    get receivedBytes() { return this._receivedBytes }

    get aliveTime()     { return (Date.now() - this._connectionStartTime) / 1000 }

    events = new EventEmitter<typeof this, 'connected' | 'disconnected' | 'error' | 'received' | 'sent' | 'statusChanged' | 'hostIpChanged'>(this)
} 