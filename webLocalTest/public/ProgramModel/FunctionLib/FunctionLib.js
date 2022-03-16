import { LogicLib } from "./LogicLib.js";
var LIBRARY_ID;
(function (LIBRARY_ID) {
    LIBRARY_ID[LIBRARY_ID["NULL"] = 0] = "NULL";
    LIBRARY_ID[LIBRARY_ID["LOGIC"] = 1] = "LOGIC";
    LIBRARY_ID[LIBRARY_ID["MATH"] = 2] = "MATH";
    LIBRARY_ID[LIBRARY_ID["MATH_INT"] = 3] = "MATH_INT";
    LIBRARY_ID[LIBRARY_ID["MATH_UINT"] = 4] = "MATH_UINT";
    LIBRARY_ID[LIBRARY_ID["TIMERS"] = 5] = "TIMERS";
    LIBRARY_ID[LIBRARY_ID["CONDITIONALS"] = 6] = "CONDITIONALS";
    LIBRARY_ID[LIBRARY_ID["COUNT"] = 7] = "COUNT";
})(LIBRARY_ID || (LIBRARY_ID = {}));
export const functionLib = [
    null,
    LogicLib
];
export function decodeOpcode(opcode) {
    const libID = (opcode & 0xFF00) << 8;
    const funcID = (opcode & 0xFF);
    return {
        libID, funcID
    };
}
export function getFunctionType(opcode) {
    const { libID, funcID } = decodeOpcode(opcode);
    const lib = functionLib[libID];
    if (!lib)
        return null;
    const func = lib[funcID];
    if (!func)
        return null;
    return func;
}
