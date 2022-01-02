export class WSConnection {
    constructor(hostIP) {
        const hostAddr = 'ws://' + hostIP + '/ws';
        const ws = new WebSocket(hostAddr);
        ws.binaryType = 'arraybuffer';
        this.setStatus("Connecting to " + hostAddr);
        ws.onopen = () => this.setStatus("Connected to " + this.hostAddr);
        ws.onerror = (ev) => {
            const text = `Websocket error [${hostAddr}] `;
            console.error(text, ev);
            this.setStatus(text + ev.type);
        };
        ws.onclose = () => {
            this.setStatus(`Disconnected from ${hostAddr}`);
        };
        ws.onmessage = (msg) => {
            if (typeof msg.data == 'string') {
                this.consoleLine('text: ' + msg.data);
            }
            else if (typeof msg.data == 'object') {
                const data = msg.data;
                const text = 'Binary data (' + data.byteLength + ' bytes)';
                this.handleMessageData(data);
            }
            else {
                const text = 'Unknown message type: ' + typeof msg.data;
                this.consoleLine(text);
            }
        };
        this.hostIP = hostIP;
        this.hostAddr = hostAddr;
        this.ws = ws;
    }
    setStatus(text) { var _a; (_a = this.onSetStatus) === null || _a === void 0 ? void 0 : _a.call(this, text); }
    consoleLine(text) { var _a; (_a = this.onConsoleLine) === null || _a === void 0 ? void 0 : _a.call(this, text); }
    send(data) {
        this.ws.send(data);
    }
}
