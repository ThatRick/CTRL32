import { VerticalContainer, TableCell, TableRow, Table } from "../../GUI/UIElements.js";
import { toHex } from "../../Util.js";
import { Color } from "../../View/Colors.js";
import { PanelElementView } from "../../View/PanelElementView.js";
export function C32FunctionView(func) {
    const tableData = [
        { dataName: 'pointer', label: 'Pointer' },
        { dataName: 'numInputs', label: 'Inputs' },
        { dataName: 'numOutputs', label: 'Outputs' },
        { dataName: 'opcode', label: 'opcode' },
    ];
    const valueCellMap = new Map();
    const table = Table(...tableData.map(rowInfo => {
        const valueCell = TableCell(func.data[rowInfo.dataName]).align('right').paddingRight(4).color(Color.PrimaryText);
        valueCellMap.set(rowInfo.dataName, valueCell);
        return TableRow(TableCell(rowInfo.label), valueCell);
    })).color(Color.SecondaryText);
    const FunctionList = VerticalContainer();
    const Content = VerticalContainer(table, FunctionList);
    const PanelElement = new PanelElementView(`${func.name} ${func.index + 1}/${func.circuit.funcList.length}`, {
        userContent: Content.node,
        statusText: `(Task ${func.circuit.task.index} Circ ${func.circuit.index})`,
        statusColor: '#bbb',
        closable: true
    });
    const eventHandlers = {
        dataUpdated: () => requestAnimationFrame(() => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = func.data[dataName];
                const text = (dataName == 'pointer') ? toHex(value) : value.toString();
                valueCell.textContent(text);
            });
        })
    };
    func.events.subscribeEvents(eventHandlers);
    eventHandlers.dataUpdated();
    return PanelElement;
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
