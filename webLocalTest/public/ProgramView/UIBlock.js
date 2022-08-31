import Vec2, { vec2 } from "../Vector2.js";
import { MovableElement } from "../UI/MovableElement.js";
import { createMoveHandle } from "../UI/UIPointerHandlers.js";
import { UIPort } from "./UIPort.js";
import { Colors } from "../View/Colors.js";
import { TextNode } from "../UI/UIElements.js";
import { EventEmitter } from "../Events.js";
const defaultBlockWidth = 4;
export class UIBlock extends MovableElement {
    constructor(circuit, blockType, pos) {
        super(pos, UIBlock.blockSize(blockType, circuit.snapSize));
        // Public interface
        this.blockEvents = new EventEmitter(this);
        // UICircuitElement interface
        this.typeName = 'Block';
        this.isMovable = true;
        this.ioPorts = [];
        this.circuit = circuit;
        this.style({
            border: 'solid 1px ' + Colors.Base,
            backgroundColor: Colors.PanelElement,
            boxSizing: 'border-box'
        })
            .append(TextNode(blockType.name).align('center')
            .color(Colors.SecondaryText)
            .userSelect('none'), createMoveHandle(this, null, this.snapSize, true).style({
            position: 'absolute',
            top: '0px',
            width: '100%', height: '100%',
        }));
        const titleHeight = blockType.visual.noHeader ? 0 : 1;
        const blockWidth = blockType.visual.width ?? defaultBlockWidth;
        // Create io-ports
        let ioNum = 0;
        blockType.inputs.forEach((input, inputIndex) => {
            const pos = Vec2.mul(vec2(-1, titleHeight + inputIndex), this.circuit.snapSize);
            const inputPort = new UIPort(this, pos, this.circuit.snapSize, 'left', 'input', input.name, ioNum++, input.initValue);
            this.addIOPort(inputPort);
        });
        blockType.outputs.forEach((output, outputIndex) => {
            const pos = Vec2.mul(vec2(blockWidth, titleHeight + outputIndex), this.circuit.snapSize);
            const outputPort = new UIPort(this, pos, this.circuit.snapSize, 'right', 'output', output.name, ioNum++, output.initValue);
            this.addIOPort(outputPort);
        });
    }
    onRemove() {
        this.ioPorts.forEach(ioPort => ioPort.remove());
    }
    get snapSize() { return this.circuit.snapSize; }
    set highlighted(selected) {
        this.node.style.borderColor = selected ? Colors.BorderLight : Colors.Base;
        this.setZIndex(selected ? 6 /* Selection */ : 2 /* Blocks */);
    }
    addIOPort(ioPort) {
        this.ioPorts.push(ioPort);
        ioPort.portEvents.subscribeEvents({
            connected: this.onPortConnected.bind(this),
            disconnected: this.onPortDisconnected.bind(this),
            valueModified: this.onPortValueModified.bind(this)
        }, this);
    }
    onPortConnected(ioPort) {
        this.blockEvents.emit('portConnected', ioPort);
    }
    onPortDisconnected(ioPort) {
        this.blockEvents.emit('portDisconnected', ioPort);
    }
    onPortValueModified(ioPort) {
        this.blockEvents.emit('portValueModified', ioPort);
    }
    // Static
    static blockSize(blockType, snap) {
        const height = (Math.max(blockType.inputs.length, blockType.outputs.length) + (blockType.visual.noHeader ? 0 : 1)) * snap.y;
        const width = snap.x * blockType.visual.width ?? defaultBlockWidth;
        return vec2(width, height);
    }
}
