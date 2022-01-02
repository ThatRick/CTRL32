import GraphCanvas from './OnlineTrendGraph.js'
import {readStruct, DataType} from './TypedStructs.js'

const WS_MSG_HEADER_SIZE = 4

const enum WS_MSG_TYPE {
    NULL,
    MEAS,
    INTENSITY_GRAPH,
    CONFIG,
    SET_CONFIG
};

const UI = {
    status:         document.getElementById('status') as HTMLParagraphElement,
    pulseCount:     document.getElementById('pulseCount') as HTMLParagraphElement,
    pulseInterval:  document.getElementById('interval') as HTMLParagraphElement,
    graph:          document.getElementById('graph') as HTMLDivElement,
    graphInfo:      document.getElementById('graphInfo') as HTMLParagraphElement,
    console:        document.getElementById('console') as HTMLPreElement
}

Object.entries(UI).forEach(([key, elem]) => {
    if (!elem) console.error(`UI Element '${key}' not found`)
});

const graph = new GraphCanvas(1024, 480)

UI.graph.appendChild(graph.canvas)

const graphDataBuffer: Array<number> = []

let lastGraphDataReceivedTime = 0
const graphDataPointInterval_ms = 10
const graphDataTransmitInterval_ms = 1000
const graphDataPointsPerTransmit = graphDataTransmitInterval_ms / graphDataPointInterval_ms

function updateGraph(now: number) {
    const elapsed_ms = Date.now() - lastGraphDataReceivedTime
    const timeLeft_ms = graphDataTransmitInterval_ms - elapsed_ms;
    
    const targetDataPointsLeft = Math.round(graphDataPointsPerTransmit * (timeLeft_ms / graphDataTransmitInterval_ms))
    let shiftCount = Math.max(graphDataBuffer.length - targetDataPointsLeft, 0)
    UI.console.textContent = `now: ${now} last: ${lastGraphDataReceivedTime} left: ${timeLeft_ms} target: ${targetDataPointsLeft}`
    while (graphDataBuffer.length > 0 && shiftCount > 0) {
        const value = graphDataBuffer.shift()! / 255
        graph.addValue(value);
        shiftCount--
    }
    requestAnimationFrame(updateGraph)
}

requestAnimationFrame(updateGraph)

const host_ip = '192.168.0.231'
const host_addr = 'ws://' + host_ip + '/ws'

const ws = new WebSocket(host_addr)
ws.binaryType = 'arraybuffer'
UI.status.textContent = "Connecting to " + host_addr
ws.onopen = () => startCommunication(ws)
ws.onerror = (ev: Event) => {
    const text = `Websocket error [${host_addr}] `
    console.error(text, ev)
    UI.status.textContent = text + ev.type
}
ws.onclose = () => {
    const text = `Disconnected from ${host_addr}`
    console.log(text)
    UI.status.textContent = text
}

function startCommunication(ws: WebSocket) {
    UI.status.textContent = "Connected to " + host_addr
    
    ws.onmessage = (msg: MessageEvent) => {
        if (typeof msg.data == 'string') {
            //console.log('Message: ' + msg.data)
            UI.console.textContent += msg.data + '\n'
        }
        else if (typeof msg.data == 'object') {
            const data = msg.data as ArrayBuffer
            const text = 'Binary data (' + data.byteLength + ' bytes)'
            console.log(text)
            //UI.console.textContent += text + '\n'
            handleMessageData(data)
        }
        else {
            const text = 'Unknown message type: ' + typeof msg.data
            console.log(text)
            UI.console.textContent += text + '\n'
        }
    }
}

function handleMessageData(dataBuffer: ArrayBuffer) {
    const header = new Uint8Array(dataBuffer.slice(0, WS_MSG_HEADER_SIZE))
    const data = dataBuffer.slice(WS_MSG_HEADER_SIZE)
    const msgType = header[0]

    switch (msgType)
    {
        case WS_MSG_TYPE.MEAS:
        {
            const meas = readStruct(data, 0, {
                pulseCount:     DataType.uint32,
                pulseInterval:  DataType.float
            })
            const interval_s = meas.pulseInterval / 1_000_000
            const watts = 3600 / interval_s
            UI.pulseCount.textContent = meas.pulseCount.toString()
            UI.pulseInterval.textContent = `Power ${Math.round(watts)} W (pulse interval ${interval_s.toPrecision(2)} s)`

            break
        }
        case WS_MSG_TYPE.INTENSITY_GRAPH:
        {
            const values = new Uint8Array(data)
            //UI.console.textContent += values.toString() + '\n'
            UI.graphInfo.textContent = `Graph buffer size: ${graphDataBuffer.length}`
            lastGraphDataReceivedTime = Date.now()
            graphDataBuffer.push(...values)
        }
    }
}