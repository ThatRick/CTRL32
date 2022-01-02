import { toHex } from './Util.js';
const UI = {
    status: document.getElementById('status'),
    console: document.getElementById('console')
};
function consoleBlock(lines) {
    const pre = document.createElement('pre');
    lines.forEach(line => pre.textContent += line + '\n');
    UI.console.appendChild(pre);
}
function consoleData(data) {
    const lines = [];
    for (let key in data) {
        const text = (key + ': ').padStart(20);
        const value = data[key];
        const valueText = (key.endsWith('Ptr') || key.endsWith('List')) ? toHex(value) : value;
        lines.push(text + valueText);
    }
    consoleBlock(lines);
}
function consoleList(values) {
    const lines = [];
    values.forEach((value, i) => {
        const indexStr = (i + ': ').padStart(20);
        lines.push(indexStr + toHex(value));
    });
    consoleBlock(lines);
}
function consoleLine(text) { consoleBlock([text]); }
function setStatus(text) { UI.status.textContent = text; }
export function CreateUI() {
    Object.entries(UI).forEach(([key, elem]) => {
        if (!elem)
            console.error(`UI Element '${key}' not found`);
    });
    UI.console.style.margin = '2px';
    return {
        setStatus,
        consoleLine,
        consoleData,
        consoleList,
        consoleBlock
    };
}
