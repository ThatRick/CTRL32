export class WebSocketClient
{
    protected _sentBytes = 0
    protected _receivedBytes = 0
    protected _connectionStartTime = 0
    protected _hostIp: string
    protected _ws: WebSocket

    constructor(protected config: {
        onBinaryDataReceived?: (data: ArrayBuffer) => void
        onTextReceived?: (text: string) => void
        onConnected?: () => void
        onDisconnected?: () => void
        onError?: () => void
        address?: string
    }) {

    }

    sendBinaryData(data: ArrayBuffer) {

    }

    sendText(text: string) {

    }

    connect() {

    }

    disconnect() {

    }

    get sendBytes()     { return this._sentBytes }
    get receivedBytes() { return this._receivedBytes }

    get aliveTime()     { return (Date.now() - this._connectionStartTime) / 1000 }

    getHostIp() { return this._hostIp }
    setHostIp(address: string) {

    }

} 