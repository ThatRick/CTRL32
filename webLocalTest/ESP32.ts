import { DataType, StructValues } from './TypedStructs.js'

export const enum MSG_TYPE {
    PING,
    CONTROLLER_INFO,
    TASK_INFO,
    CIRCUIT_INFO,
    FUNCTION_INFO,
    GET_MEM_DATA,
    SET_MEM_DATA,
    MONITORING_ENABLE,
    MONITORING_DISABLE,
    MONITORING_FUNC_VALUES,
    MONITORING_COLLECTION,
}

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
    'MONITORING_FUNC_VALUES',
    'MONITORING_COLLECTION',
]
export const msgTypeNamesMaxLength = msgTypeNames.reduce((max, typeName) => Math.max(max, typeName.length), 0)

export const enum REQUEST_RESULT {
    REQUEST_FAILED,
    REQUEST_SUCCESSFUL
}

export const enum IO_FLAG {
    TYPE_B0             = (1 << 0),
    TYPE_B1             = (1 << 1),
    TYPE_B2             = (1 << 2),
    BIT3                = (1 << 3),
    REF                 = (1 << 4),
    REF_INVERT          = (1 << 5),
    REF_CONV_TYPE_B0    = (1 << 6),
    REF_CONV_TYPE_B1    = (1 << 7)
}

export const IO_FLAG_TYPE_MASK =        (IO_FLAG.TYPE_B0 | IO_FLAG.TYPE_B1 | IO_FLAG.TYPE_B2)
export const IO_FLAG_CONV_TYPE_MASK =   (IO_FLAG.REF_CONV_TYPE_B0 | IO_FLAG.REF_CONV_TYPE_B1)

export const enum IO_TYPE {
    BOOL,
    INT,
    UINT,
    FLOAT,
    TIME
}

export const enum IO_CONV
{
    NONE        = 0,
    UNSIGNED    = IO_FLAG.REF_CONV_TYPE_B0,
    SIGNED      = IO_FLAG.REF_CONV_TYPE_B1,
    FLOAT       = IO_FLAG.REF_CONV_TYPE_B0 | IO_FLAG.REF_CONV_TYPE_B1,
}

export const ioConvNames = {
    [IO_CONV.NONE]:     'NONE', 
    [IO_CONV.UNSIGNED]: 'UNSIGNED', 
    [IO_CONV.SIGNED]:   'SIGNED', 
    [IO_CONV.FLOAT]:    'FLOAT', 
}

export const IO_TYPE_MAP =
[
    DataType.uint32,    // BOOL
    DataType.int32,     // INT
    DataType.uint32,    // UINT
    DataType.float,     // FLOAT
    DataType.uint32     // TIME
]

export const ioTypeNames =
[
    'BOOL',
    'INT',
    'UINT',
    'FLOAT',
    'TIME',
]

export const MsgHeader_t = {
    msgType:            DataType.uint32,
    pointer:            DataType.uint32,
    timeStamp:          DataType.uint32
}

export const MsgControllerInfo_t = {
    freeHeap:           DataType.uint32,
    cpuFreq:            DataType.uint32,
    RSSI:               DataType.int32,
    aliveTime:          DataType.float,
    tickCount:          DataType.uint32,
    taskCount:          DataType.uint32,
    taskList:           DataType.uint32,
}

export const MsgTaskInfo_t = {
    interval:           DataType.uint32,
    offset:             DataType.uint32,
    runCount:           DataType.uint32,
    lastCPUTime:        DataType.uint32,
    avgCPUTime:         DataType.float,
    lastActInterval:    DataType.uint32,
    avgActInterval:     DataType.float,
    circuitCount:       DataType.uint32,
    circuitList:        DataType.uint32,
}
export const MsgCircuitInfo_t = {
    funcCount:          DataType.uint32,
    funcList:           DataType.uint32,
    outputRefList:      DataType.uint32,
}

export const MsgFunctionInfo_t = {
    numInputs:          DataType.uint8,
    numOutputs:         DataType.uint8,
    opcode:             DataType.uint16,
    flags:              DataType.uint32,
    ioValueList:        DataType.uint32,
    ioFlagList:         DataType.uint32,
    nameLength:         DataType.uint32,
    namePtr:            DataType.uint32,
}

export const MsgMonitoringCollection_t = {
    itemCount:          DataType.uint32
}
export const MsgMonitoringCollectionItem_t = {
    pointer:            DataType.uint32,
    offset:             DataType.uint16,
    size:               DataType.uint16,
}


// Address area Low is inclusive, High is exclusive
const memoryAreas =
[
    { name: 'DROM',         low: 0x3F400000,    high: 0x3F800000 },
    { name: 'EXTRAM_DATA',  low: 0x3F800000,    high: 0x3FC00000 },
    { name: 'DRAM',         low: 0x3FAE0000,    high: 0x40000000 },
    { name: 'IROM_MASK',    low: 0x40000000,    high: 0x40070000 },
    { name: 'IROM',         low: 0x400D0000,    high: 0x40400000 },
    { name: 'CACHE_PRO',    low: 0x40070000,    high: 0x40078000 },
    { name: 'CACHE_APP',    low: 0x40078000,    high: 0x40080000 },
    { name: 'IRAM',         low: 0x40080000,    high: 0x400A0000 },
    { name: 'RTC_IRAM',     low: 0x400C0000,    high: 0x400C2000 },
    { name: 'RTC_DRAM',     low: 0x3FF80000,    high: 0x3FF82000 },
    { name: 'RTC_DATA',     low: 0x50000000,    high: 0x50002000 },
]

function findMemoryAreaForAddr(addr: number) {
    const area = memoryAreas.find(area => addr >= area.low && addr < area.high)
    return area
}

function logMemoryInfo() {
    memoryAreas.forEach(area => console.log((area.name + ':').padEnd(12) + (((area.high - area.low)/1024) +' kb').padStart(8)))
}

export const ESP32 =
{
    findMemoryAreaForAddr,
    logMemoryInfo
}

export interface IFunctionBlock
{
    pointer:    number
    data:       StructValues<typeof MsgFunctionInfo_t>
    ioValues:   number[]
    ioFlags:    number[]
    name:       string
    complete:   boolean
}

export interface ICircuit
{
    pointer:    number
    data:       StructValues<typeof MsgCircuitInfo_t>
    funcCalls:  number[]
    outputRefs: number[]
    complete:   boolean
}

export interface ITask
{
    pointer:    number
    data:       StructValues<typeof MsgTaskInfo_t>
    circuits:   number[]
    complete:   boolean
}

export interface IController
{
    pointer:    number
    data:       StructValues<typeof MsgControllerInfo_t>
    tasks:      number[]
    complete:   boolean
}
