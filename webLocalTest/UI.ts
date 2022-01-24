import { toHex, Vec2, vec2 } from './Util.js'
import { backgroundGridStyle, htmlElement, HTMLTable } from './HTML.js'
import { GUIElement, GUIManager, GUIWindow } from './GUI/GUI.js'

import { DataViewer } from './DataViewer.js'

import { Console } from './UI/UIConsole.js'
import { Checkbox } from './UI/UICheckbox.js'
import { ActionButton } from './UI/UIActionButton.js'
import { ObjectView } from './UI/UIObjectView.js'

import { LineGraph } from './LineGraph.js'
import { Movable } from './GUI/GUIElement.js'

export { ActionButton, ObjectView }

let gui: GUIManager

const UI = {
    connectionStatus:   document.getElementById('connectionStatus') as HTMLParagraphElement,
    connectionControls: document.getElementById('connectionControls') as HTMLDivElement,
    consoleControls:    document.getElementById('consoleControls') as HTMLDivElement,
    panel:              document.getElementById('panel') as HTMLDivElement,
    desktop:            document.getElementById('desktop') as HTMLDivElement,
}

function setStatus(text: string) { UI.connectionStatus.textContent = text }

const popupPos = vec2(200, 200)
const popupOffset = vec2(100, 40)

function createObjectView(data: Record<string, number>, title: string, ) {
    const objView = new ObjectView(data)
    const window = new GUIWindow(popupPos, { content: objView.node, title, autoSize: true, noStatusBar: true })
    gui.addElement(window)
    popupPos.add(popupOffset)
    return objView
}

function createDataView(data: ArrayBuffer, title = 'Data Viewer') {
    const dataViewer = new DataViewer()
    dataViewer.setData(data)
    const dataViewerWindow = new GUIWindow(vec2(100, 400), { content: dataViewer.node, autoSize: true, title })
    gui.addElement(dataViewerWindow)
    return dataViewer
}

export function CreateUI() {
    // Check that all node elements are found in document
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem) console.error(`UI Element '${key}' not found`)
    });
    // Create a graphical user interface manager
    gui = new GUIManager(UI.desktop, { width: '100%', height: '100%' })

    // Create a console log window
    const log = new Console()
    const consoleWindow = new GUIWindow(vec2(100, 400), { size: vec2(700, 300), content: log.node, scrollbars: true, title: 'Console' })
    consoleWindow.userContainer.classList.add('console')
    new ActionButton(consoleWindow.userControls, 'Clear', log.clear)
    new Checkbox(consoleWindow.userControls, 'auto scroll', toggled => {
        log.autoScroll = toggled
        if (toggled) log.scrollToEnd()
    })
    gui.addElement(consoleWindow)
    log.line('Hello World!')    

    // Create a circuit window
    const circuitGUI = new GUIManager(null, {
        width: '800px', height: '600px',
        position: 'relative',
        backgroundColor: '#446',
        ...backgroundGridStyle(vec2(14, 14), '#556'),
    })
    circuitGUI.setScale(0.5)
    const circuitWindow = new GUIWindow(vec2(200, 300), { size: vec2(500, 400), content: circuitGUI.node, title: 'Circuit', scrollbars: true })

    gui.addElement(circuitWindow)

    // Populate circuit window with test elements
    for (let i = 0; i < 4; i++) {
        const elem = new GUIElement(vec2(100*i), vec2(200, 200), {
            backgroundColor: 'dimgrey',
            border: 'solid 1px grey'
        })
        new Movable(elem.node, elem)
        circuitGUI.addElement(elem)
    }

    createTestSet(gui)

    return {
        setStatus,
        log,
        createObjectView,
        createDataView,
        connectionControls: UI.connectionControls,
        consoleControls:    UI.consoleControls,
    }
}

// GUI Test
function createTestSet(gui: GUIManager) {


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
    })
    const textWindow = new GUIWindow(vec2(100, 100), { content: textArea, autoSize: true, noStatusBar: true, title: 'ESP32 info' })
    gui.addElement(textWindow)

    const graph = new LineGraph(400, 300)
    setTimeout(() => {
        console.log(graph.canvas)
        const trendWindow = new GUIWindow(vec2(420, 100), { content: graph.canvas, autoSize: true, title: 'Sine wave' })
        gui.addElement(trendWindow)
    })

    setInterval( () => {
        const value = (Math.sin(Date.now() / 2000) * 0.4 + 0.5)
        graph.addValue(value)
    }, 100)

}