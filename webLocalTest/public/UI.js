import { vec2 } from './Util.js';
import { backgroundGridStyle, htmlElement } from './HTML.js';
import { GUIDynamicElement, GUIManager, GUIWindow } from './GUI/GUI.js';
import { DataViewer } from './DataViewer.js';
import { Console } from './UI/UIConsole.js';
import { ObjectView } from './UI/UIObjectView.js';
import { LineGraph } from './LineGraph.js';
import { Button, Checkbox } from './GUI/UIElement.js';
import { MoveHandle } from './GUI/GUIPointerHandlers.js';
export { ObjectView };
let gui;
const UI = {
    connectionStatus: document.getElementById('connectionStatus'),
    connectionControls: document.getElementById('connectionControls'),
    consoleControls: document.getElementById('consoleControls'),
    panel: document.getElementById('panel'),
    desktop: document.getElementById('desktop'),
};
function setStatus(text) { UI.connectionStatus.textContent = text; }
const popupPos = vec2(200, 200);
const popupOffset = vec2(100, 40);
function createObjectView(data, title) {
    const objView = new ObjectView(data);
    new GUIWindow(popupPos, gui, { content: objView.node, title, autoSize: true, noStatusBar: true });
    popupPos.add(popupOffset);
    return objView;
}
function createDataView(data, title = 'Data Viewer') {
    const dataViewer = new DataViewer();
    dataViewer.setData(data);
    new GUIWindow(vec2(100, 400), gui, { content: dataViewer.node, autoSize: true, title });
    return dataViewer;
}
export function CreateUI() {
    // Check that all node elements are found in document
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem)
            console.error(`UI Element '${key}' not found`);
    });
    // Create a graphical user interface manager
    gui = new GUIManager(UI.desktop, { width: '100%', height: '100%' });
    // Create a console log window
    const log = new Console();
    new GUIWindow(vec2(100, 400), gui, { title: 'Console', content: log.node, size: vec2(700, 300), scrollbars: true })
        .classList('console')
        .setup(elem => elem.userControls.content(Button('Clear', log.clear), Checkbox('auto scroll', toggled => {
        log.autoScroll = toggled;
        if (toggled)
            log.scrollToEnd();
    })));
    log.line('Hello World!');
    // Create a circuit window
    const circuitGUI = new GUIManager(null, {
        width: '800px', height: '600px',
        position: 'relative',
        backgroundColor: '#446',
        boxSizing: 'border-box',
        ...backgroundGridStyle(vec2(14, 14), '#556'),
    });
    //circuitGUI.setScale(0.5)
    new GUIWindow(vec2(200, 300), gui, { title: 'Circuit', content: circuitGUI.node, size: vec2(500, 400), scrollbars: true });
    // Populate circuit window with test elements
    for (let i = 0; i < 4; i++) {
        new GUIDynamicElement(vec2(100 * i), vec2(200, 200), circuitGUI)
            .backgroundColor('dimgrey')
            .style({ border: 'solid 1px grey', boxSizing: 'border-box' })
            .setup(elem => new MoveHandle(elem.node, elem));
    }
    createTestSet(gui);
    return {
        setStatus,
        log,
        createObjectView,
        createDataView,
        connectionControls: UI.connectionControls,
        consoleControls: UI.consoleControls,
    };
}
// GUI Test
function createTestSet(gui) {
    const textArea = htmlElement('textarea', {
        textContent: `
Processors:
    CPU: Xtensa dual-core (or single-core) 32-bit LX6 microprocessor, operating at 160 or 240 MHz and performing at up to 600 DMIPS
    Ultra low power (ULP) co-processor
Memory: 320 KiB RAM, 448 KiB ROM
Wireless connectivity:
    Wi-Fi: 802.11 b/g/n
    Bluetooth: v4.2 BR/EDR and BLE (shares the radio with Wi-Fi)
`,
        style: {
            backgroundColor: 'Cornsilk',
            width: '100%', height: '100%',
            boxSizing: 'border-box',
            resize: 'none'
        }
    });
    const textWindow = new GUIWindow(vec2(100, 100), gui, { content: textArea, autoSize: true, noStatusBar: true, title: 'ESP32 info' });
    const graph = new LineGraph(400, 300);
    setTimeout(() => {
        console.log(graph.canvas);
        const trendWindow = new GUIWindow(vec2(420, 100), gui, { content: graph.canvas, autoSize: true, title: 'Sine wave' });
    });
    setInterval(() => {
        const value = (Math.sin(Date.now() / 2000) * 0.4 + 0.5);
        graph.addValue(value);
    }, 100);
}
