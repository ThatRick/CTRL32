import { VerticalContainer, Checkbox, TableCell, TableRow, Table } from "../GUI/UIElement.js";
import { valueWithSeparators } from "../Util.js";
import { Color } from "./Colors.js";
import { PanelElementView } from "./PanelElementView.js";
const bytesToString = (value) => (value > 2048) ? Math.floor(value / 1024) + ' kb' : value + ' bytes';
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
    const toggleUpdate = (enabled) => {
        if (enabled)
            intervalTimerID = setInterval(() => controller.requestData(), 1000);
        else
            clearInterval(intervalTimerID);
    };
    let checkboxHandle = {};
    const UpdateCheckBox = Checkbox('auto update', toggleUpdate, checkboxHandle).paddingTop(4);
    checkboxHandle.checkbox.checked = true;
    const Content = VerticalContainer(table, UpdateCheckBox);
    const PanelElement = new PanelElementView('Controller', Content.node);
    PanelElement.onHideChanged = hidden => {
        checkboxHandle.checkbox.checked = !hidden;
        checkboxHandle.checkbox.dispatchEvent(new InputEvent('change'));
    };
    controller.events.subscribeEvents({
        dataUpdated: () => {
            valueCellMap.forEach((valueCell, dataName) => {
                const value = controller.data[dataName];
                const text = (dataName == 'freeHeap') ? valueWithSeparators(value) : value.toString();
                valueCell.textContent(text);
            });
        }
    });
    toggleUpdate(true);
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
