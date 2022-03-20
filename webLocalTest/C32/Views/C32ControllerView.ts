import { C32Controller } from "../C32Controller.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, TextSpan, NodeElement, Checkbox, TableCell, TableRow, Table } from "../../UI/UIElements.js"
import { valueWithSeparators } from "../../Util.js"
import { Colors } from "../../View/Colors.js"
import { PanelElementView } from "../../View/PanelElementView.js"
import { C32TaskView } from "./C32TaskView.js"

export function C32ControllerView(controller: C32Controller)
{
    const tableData = [
        { dataName: 'freeHeap',     label: 'Free heap',     unit: 'bytes' },
        { dataName: 'cpuFreq',      label: 'CPU clock',     unit: 'MHz' },
        { dataName: 'RSSI',         label: 'Wifi quality',  unit: 'dB' },
        { dataName: 'aliveTime',    label: 'Alive time',    unit: 's' },
        { dataName: 'tickCount',    label: 'Tick count',    unit: '' },
    ]
    const valueCellMap = new Map<string, NodeElement<'td'>>()

    const table = Table(
        ...tableData.map(rowData => {
            const valueCell = TableCell(controller.data[rowData.dataName]).align('right').paddingRight(4).color(Colors.PrimaryText)
            valueCellMap.set(rowData.dataName, valueCell)
            return TableRow( TableCell(rowData.label), valueCell, TableCell(rowData.unit) )
        })
    ).color(Colors.SecondaryText)

    let intervalTimerID: number

    const CheckboxUpdateData = new Checkbox('update data', checked => {
        if (checked) intervalTimerID = setInterval(() => controller.requestData(), 1000)
        else clearInterval(intervalTimerID)
    }).paddingTop(4).setChecked(true)

    const Content = VerticalContainer(
        table,
        CheckboxUpdateData
    )
    
    const PanelElement = new PanelElementView('Controller', {
        userContent: Content.node,
        onHideChanged: hidden => {
            CheckboxUpdateData.setChecked(!hidden)
        }
    })

    controller.events.subscribeEvents(
    {
        dataUpdated: () => requestAnimationFrame(() => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = controller.data[dataName]
                const text = (dataName == 'freeHeap') ? valueWithSeparators(value) : value.toString()
                valueCell.textContent(text)
            })
        }),
        taskListLoaded: () => {
            PanelElement.append(
                ...controller.taskList.map(taskPtr => {
                    const task = controller.link.tasks.get(taskPtr)
                    return C32TaskView(task)
                })
            )
        }
    })

    return PanelElement
}

/*
MsgControllerInfo_t
    pointer:            DataType.uint32,
    freeHeap:           DataType.uint32,
    cpuFreq:            DataType.uint32,
    RSSI:               DataType.int32,
    aliveTime:          DataType.uint32,
    tickCount:          DataType.uint32,
    taskCount:          DataType.uint32,
    taskList:           DataType.uint32,
*/