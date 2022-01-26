import { EventEmitter } from "./Events.js";
export class WebSocketClient {
    constructor(config) {
        this.config = config;
        this._status = '';
        this._sentBytes = 0;
        this._receivedBytes = 0;
        this._connectionStartTime = 0;
        this.events = new EventEmitter(this);
        if (config.address)
            this.setHostIp(config.address);
    }
    setStatus(status) {
        this._status = status;
        this.events.emit('statusChanged');
    }
    onopen(ev) {
        this.events.emit('connected');
        this._connectionStartTime = Date.now();
    }
    onclose(ev) {
        this.events.emit('disconnected');
    }
    onerror(ev) {
        this.events.emit('error');
    }
    onmessage(ev) {
        if (typeof ev.data == 'string') {
            this._receivedBytes += ev.data.length;
            this.config.onTextReceived?.(ev.data);
        }
        else if (typeof ev.data == 'object') {
            const data = ev.data;
            this._receivedBytes += data.byteLength;
            this.config.onBinaryDataReceived?.(data);
        }
        else {
            console.error('Unknown message data type:', typeof ev.data);
        }
        this.events.emit('received');
    }
    sendBinaryData(data) {
        if (this._ws.readyState == WebSocket.OPEN) {
            this._sentBytes += data.byteLength;
            this._ws.send(data);
            this.events.emit('sent');
        }
    }
    sendText(text) {
        if (this._ws.readyState == WebSocket.OPEN) {
            this._sentBytes += text.length;
            this._ws.send(text);
            this.events.emit('sent');
        }
    }
    connect() {
        if (!this._hostIp)
            return;
        this.setStatus("Connecting to " + this._hostIp);
        const ws = new WebSocket(this._hostIp);
        ws.binaryType = 'arraybuffer';
        ws.onmessage = this.onmessage;
        ws.onopen = this.onopen;
        ws.onclose = this.onclose;
        ws.onerror = this.onerror;
        this._ws = ws;
    }
    disconnect() {
        this._ws.close();
    }
    setHostIp(address) {
        this._hostIp = address;
        this.events.emit('hostIpChanged');
    }
    get statusText() { return this._status; }
    get hostIp() { return this._hostIp; }
    get sendBytes() { return this._sentBytes; }
    get receivedBytes() { return this._receivedBytes; }
    get aliveTime() { return (Date.now() - this._connectionStartTime) / 1000; }
}
