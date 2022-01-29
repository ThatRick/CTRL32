import { VerticalContainer, Checkbox, TableCell, TableRow, Table } from "../../GUI/UIElement.js";
import { valueWithSeparators } from "../../Util.js";
import { Color } from "../../View/Colors.js";
import { PanelElementView } from "../../View/PanelElementView.js";
import { C32TaskView } from "./C32TaskView.js";
export function C32ControllerView(controller) {
    const tableData = [
        { dataName: 'freeHeap', label: 'Free heap', unit: 'bytes' },
        { dataName: 'cpuFreq', label: 'CPU clock', unit: 'MHz' },
        { dataName: 'RSSI', label: 'Wifi quality', unit: 'dB' },
        { dataName: 'aliveTime', label: 'Alive time', unit: 's' },
        { dataName: 'tickCount', label: 'Tick count', unit: '' },
    ];
    const valueCellMap = new Map();
    const table = Table(...tableData.map(lineInfo => {
        const valueCell = TableCell(controller.data[lineInfo.dataName]).align('right').paddingRight(4).color(Color.PrimaryText);
        valueCellMap.set(lineInfo.dataName, valueCell);
        return TableRow(TableCell(lineInfo.label), valueCell, TableCell(lineInfo.unit));
    })).color(Color.SecondaryText);
    let intervalTimerID;
    const CheckboxUpdateData = new Checkbox('update data', checked => {
        if (checked)
            intervalTimerID = setInterval(() => controller.requestData(), 1000);
        else
            clearInterval(intervalTimerID);
    }).paddingTop(4).setChecked(true);
    const Content = VerticalContainer(table, CheckboxUpdateData);
    const PanelElement = new PanelElementView('Controller', {
        userContent: Content.node,
        onHideChanged: hidden => {
            CheckboxUpdateData.setChecked(!hidden);
        }
    });
    controller.events.subscribeEvents({
        dataUpdated: () => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = controller.data[dataName];
                const text = (dataName == 'freeHeap') ? valueWithSeparators(value) : value.toString();
                valueCell.textContent(text);
            });
        },
        tasklistLoaded: () => {
            PanelElement.append(...controller.tasks.map(taskPtr => {
                const task = controller.link.tasks.get(taskPtr);
                return C32TaskView(task);
            }));
        }
    });
    return PanelElement;
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
