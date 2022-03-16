import { IFunctionBlockType } from "../IDataTypes.js";
import { LogicLib } from "./LogicLib.js";

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

export const functionLib = [
    null,
    LogicLib
]

export function decodeOpcode(opcode: number)
{
    const libID  = (opcode & 0xFF00) << 8
    const funcID = (opcode & 0xFF)

    return {
        libID, funcID
    }
}

export function getFunctionType(opcode: number): IFunctionBlockType
{
    const {libID, funcID} = decodeOpcode(opcode)

    const lib = functionLib[libID]
    if (!lib) return null

    const func = lib[funcID]
    if (!func) return null

    return func
}