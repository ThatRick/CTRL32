export const msgTypeNames = [
    'PING',
    'CONTROLLER_INFO',
    'TASK_INFO',
    'CIRCUIT_INFO',
    'FUNCTION_INFO',
    'GET_MEM_DATA',
    'SET_MEM_DATA',
    'MONITORING_ENABLE',
    'MONITORING_DISABLE',
    'MONITORING_REPORT',
    'CREATE_TASK',
    'CREATE_CIRCUIT',
    'CREATE_FUNCTION',
    'DELETE_TASK',
    'DELETE_CIRCUIT',
    'DELETE_FUNCTION',
    'TASK_START',
    'TASK_STOP',
    'TASK_SET_INTERVAL',
    'TASK_SET_OFFSET',
    'TASK_ADD_CIRCUIT',
    'TASK_REMOVE_CIRCUIT',
    'CIRCUIT_ADD_FUNCTION',
    'CIRCUIT_REMOVE_FUNCTION',
    'CIRCUIT_REORDER_FUNCTION',
    'CIRCUIT_CONNECT_OUTPUT',
    'FUNCTION_SET_IO_VALUE',
    'FUNCTION_SET_IO_FLAG',
    'FUNCTION_CONNECT_INPUT',
    'FUNCTION_DISCONNECT_INPUT',
    'FUNCTION_SET_FLAGS',
    'FUNCTION_SET_FLAG',
    'FUNCTION_CLEAR_FLAG',
];
export const msgTypeNamesMaxLength = msgTypeNames.reduce((max, typeName) => Math.max(max, typeName.length), 0);
export const IO_FLAG_TYPE_MASK = (1 /* TYPE_B0 */ | 2 /* TYPE_B1 */ | 4 /* TYPE_B2 */);
export const IO_FLAG_CONV_TYPE_MASK = (64 /* REF_CONV_TYPE_B0 */ | 128 /* REF_CONV_TYPE_B1 */);
export const ioConvNames = {
    [0 /* NONE */]: 'NONE',
    [64 /* UNSIGNED */]: 'UNSIGNED',
    [128 /* SIGNED */]: 'SIGNED',
    [192 /* FLOAT */]: 'FLOAT',
};
export const IO_TYPE_MAP = [
    5 /* uint32 */,
    4 /* int32 */,
    5 /* uint32 */,
    6 /* float */,
    5 /* uint32 */
];
export const ioTypeNames = [
    'BOOL',
    'INT',
    'UINT',
    'FLOAT',
    'TIME',
];
export const MsgRequestHeader_t = {
    msgType: 5 /* uint32 */,
    msgID: 5 /* uint32 */,
    pointer: 5 /* uint32 */,
};
export const MsgResponseHeader_t = {
    msgType: 5 /* uint32 */,
    msgID: 5 /* uint32 */,
    result: 5 /* uint32 */,
    timeStamp: 5 /* uint32 */,
};
export const MsgControllerInfo_t = {
    pointer: 5 /* uint32 */,
    freeHeap: 5 /* uint32 */,
    cpuFreq: 5 /* uint32 */,
    RSSI: 4 /* int32 */,
    aliveTime: 5 /* uint32 */,
    tickCount: 5 /* uint32 */,
    taskCount: 5 /* uint32 */,
    taskList: 5 /* uint32 */,
};
export const MsgTaskInfo_t = {
    pointer: 5 /* uint32 */,
    interval: 5 /* uint32 */,
    offset: 5 /* uint32 */,
    runCount: 5 /* uint32 */,
    lastCPUTime: 5 /* uint32 */,
    avgCPUTime: 6 /* float */,
    lastActInterval: 5 /* uint32 */,
    avgActInterval: 6 /* float */,
    driftTime: 5 /* uint32 */,
    circuitCount: 5 /* uint32 */,
    circuitList: 5 /* uint32 */,
};
export const MsgCircuitInfo_t = {
    pointer: 5 /* uint32 */,
    funcCount: 5 /* uint32 */,
    funcList: 5 /* uint32 */,
    outputRefList: 5 /* uint32 */,
};
export const MsgFunctionInfo_t = {
    pointer: 5 /* uint32 */,
    numInputs: 1 /* uint8 */,
    numOutputs: 1 /* uint8 */,
    opcode: 3 /* uint16 */,
    flags: 5 /* uint32 */,
    ioValueList: 5 /* uint32 */,
    ioFlagList: 5 /* uint32 */,
    nameLength: 5 /* uint32 */,
    namePtr: 5 /* uint32 */,
};
export const MsgMonitoringCollection_t = {
    itemCount: 5 /* uint32 */
};
export const MsgMonitoringCollectionItem_t = {
    pointer: 5 /* uint32 */,
    offset: 3 /* uint16 */,
    size: 3 /* uint16 */,
};
// Address area Low is inclusive, High is exclusive
const memoryAreas = [
    { name: 'DROM', low: 0x3F400000, high: 0x3F800000 },
    { name: 'EXTRAM_DATA', low: 0x3F800000, high: 0x3FC00000 },
    { name: 'DRAM', low: 0x3FAE0000, high: 0x40000000 },
    { name: 'IROM_MASK', low: 0x40000000, high: 0x40070000 },
    { name: 'IROM', low: 0x400D0000, high: 0x40400000 },
    { name: 'CACHE_PRO', low: 0x40070000, high: 0x40078000 },
    { name: 'CACHE_APP', low: 0x40078000, high: 0x40080000 },
    { name: 'IRAM', low: 0x40080000, high: 0x400A0000 },
    { name: 'RTC_IRAM', low: 0x400C0000, high: 0x400C2000 },
    { name: 'RTC_DRAM', low: 0x3FF80000, high: 0x3FF82000 },
    { name: 'RTC_DATA', low: 0x50000000, high: 0x50002000 },
];
function findMemoryAreaForAddr(addr) {
    const area = memoryAreas.find(area => addr >= area.low && addr < area.high);
    return area;
}
function logMemoryInfo() {
    memoryAreas.forEach(area => console.log((area.name + ':').padEnd(12) + (((area.high - area.low) / 1024) + ' kb').padStart(8)));
}
export const ESP32 = {
    findMemoryAreaForAddr,
    logMemoryInfo
};
// ------------------------------------------------------------------------
//      Parse opcode to library id and function id
export function parseOpcode(opcode) {
    const lib_id = (opcode & 0xFF00) >>> 8;
    const func_id = opcode & 0x00FF;
    return { lib_id, func_id };
}
