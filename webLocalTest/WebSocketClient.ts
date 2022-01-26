import { EventEmitter } from "./Events.js"

export class WebSocketClient
{
    get statusText()    { return this._status }
    get hostAddr()      { return this._hostAddr }

    get sentBytes()     { return this._sentBytes }
    get receivedBytes() { return this._receivedBytes }

    get aliveTime()     { return (Date.now() - this._connectionStartTime) / 1000 }

    get connected()   { return this._connected }

    readonly events = new EventEmitter<typeof this, 'connected' | 'disconnected' | 'error' | 'received' | 'sent' | 'statusChanged'>(this)
    
    constructor() {}

    onTextReceived: (text: string) => void
    onBinaryDataReceived: (data: ArrayBuffer) => void

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

    connect(hostIp: string) {
        this._hostAddr = hostIp

        const url = 'ws://' + hostIp + '/ws'

        this.setStatus('Connecting: ' + this._hostAddr)
        const ws = new WebSocket(url)
        ws.binaryType = 'arraybuffer'
        
        ws.onmessage = this.onmessage
        ws.onopen = this.onopen
        ws.onclose = this.onclose
        ws.onerror = this.onerror

        this._ws = ws
    }

    disconnect() {
        this._ws.close()
        if (!this.connected) this.setStatus('Offline')
    }

    protected _ws: WebSocket
    protected _hostAddr: string
    protected _status = 'Offline'
    protected _sentBytes = 0
    protected _receivedBytes = 0
    protected _connectionStartTime = 0
    protected _connected = false

    protected setStatus(status: string) {
        this._status = status
        this.events.emit('statusChanged')
    }

    protected onopen = (ev: MessageEvent) => {
        this._connectionStartTime = Date.now()
        this._connected = true
        this.setStatus(`Online: ${this.hostAddr}`)
        this.events.emit('connected')
    }

    protected onclose = (ev: CloseEvent) => {
        this._connected = false
        this.setStatus(`Offline`)
        this.events.emit('disconnected')
    }

    protected onerror = (ev: MessageEvent) => {
        this._connected = false
        this.setStatus(`Error: ${this.hostAddr}`)
        this.events.emit('error')
    }

    protected onmessage = (ev: MessageEvent) => {
        if (typeof ev.data == 'string') {
            this._receivedBytes += ev.data.length
            this.onTextReceived?.(ev.data)
        }
        else if (typeof ev.data == 'object') {
            const data = ev.data as ArrayBuffer
            this._receivedBytes += data.byteLength
            this.onBinaryDataReceived?.(data)
        }
        else {
            console.error('Unknown message data type:', typeof ev.data)
        }
        this.events.emit('received')
    }
} 