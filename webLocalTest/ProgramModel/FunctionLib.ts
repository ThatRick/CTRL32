import { IFunctionBlockType, IFunctionLib } from "./IDataTypes.js";
import { LogicLib } from "./FunctionLibs/LogicLib.js";

enum LIBRARY_ID
{
    NULL,
    LOGIC,
    MATH,
    MATH_INT,
    MATH_UINT,
    TIMERS,
    CONDITIONALS,
    COUNT
}

const libraryMap = new Map<number, IFunctionLib>([
    [LIBRARY_ID.LOGIC, LogicLib]
])

function decodeOpcode(opcode: number)
{
    const libID  = (opcode & 0xFF00) >> 8
    const funcID = (opcode & 0x00FF)

    console.log(`Decoded opcode ${opcode}: ${libID}/${funcID}`)
    return {
        libID, funcID
    }
}

function encodeOpcode(libID: number, funcID: number)
{
    return (libID << 8) + (funcID)
}


function getLibraryByID(id: number)
{
    return libraryMap.get(id)
}


function getLibraryByName(name: string)
{
    return [...libraryMap.values()].find(lib => lib.name == name)
}


function getFunctionByOpcode(opcode: number): IFunctionBlockType
{
    const {libID, funcID} = decodeOpcode(opcode)

    return getFunctionByID(libID, funcID)
}


function getFunctionByID(libID: number, funcID: number)
{
    const lib = libraryMap.get(libID)
    if (!lib) return null

    return lib.functions[funcID]
}


function getFunctionByName(libName: string, funcName: string)
{
    const lib = getLibraryByName(libName)
    if (!lib) return null

    return lib.functions.find(func => func.name == funcName)
}


export const FunctionLibrary =
{
    libraryMap,
    decodeOpcode,
    encodeOpcode,
    getLibraryByID,
    getLibraryByName,
    getFunctionByOpcode,
    getFunctionByID,
    getFunctionByName
}