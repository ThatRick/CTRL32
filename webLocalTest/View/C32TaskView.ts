import { C32Controller } from "../C32/C32Controller.js"
import { C32Task } from "../C32/C32Task.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, TextSpan, UIElement, Checkbox, CheckboxHandle, TableCell, TableRow, Table } from "../GUI/UIElement.js"
import { toHex, valueWithSeparators } from "../Util.js"
import { Color } from "./Colors.js"
import { PanelElementView } from "./PanelElementView.js"

export function C32TaskView(task: C32Task)
{
    const tableData = [
        { dataName: 'pointer',          label:     'Pointer',           unit: '' },
        { dataName: 'interval',         label:     'Interval',          unit: 'ms' },
        { dataName: 'offset',           label:     'Offset',            unit: 'ms' },
        { dataName: 'runCount',         label:     'Run count',         unit: '' },
        { dataName: 'lastCPUTime',      label:     'last CPU-time',     unit: 'µs' },
        { dataName: 'avgCPUTime',       label:     'avg. CPU-time',     unit: 'µs' },
        { dataName: 'lastActInterval',  label:     'last interval',     unit: 'ms' },
        { dataName: 'avgActInterval',   label:     'Avg. interval',     unit: 'ms' },
        { dataName: 'driftTime',        label:     'Drift time',        unit: 'µs' },
    ]
    const valueCellMap = new Map<string, UIElement<'td'>>()

    const table = Table(
        ...tableData.map(lineInfo => {
            const valueCell = TableCell(task.data[lineInfo.dataName]).align('right').paddingRight(4).color(Color.PrimaryText)
            valueCellMap.set(lineInfo.dataName, valueCell)
            return TableRow( TableCell(lineInfo.label), valueCell, TableCell(lineInfo.unit) )
        })
    ).color(Color.SecondaryText)

    let intervalTimerID: number
    
    const toggleUpdate = (enabled: boolean) => {
        if (enabled) intervalTimerID = setInterval(() => task.requestData(), 1000)
        else clearInterval(intervalTimerID)
    }
    
    let checkboxHandle: CheckboxHandle = {}

    const UpdateCheckBox = Checkbox('auto update', toggleUpdate, checkboxHandle).paddingTop(4)
    checkboxHandle.checkbox.checked = true
    
    const Content = VerticalContainer(
        table,
        UpdateCheckBox
    )
    const PanelElement = new PanelElementView('Task', Content.node)

    PanelElement.status.textContent(toHex(task.data.pointer))
    PanelElement.status.color('#bbb')
    PanelElement.onHideChanged = hidden => {
        checkboxHandle.checkbox.checked = !hidden
        checkboxHandle.checkbox.dispatchEvent(new InputEvent('change'))
    }

    task.events.subscribeEvents(
    {
        dataUpdated: () => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = task.data[dataName] as number
                const text = (dataName.startsWith('avg')) ? value.toPrecision(5)
                           : (dataName == 'pointer') ? toHex(value) : value.toString()
                valueCell.textContent(text)
            })
        }
    })

    toggleUpdate(true)

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