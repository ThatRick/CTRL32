import { vec2 } from './Util.js';
import { htmlElement } from './HTML.js';
import { GUIManager, GUIWindow } from './GUI/GUI.js';
import { Console } from './UI/UIConsole.js';
import { Checkbox } from './UI/UICheckbox.js';
import { ActionButton } from './UI/UIActionButton.js';
import { ObjectView } from './UI/UIObjectView.js';
import { OnlineTrendGraph } from './OnlineTrendGraph.js';
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
    const window = new GUIWindow(popupPos, { content: objView.node, title, autoSize: true });
    gui.addElement(window);
    popupPos.add(popupOffset);
    return objView;
}
export function CreateUI() {
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem)
            console.error(`UI Element '${key}' not found`);
    });
    gui = new GUIManager(UI.desktop);
    const log = new Console();
    log.node.classList.add('console');
    const consoleWindow = new GUIWindow(vec2(100, 400), { size: vec2(700, 300), content: log.node, scrollbars: true });
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
    const textWindow = new GUIWindow(vec2(100, 100), { content: textArea, autoSize: true });
    gui.addElement(textWindow);
    const graph = new OnlineTrendGraph(400, 300);
    setTimeout(() => {
        console.log(graph.canvas);
        const trendWindow = new GUIWindow(vec2(420, 100), { content: graph.canvas, autoSize: true });
        gui.addElement(trendWindow);
    });
    setInterval(() => {
        const value = (Math.sin(Date.now() / 2000) + 1) * 0.4;
        graph.addValue(value);
    }, 100);
}
