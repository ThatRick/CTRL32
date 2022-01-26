import { toHex } from '../Util.js';
import { ioConvNames, ioTypeNames, IO_FLAG_CONV_TYPE_MASK, IO_FLAG_TYPE_MASK, parseOpcode } from './C32Types.js';
// ------------------------------------------------------------------------
//      Print Function Block data to log
function functionToString(func, withFlags = true) {
    if (!func.complete) {
        console.error('printFunctionBlock: FunctionBlock data is not complete');
        return;
    }
    const valuePad = 18;
    const typePad = 8;
    const lines = [];
    lines.push('');
    const { lib_id, func_id } = parseOpcode(func.data.opcode);
    lines.push(`Function Block ${func.name}:  id: ${lib_id}/${func_id}  ptr: ${toHex(func.data.pointer)}  flags: ${'b' + func.data.flags.toString(2).padStart(8, '0')}`);
    lines.push('');
    const topLine = ''.padStart(valuePad) + ' ┌─' + ''.padEnd(2 * typePad, '─') + '─┐  ' + ''.padEnd(valuePad);
    lines.push(topLine);
    const monValues = this.monitoringValues;
    for (let i = 0; i < Math.max(func.data.numInputs, func.data.numOutputs); i++) {
        let text;
        // Input value
        if (i < func.data.numInputs) {
            const ioType = func.ioFlags[i] & IO_FLAG_TYPE_MASK;
            const connected = func.ioFlags[i] & 16 /* REF */;
            const inputValue = monValues ? monValues[i] : func.ioValues[i];
            const ioTypeName = ioTypeNames[ioType];
            const valueStr = (!monValues && connected) ? toHex(func.ioValues[i])
                : (ioType == 3 /* FLOAT */) ? inputValue.toPrecision(8)
                    : inputValue.toString();
            const border = connected ? ' ┤>' : ' ┤ ';
            text = valueStr.padStart(valuePad) + border + ioTypeName.padEnd(typePad);
        }
        else
            text = ''.padStart(valuePad) + ' │ ' + ''.padEnd(typePad);
        // Output value
        const outputNum = func.data.numInputs + i;
        if (outputNum < func.ioValues.length) {
            const outputValue = monValues ? monValues[outputNum] : func.ioValues[outputNum];
            const ioType = func.ioFlags[outputNum] & IO_FLAG_TYPE_MASK;
            const ioTypeName = ioTypeNames[ioType];
            const valueStr = (ioType == 3 /* FLOAT */) ? outputValue.toPrecision(8) : outputValue.toString();
            text += ioTypeName.padStart(typePad) + ' ├ ' + valueStr.padEnd(valuePad);
        }
        else
            text += ''.padStart(typePad) + ' │ ' + ''.padEnd(valuePad);
        lines.push(text);
    }
    const bottomLine = ''.padStart(valuePad) + ' └─' + ''.padEnd(2 * typePad, '─') + '─┘  ' + ''.padEnd(valuePad);
    lines.push(bottomLine);
    if (withFlags) {
        lines.push('IO Flags:');
        func.ioFlags.forEach((flags, i) => {
            let ioType = flags & IO_FLAG_TYPE_MASK;
            let convType = flags & IO_FLAG_CONV_TYPE_MASK;
            let line = '';
            line = (line + i + ': ').padStart(20) + flags.toString(2).padStart(8, '0') + '  ' + ioTypeNames[ioType];
            if (flags & 16 /* REF */) {
                line += ' conn. ' + toHex(func.ioValues[i]) + ((flags & 32 /* REF_INVERT */) ? ' (inv) ' : '       ');
                if (convType) {
                    line += 'from ' + ioConvNames[convType];
                }
            }
            lines.push(line);
        });
    }
    return lines;
}
