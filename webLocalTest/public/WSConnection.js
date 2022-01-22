export class WSConnection {
    constructor(hostIP) {
        this.isConnected = false;
        this.onmessage = (msg) => {
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
        this.onopen = () => {
            this.isConnected = true;
            this.setStatus(`Connected (${this.hostAddr})`);
        };
        this.onclose = () => {
            this.isConnected = false;
            this.setStatus(`Disconnected`);
        };
        this.onerror = (ev) => {
            this.isConnected = (this.ws.readyState == WebSocket.OPEN);
            const text = `Error (${this.hostAddr}) `;
            console.error(text, ev);
            this.setStatus(text + ev.type);
        };
        this.connect = () => {
            this.setStatus("Connecting to " + this.hostAddr);
            let ws = new WebSocket(this.hostAddr);
            ws.binaryType = 'arraybuffer';
            ws.onmessage = this.onmessage;
            ws.onopen = this.onopen;
            ws.onclose = this.onclose;
            ws.onerror = this.onerror;
            this.ws = ws;
        };
        this.disconnect = () => {
            this.ws.close();
        };
        this.hostIP = hostIP;
        this.hostAddr = 'ws://' + hostIP + '/ws';
        // this.connect()
    }
    setStatus(text) { this.onSetStatus?.(text); }
    consoleLine(text) { this.onConsoleLine?.(text); }
    send(data) {
        if (this.ws.readyState == WebSocket.OPEN)
            this.ws.send(data);
    }
}
