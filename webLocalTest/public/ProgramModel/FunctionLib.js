import { LogicLib } from "./FunctionLibs/LogicLib.js";
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
const libraryMap = new Map([
    [LIBRARY_ID.LOGIC, LogicLib]
]);
function decodeOpcode(opcode) {
    const libID = (opcode & 0xFF00) >> 8;
    const funcID = (opcode & 0x00FF);
    console.log(`Decoded opcode ${opcode}: ${libID}/${funcID}`);
    return {
        libID, funcID
    };
}
function encodeOpcode(libID, funcID) {
    return (libID << 8) + (funcID);
}
function getLibraryByID(id) {
    return libraryMap.get(id);
}
function getLibraryByName(name) {
    return [...libraryMap.values()].find(lib => lib.name == name);
}
function getFunctionByOpcode(opcode) {
    const { libID, funcID } = decodeOpcode(opcode);
    return getFunctionByID(libID, funcID);
}
function getFunctionByID(libID, funcID) {
    const lib = libraryMap.get(libID);
    if (!lib)
        return null;
    return lib.functions[funcID];
}
function getFunctionByName(libName, funcName) {
    const lib = getLibraryByName(libName);
    if (!lib)
        return null;
    return lib.functions.find(func => func.name == funcName);
}
export const FunctionLibrary = {
    libraryMap,
    decodeOpcode,
    encodeOpcode,
    getLibraryByID,
    getLibraryByName,
    getFunctionByOpcode,
    getFunctionByID,
    getFunctionByName
};
