import { C32Circuit } from "../C32Circuit.js"
import { HorizontalContainer, VerticalContainer, TextNode, Div, Button, Input, TextSpan, NodeElement, Checkbox, TableCell, TableRow, Table } from "../../UI/UIElements.js"
import { toHex, valueWithSeparators } from "../../Util.js"
import { Colors } from "../../View/Colors.js"
import { PanelElementView } from "../../View/PanelElementView.js"
import { C32Function } from "../C32Function.js"

export function C32FunctionView(func: C32Function)
{
    const tableData = [
        { dataName: 'pointer',      label:  'Pointer'     },
        { dataName: 'numInputs',    label:  'Inputs'      },
        { dataName: 'numOutputs',   label:  'Outputs'     },
        { dataName: 'opcode',       label:  'opcode'      },
    ]
    const valueCellMap = new Map<string, NodeElement<'td'>>()

    const table = Table(
        ...tableData.map(rowInfo => {
            const valueCell = TableCell(func.data[rowInfo.dataName]).align('right').paddingRight(4).color(Colors.PrimaryText)
            valueCellMap.set(rowInfo.dataName, valueCell)
            return TableRow( TableCell(rowInfo.label), valueCell )
        })
    ).color(Colors.SecondaryText)
    
    const FunctionList = VerticalContainer()

    const Content = VerticalContainer(
        table,
        FunctionList
    )
    const PanelElement = new PanelElementView(`${func.name} ${func.callOrder+1}/${func.parentCircuit.funcList.length}`, {
        userContent:    Content.node,
        statusText:     (func.parentCircuit) ? `(Call order: ${func.callOrder})` :
                        (func.task) ? `(Task: ${func.task.data.interval} ms)` : '(no parent)',
        statusColor:    '#bbb',
        closable:       true
    })

    const eventHandlers = {
        dataUpdated: () => requestAnimationFrame(() => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = func.data[dataName] as number
                const text = (dataName == 'pointer') ? toHex(value) : value.toString()
                valueCell.textContent(text)
            })
        })
    }
    func.events.subscribeEvents(eventHandlers)
    eventHandlers.dataUpdated()

    return PanelElement
}

/*
MsgFunctionInfo_t = {
    pointer:            DataType.uint32,
    numInputs:          DataType.uint8,
    numOutputs:         DataType.uint8,
    opcode:             DataType.uint16,
    flags:              DataType.uint32,
    ioValueList:        DataType.uint32,
    ioFlagList:         DataType.uint32,
    nameLength:         DataType.uint32,
    namePtr:            DataType.uint32,
*/