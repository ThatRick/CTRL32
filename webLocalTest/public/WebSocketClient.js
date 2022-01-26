import { EventEmitter } from "./Events.js";
export class WebSocketClient {
    constructor() {
        this.events = new EventEmitter(this);
        this._status = 'Offline';
        this._sentBytes = 0;
        this._receivedBytes = 0;
        this._connectionStartTime = 0;
        this._connected = false;
        this.onopen = (ev) => {
            this._connectionStartTime = Date.now();
            this._connected = true;
            this.setStatus(`Online: ${this.hostAddr}`);
            this.events.emit('connected');
        };
        this.onclose = (ev) => {
            this._connected = false;
            this.setStatus(`Offline`);
            this.events.emit('disconnected');
        };
        this.onerror = (ev) => {
            this._connected = false;
            this.setStatus(`Error: ${this.hostAddr}`);
            this.events.emit('error');
        };
        this.onmessage = (ev) => {
            if (typeof ev.data == 'string') {
                this._receivedBytes += ev.data.length;
                this.onTextReceived?.(ev.data);
            }
            else if (typeof ev.data == 'object') {
                const data = ev.data;
                this._receivedBytes += data.byteLength;
                this.onBinaryDataReceived?.(data);
            }
            else {
                console.error('Unknown message data type:', typeof ev.data);
            }
            this.events.emit('received');
        };
    }
    get statusText() { return this._status; }
    get hostAddr() { return this._hostAddr; }
    get sentBytes() { return this._sentBytes; }
    get receivedBytes() { return this._receivedBytes; }
    get aliveTime() { return (Date.now() - this._connectionStartTime) / 1000; }
    get connected() { return this._connected; }
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
    connect(hostIp) {
        this._hostAddr = hostIp;
        const url = 'ws://' + hostIp + '/ws';
        this.setStatus('Connecting: ' + this._hostAddr);
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        ws.onmessage = this.onmessage;
        ws.onopen = this.onopen;
        ws.onclose = this.onclose;
        ws.onerror = this.onerror;
        this._ws = ws;
    }
    disconnect() {
        this._ws.close();
        if (!this.connected)
            this.setStatus('Offline');
    }
    setStatus(status) {
        this._status = status;
        this.events.emit('statusChanged');
    }
}
