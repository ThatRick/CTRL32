import { C32Task } from "../C32Task.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, TextSpan, NodeElement, Checkbox, TableCell, TableRow, Table } from "../../GUI/UIElements.js"
import { toHex, valueWithSeparators } from "../../Util.js"
import { Color } from "../../View/Colors.js"
import { PanelElementView } from "../../View/PanelElementView.js"
import { C32CircuitView } from "./C32CircuitView.js"

export function C32TaskView(task: C32Task)
{
    const tableData = [
        { dataName: 'pointer',          label:     'Pointer',           unit: ''   },
        { dataName: 'interval',         label:     'Interval',          unit: 'ms' },
        { dataName: 'offset',           label:     'Offset',            unit: 'ms' },
        { dataName: 'runCount',         label:     'Run count',         unit: ''   },
        { dataName: 'lastCPUTime',      label:     'last CPU-time',     unit: 'µs' },
        { dataName: 'avgCPUTime',       label:     'avg. CPU-time',     unit: 'µs' },
        { dataName: 'lastActInterval',  label:     'last interval',     unit: 'ms' },
        { dataName: 'avgActInterval',   label:     'avg. interval',     unit: 'ms' },
        { dataName: 'driftTime',        label:     'Drift time',        unit: 'ms' },
    ]
    const valueCellMap = new Map<string, NodeElement<'td'>>()

    const table = Table(
        ...tableData.map(lineInfo => {
            const valueCell = TableCell(task.data[lineInfo.dataName]).align('right').paddingRight(4).color(Color.PrimaryText)
            valueCellMap.set(lineInfo.dataName, valueCell)
            return TableRow( TableCell(lineInfo.label), valueCell, TableCell(lineInfo.unit) )
        })
    ).color(Color.SecondaryText)

    let intervalTimerID: number

    const CheckboxUpdateData = new Checkbox('update data', checked => {
        if (checked) intervalTimerID = setInterval(() => task.requestData(), 1000)
        else clearInterval(intervalTimerID)
    }).paddingTop(4).setChecked(true)
    
    const CircuitList = VerticalContainer()

    const Content = VerticalContainer(
        table,
        CircuitList,
        CheckboxUpdateData
    )
    const PanelElement = new PanelElementView(`Task ${task.index}`, {
        userContent: Content.node,
        statusText: `(${task.data.interval} ms)`,
        statusColor: '#bbb',
        onHideChanged: hidden => {
            CheckboxUpdateData.setChecked(!hidden)
        },
    })

    const circuitPanels = new Map<number, PanelElementView>()

    task.events.subscribeEvents(
    {
        dataUpdated: () => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = task.data[dataName] as number
                const text = (dataName.startsWith('avg')) ? value.toPrecision(5)
                           : (dataName == 'pointer')      ? toHex(value)
                           : (dataName == 'driftTime')    ? (value / 1000).toPrecision(4)
                           : value.toString()

                valueCell.textContent(text)
            })
        },
        callListLoaded: () => {
            CircuitList.clear().append(
                TextNode(`Task calls: (${task.circuits.length})`).paddingVertical(4),
                ...task.circuits.map( (circuitPtr, index) => {
                    return TextSpan(`${index}: Circuit [${toHex(circuitPtr)}]`).paddingLeft(8).color(Color.Link).onClick(() => {
                        if (circuitPanels.has(circuitPtr)) {
                            const circuitPanel = circuitPanels.get(circuitPtr)
                            if (circuitPanel.node.parentElement) circuitPanel.remove()
                            else circuitPanel.setHidden(false).appendTo(PanelElement)
                        } else {
                            const circuit = task.link.circuits.get(circuitPtr)
                            const circuitPanel = C32CircuitView(circuit).appendTo(PanelElement)
                            circuitPanels.set(circuitPtr, circuitPanel)
                        }
                    })
                })
            )
        }
    })

    return PanelElement
}

/*
MsgTaskInfo_t
    pointer:            DataType.uint32,
    interval:           DataType.uint32,
    offset:             DataType.uint32,
    runCount:           DataType.uint32,
    lastCPUTime:        DataType.uint32,
    avgCPUTime:         DataType.float,
    lastActInterval:    DataType.uint32,
    avgActInterval:     DataType.float,
    driftTime:          DataType.uint32,
    circuitCount:       DataType.uint32,
    circuitList:        DataType.uint32,
*/