import { vec2 } from './Util.js';
import { htmlElement } from './HTML.js';
import { GUIManager, GUIWindow } from './GUI/GUI.js';
import { DataViewer } from './DataViewer.js';
import { Console } from './UI/UIConsole.js';
import { Checkbox } from './UI/UICheckbox.js';
import { ActionButton } from './UI/UIActionButton.js';
import { ObjectView } from './UI/UIObjectView.js';
import { LineGraph } from './LineGraph.js';
export { ActionButton, ObjectView };
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
    const window = new GUIWindow(popupPos, { content: objView.node, title, autoSize: true, noStatusBar: true });
    gui.addElement(window);
    popupPos.add(popupOffset);
    return objView;
}
function createDataView(data, title = 'Data Viewer') {
    const dataViewer = new DataViewer();
    dataViewer.setData(data);
    const dataViewerWindow = new GUIWindow(vec2(100, 400), { content: dataViewer.node, autoSize: true, title });
    gui.addElement(dataViewerWindow);
    return dataViewer;
}
export function CreateUI() {
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem)
            console.error(`UI Element '${key}' not found`);
    });
    gui = new GUIManager(UI.desktop);
    const log = new Console();
    const consoleWindow = new GUIWindow(vec2(100, 400), { size: vec2(700, 300), content: log.node, scrollbars: true, title: 'Console' });
    consoleWindow.userContainer.classList.add('console');
    gui.addElement(consoleWindow);
    log.line('Hello World!');
    const clearButton = new ActionButton(consoleWindow.userControls, 'Clear', log.clear);
    const autoScrollToggle = new Checkbox(consoleWindow.userControls, 'auto scroll', toggled => {
        log.autoScroll = toggled;
        if (toggled)
            log.scrollToEnd();
    });
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
    const textWindow = new GUIWindow(vec2(100, 100), { content: textArea, autoSize: true, noStatusBar: true, title: 'ESP32 info' });
    gui.addElement(textWindow);
    const graph = new LineGraph(400, 300);
    setTimeout(() => {
        console.log(graph.canvas);
        const trendWindow = new GUIWindow(vec2(420, 100), { content: graph.canvas, autoSize: true, title: 'Sine wave' });
        gui.addElement(trendWindow);
    });
    setInterval(() => {
        const value = (Math.sin(Date.now() / 2000) * 0.4 + 0.5);
        graph.addValue(value);
    }, 100);
}
