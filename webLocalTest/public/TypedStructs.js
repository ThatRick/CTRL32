// Little endian if true
const LE = true;
export function defineStruct(structDefinition) {
    const size = sizeOfStruct(structDefinition);
    Object.defineProperty(structDefinition, 'STRUCT_BYTE_SIZE', { value: size });
    return structDefinition;
}
// Read a struct from buffer
export function readStruct(buffer, startByteOffset, struct) {
    let offset = startByteOffset;
    const view = new DataView(buffer);
    const obj = {};
    const readValue = (type) => {
        let value;
        switch (type) {
            case 0 /* int8 */:
                value = view.getInt8(offset);
                offset += 1 /* int8 */;
                break;
            case 1 /* uint8 */:
                value = view.getUint8(offset);
                offset += 1 /* uint8 */;
                break;
            case 2 /* int16 */:
                value = view.getInt16(offset, LE);
                offset += 2 /* int16 */;
                break;
            case 3 /* uint16 */:
                value = view.getUint16(offset, LE);
                offset += 2 /* uint16 */;
                break;
            case 4 /* int32 */:
                value = view.getInt32(offset, LE);
                offset += 4 /* int32 */;
                break;
            case 5 /* uint32 */:
                value = view.getUint32(offset, LE);
                offset += 4 /* uint32 */;
                break;
            case 6 /* float */:
                value = view.getFloat32(offset, LE);
                offset += 4 /* float */;
                break;
            case 7 /* double */:
                value = view.getFloat64(offset, LE);
                offset += 8 /* double */;
                break;
        }
        ;
        return value;
    };
    for (const variable in struct) {
        const type = struct[variable];
        obj[variable] = readValue(type);
    }
    ;
    return obj;
}
// Read a struct from buffer
export function readStructElement(buffer, startByteOffset, struct, elementName) {
    let offset = startByteOffset;
    const view = new DataView(buffer);
    const readValue = (type) => {
        let value;
        switch (type) {
            case 0 /* int8 */:
                value = view.getInt8(offset);
                offset += 1 /* int8 */;
                break;
            case 1 /* uint8 */:
                value = view.getUint8(offset);
                offset += 1 /* uint8 */;
                break;
            case 2 /* int16 */:
                value = view.getInt16(offset, LE);
                offset += 2 /* int16 */;
                break;
            case 3 /* uint16 */:
                value = view.getUint16(offset, LE);
                offset += 2 /* uint16 */;
                break;
            case 4 /* int32 */:
                value = view.getInt32(offset, LE);
                offset += 4 /* int32 */;
                break;
            case 5 /* uint32 */:
                value = view.getUint32(offset, LE);
                offset += 4 /* uint32 */;
                break;
            case 6 /* float */:
                value = view.getFloat32(offset, LE);
                offset += 4 /* float */;
                break;
            case 7 /* double */:
                value = view.getFloat64(offset, LE);
                offset += 8 /* double */;
                break;
        }
        ;
        return value;
    };
    // Iterate all structure elements
    for (const element in struct) {
        const type = struct[element];
        if (elementName == element)
            return readValue(type);
        else
            offset += sizeOfType(type);
    }
    ;
}
// Read an array of structs from buffer
export function readArrayOfStructs(buffer, startByteOffset, struct, len) {
    let offset = startByteOffset;
    const structByteLength = sizeOfStruct(struct);
    const maxLen = Math.floor((buffer.byteLength - startByteOffset) / structByteLength);
    len || (len = maxLen);
    if (len > maxLen) {
        console.error('Read Struct Array: Buffer overflow. Given struct array length too big', len);
        len = maxLen;
    }
    if ((buffer.byteLength - startByteOffset) % structByteLength != 0)
        console.warn('Read Struct Array: Given buffer length is not a multiple of struct length');
    const array = [];
    // console.log('Read Struct Array: len = %d / %d = %d\n', (buffer.byteLength - startByteOffset), sizeOfStruct(struct), len);
    // Iterate all array elements
    for (let i = 0; i < len; i++) {
        const elem = readStruct(buffer, offset, struct);
        offset += structByteLength;
        array.push(elem);
    }
    return array;
}
// Write a struct to buffer. Returns new offset (startByteOffset + bytes written)
// export function writeStruct<T extends StructValues>(buffer: ArrayBuffer, startByteOffset: number, struct: StructDataTypes<T>, values: T): number
export function writeStruct(buffer, startByteOffset, struct, values) {
    // console.log('write struct: ', {buffer, startOffset}, struct, values);
    let offset = startByteOffset;
    const view = new DataView(buffer);
    const writeValue = (type, value = 0) => {
        switch (type) {
            case 0 /* int8 */:
                view.setInt8(offset, value);
                offset += 1 /* int8 */;
                break;
            case 1 /* uint8 */:
                view.setUint8(offset, value);
                offset += 1 /* uint8 */;
                break;
            case 2 /* int16 */:
                view.setInt16(offset, value, LE);
                offset += 2 /* int16 */;
                break;
            case 3 /* uint16 */:
                view.setUint16(offset, value, LE);
                offset += 2 /* uint16 */;
                break;
            case 4 /* int32 */:
                view.setInt32(offset, value, LE);
                offset += 4 /* int32 */;
                break;
            case 5 /* uint32 */:
                view.setUint32(offset, value, LE);
                offset += 4 /* uint32 */;
                break;
            case 6 /* float */:
                view.setFloat32(offset, value, LE);
                offset += 4 /* float */;
                break;
            case 7 /* double */:
                view.setFloat64(offset, value, LE);
                offset += 8 /* double */;
                break;
        }
        ;
    };
    const assertedValues = values;
    // Iterate all structure elements
    for (const element in struct) {
        const type = struct[element];
        const value = assertedValues[element];
        if (value == undefined)
            offset += sizeOfType(type);
        else
            writeValue(type, value);
    }
    ;
    // return new offset
    return offset;
}
export function writeStructElement(buffer, startByteOffset, struct, elementName, newValue) {
    let offset = startByteOffset;
    const view = new DataView(buffer);
    const updateElement = (type, value = 0) => {
        switch (type) {
            case 0 /* int8 */:
                view.setInt8(offset, value);
                offset += 1 /* int8 */;
                break;
            case 1 /* uint8 */:
                view.setUint8(offset, value);
                offset += 1 /* uint8 */;
                break;
            case 2 /* int16 */:
                view.setInt16(offset, value, LE);
                offset += 2 /* int16 */;
                break;
            case 3 /* uint16 */:
                view.setUint16(offset, value, LE);
                offset += 2 /* uint16 */;
                break;
            case 4 /* int32 */:
                view.setInt32(offset, value, LE);
                offset += 4 /* int32 */;
                break;
            case 5 /* uint32 */:
                view.setUint32(offset, value, LE);
                offset += 4 /* uint32 */;
                break;
            case 6 /* float */:
                view.setFloat32(offset, value, LE);
                offset += 4 /* float */;
                break;
            case 7 /* double */:
                view.setFloat64(offset, value, LE);
                offset += 8 /* double */;
                break;
        }
        ;
    };
    // Iterate all structure elements
    for (const element in struct) {
        const type = struct[element];
        const value = (element == elementName) ? newValue : undefined;
        if (value == undefined)
            offset += sizeOfType(type);
        else
            updateElement(type, value);
    }
    ;
}
// Get struct size in bytes
export function sizeOfStruct(struct) {
    let size = 0;
    Object.values(struct).forEach(type => {
        size += sizeOfType(type);
    });
    return size;
}
export function sizeOfType(type) {
    switch (type) {
        case 0 /* int8 */: return 1 /* int8 */;
        case 1 /* uint8 */: return 1 /* uint8 */;
        case 2 /* int16 */: return 2 /* int16 */;
        case 3 /* uint16 */: return 2 /* uint16 */;
        case 4 /* int32 */: return 4 /* int32 */;
        case 5 /* uint32 */: return 4 /* uint32 */;
        case 6 /* float */: return 4 /* float */;
        case 7 /* double */: return 8 /* double */;
    }
}
export function typedArray(buffer, elemType) {
    switch (elemType) {
        case 0 /* int8 */: return new Int8Array(buffer);
        case 1 /* uint8 */: return new Uint8Array(buffer);
        case 2 /* int16 */: return new Int16Array(buffer);
        case 3 /* uint16 */: return new Uint16Array(buffer);
        case 4 /* int32 */: return new Int32Array(buffer);
        case 5 /* uint32 */: return new Uint32Array(buffer);
        case 6 /* float */: return new Float32Array(buffer);
        case 7 /* double */: return new Float64Array(buffer);
    }
}
export function typeName(type) {
    switch (type) {
        case 0 /* int8 */: return 'Int8';
        case 1 /* uint8 */: return 'Uint8';
        case 2 /* int16 */: return 'Int16';
        case 3 /* uint16 */: return 'Uint16';
        case 4 /* int32 */: return 'Int32';
        case 5 /* uint32 */: return 'Uint32';
        case 6 /* float */: return 'Float32';
        case 7 /* double */: return 'Float64';
    }
}
// Read a struct from buffer
export function readTypedValues(buffer, types, startByteOffset = 0) {
    let offset = startByteOffset;
    const view = new DataView(buffer);
    const values = [];
    const readValue = (type) => {
        let value;
        switch (type) {
            case 0 /* int8 */:
                value = view.getInt8(offset);
                offset += 1 /* int8 */;
                break;
            case 1 /* uint8 */:
                value = view.getUint8(offset);
                offset += 1 /* uint8 */;
                break;
            case 2 /* int16 */:
                value = view.getInt16(offset, LE);
                offset += 2 /* int16 */;
                break;
            case 3 /* uint16 */:
                value = view.getUint16(offset, LE);
                offset += 2 /* uint16 */;
                break;
            case 4 /* int32 */:
                value = view.getInt32(offset, LE);
                offset += 4 /* int32 */;
                break;
            case 5 /* uint32 */:
                value = view.getUint32(offset, LE);
                offset += 4 /* uint32 */;
                break;
            case 6 /* float */:
                value = view.getFloat32(offset, LE);
                offset += 4 /* float */;
                break;
            case 7 /* double */:
                value = view.getFloat64(offset, LE);
                offset += 8 /* double */;
                break;
        }
        ;
        return value;
    };
    for (const dataType of types) {
        if (offset >= buffer.byteLength) {
            console.error('readTypedValues: ArrayBuffer overflow');
            break;
        }
        const value = readValue(dataType);
        values.push(value);
    }
    ;
    return values;
}
