import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "../UI/MovableElement.js"
import { MoveHandle } from "../UI/UIPointerHandlers.js"
import { UIPort } from "./UIPort.js"
import { IFunctionBlockType } from "../ProgramModel/IDataTypes.js"
import { UICircuit } from "./UICircuit.js"
import { Colors } from "../View/Colors.js"
import { TextNode } from "../UI/UIElements.js"

const defaultBlockWidth = 4

export class UIBlock extends MovableElement
{   
    private selected = false
    private circuit: UICircuit

    private ioPorts: UIPort[] = []

    constructor(circuit: UICircuit, blockType: IFunctionBlockType, pos: Vec2) {
        super(pos, UIBlock.blockSize(blockType, circuit.snap))
        this.circuit = circuit
        this.backgroundColor('gray')
            .setPosSnap(circuit.snap)
            .style({
                border: 'solid 1px ' + Colors.Base,
                backgroundColor: Colors.PanelElement
            })
            .append(
                TextNode(blockType.name).align('center')
                    .color(Colors.SecondaryText)
                    .userSelect('none')
            )
        
        MoveHandle(this, this)

        const titleHeight = blockType.visual.noHeader ? 0 : 1
        const blockWidth = blockType.visual.width ?? defaultBlockWidth

        // Create io-ports
        let ioNum = 0
        blockType.inputs.forEach((input, inputIndex) => {
            const pos = Vec2.mul(vec2(-1, titleHeight + inputIndex), this.circuit.snap)
            const inputPort = new UIPort(this, ioNum++, pos, 'left', 'input', input.name, input.initValue)
            this.addIOPort(inputPort)
        })
        blockType.outputs.forEach((output, outputIndex) => {
            const pos = Vec2.mul(vec2(blockWidth, titleHeight + outputIndex), this.circuit.snap)
            const outputPort = new UIPort(this, ioNum++, pos, 'right', 'output', output.name, output.initValue)
            this.addIOPort(outputPort)
        })
    }

    private addIOPort(ioPort: UIPort) {
        this.ioPorts.push(ioPort)
    }

    setSelected(selected: boolean) {
        this.selected = selected
        this.node.style.borderColor = selected ? Colors.BorderLight : Colors.Base
        this.node.style.zIndex = selected ? '3' : '2'
        return this
    }

    static blockSize(blockType: IFunctionBlockType, snap: Vec2) {
        const height = (Math.max(blockType.inputs.length, blockType.outputs.length) + (blockType.visual.noHeader ? 0 : 1)) * snap.y
        const width = snap.x * blockType.visual.width ?? defaultBlockWidth
        return vec2(width, height)
    }
}