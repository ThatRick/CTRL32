import { VerticalContainer, TextNode, TextSpan, TableCell, TableRow, Table } from "../../GUI/UIElements.js";
import { toHex } from "../../Util.js";
import { Color } from "../../View/Colors.js";
import { PanelElementView } from "../../View/PanelElementView.js";
import { C32FunctionView } from "./C32FunctionView.js";
export function C32CircuitView(circuit) {
    const tableData = [
        { dataName: 'pointer', label: 'Pointer', unit: '' },
    ];
    const valueCellMap = new Map();
    const table = Table(...tableData.map(rowInfo => {
        const valueCell = TableCell(circuit.data[rowInfo.dataName]).align('right').paddingRight(4).color(Color.PrimaryText);
        valueCellMap.set(rowInfo.dataName, valueCell);
        return TableRow(TableCell(rowInfo.label), valueCell, TableCell(rowInfo.unit));
    })).color(Color.SecondaryText);
    const FunctionList = VerticalContainer();
    const Content = VerticalContainer(table, FunctionList);
    const PanelElement = new PanelElementView(`Circuit ${circuit.index}`, {
        userContent: Content.node,
        statusText: `(Task ${circuit.task.index})`,
        statusColor: '#bbb',
        closable: true
    });
    const functionPanels = new Map();
    const eventHandlers = {
        dataUpdated: () => requestAnimationFrame(() => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = circuit.data[dataName];
                const text = (dataName == 'pointer') ? toHex(value) : value.toString();
                valueCell.textContent(text);
            });
        }),
        funcListLoaded: () => {
            FunctionList.clear().append(TextNode(`Functions: (${circuit.funcList.length})`).paddingVertical(4), ...circuit.funcList.map((funcPtr, index) => {
                const funcBlock = circuit.link.functionBlocks.get(funcPtr);
                return TextSpan(`${index}: ${funcBlock.name} [${toHex(funcPtr)}]`).paddingLeft(8).color(Color.Link).onClick(() => {
                    if (functionPanels.has(funcPtr)) {
                        const functionPanel = functionPanels.get(funcPtr);
                        if (!functionPanel.node.parentElement)
                            functionPanel.setHidden(false).appendTo(PanelElement);
                    }
                    else {
                        const func = circuit.link.functionBlocks.get(funcPtr);
                        const functionPanel = C32FunctionView(func).appendTo(PanelElement);
                        functionPanels.set(funcPtr, functionPanel);
                    }
                });
            }));
        }
    };
    circuit.events.subscribeEvents(eventHandlers);
    eventHandlers.dataUpdated();
    if (circuit.complete)
        eventHandlers.funcListLoaded();
    return PanelElement;
}
/*
MsgCircuitInfo_t = {
    pointer:            DataType.uint32,
    callCount:          DataType.uint32,
    callList:           DataType.uint32,
    outputRefCount:     DataType.uint32,
    outputRefList:      DataType.uint32,
*/ 
