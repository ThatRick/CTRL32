import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "../UI/MovableElement.js"
import { createMoveHandle } from "../UI/UIPointerHandlers.js"
import { UIPort } from "./UIPort.js"
import { IFunctionBlockType } from "../ProgramModel/IDataTypes.js"
import { UICircuit, UILayers } from "./UICircuit.js"
import { Colors } from "../View/Colors.js"
import { Div, TextNode } from "../UI/UIElements.js"
import { UICircuitElement } from "./UICircuitElement.js"
import { EventEmitter } from "../Events.js"

const defaultBlockWidth = 4

export class UIBlock extends MovableElement implements UICircuitElement
{   
    constructor(circuit: UICircuit, blockType: IFunctionBlockType, pos: Vec2) {
        super(pos, UIBlock.blockSize(blockType, circuit.snapSize))
        this.circuit = circuit
        
        this.style({
                border: 'solid 1px ' + Colors.Base,
                backgroundColor: Colors.PanelElement,
                boxSizing: 'border-box'
            })
            .append(
                TextNode(blockType.name).align('center')
                    .color(Colors.SecondaryText)
                    .userSelect('none'),

                createMoveHandle(this, null, this.snapSize, true).style({
                    position: 'absolute',
                    top: '0px',
                    width: '100%', height: '100%',
                })
            )
        
        const titleHeight = blockType.visual.noHeader ? 0 : 1
        const blockWidth = blockType.visual.width ?? defaultBlockWidth

        // Create io-ports
        let ioNum = 0
        blockType.inputs.forEach((input, inputIndex) => {
            const pos = Vec2.mul(vec2(-1, titleHeight + inputIndex), this.circuit.snapSize)
            const inputPort = new UIPort(this, pos, this.circuit.snapSize, 'left', 'input', input.name, ioNum++, input.initValue)
            this.addIOPort(inputPort)
        })
        blockType.outputs.forEach((output, outputIndex) => {
            const pos = Vec2.mul(vec2(blockWidth, titleHeight + outputIndex), this.circuit.snapSize)
            const outputPort = new UIPort(this, pos, this.circuit.snapSize, 'right', 'output', output.name, ioNum++, output.initValue)
            this.addIOPort(outputPort)
        })
    }

    protected onRemove() {
        this.ioPorts.forEach(ioPort => ioPort.remove())
    }

    // Public interface

    blockEvents = new EventEmitter<typeof this, 'portConnected' | 'portDisconnected' | 'portValueModified' | 'portSelected'>(this)

    get snapSize() { return this.circuit.snapSize }

    // UICircuitElement interface

    readonly typeName = 'Block'
    readonly isMovable = true

    set highlighted(selected: boolean) {
        this.node.style.borderColor = selected ? Colors.BorderLight : Colors.Base
        this.setZIndex(selected ? UILayers.Selection : UILayers.Blocks)
    }

    // Private

    private circuit: UICircuit
    private ioPorts: UIPort[] = []

    private addIOPort(ioPort: UIPort) {
        ioPort.events.subscribeEvents({
            clicked: this.onPortSelected.bind(this)
        })

        ioPort.portEvents.subscribeEvents({
            connected: this.onPortConnected.bind(this),
            disconnected: this.onPortDisconnected.bind(this),
            valueModified: this.onPortValueModified.bind(this)
        }, this)

        this.ioPorts.push(ioPort)
    }

    private onPortConnected(ioPort: UIPort) {
        this.blockEvents.emit('portConnected', ioPort)
    }

    private onPortDisconnected(ioPort: UIPort) {
        this.blockEvents.emit('portDisconnected', ioPort)
    }

    private onPortValueModified(ioPort: UIPort) {
        this.blockEvents.emit('portValueModified', ioPort)
    }

    private onPortSelected(ioPort: UIPort) {
        this.blockEvents.emit('portSelected', ioPort)
    }

    // Static

    static blockSize(blockType: IFunctionBlockType, snap: Vec2) {
        const height = (Math.max(blockType.inputs.length, blockType.outputs.length) + (blockType.visual.noHeader ? 0 : 1)) * snap.y
        const width = snap.x * blockType.visual.width ?? defaultBlockWidth
        return vec2(width, height)
    }
}