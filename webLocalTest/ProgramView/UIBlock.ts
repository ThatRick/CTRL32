import Vec2, { vec2 } from "../Vector2.js"
import { MovableElement } from "../UI/MovableElement.js"
import { MoveHandle } from "../UI/UIPointerHandlers.js"
import { UIPort } from "./UIPort.js"
import { IFunctionBlockInterface } from "../ProgramModel/IDataTypes.js"
import { UICircuit } from "./UICircuit.js"
import { Colors } from "../View/Colors.js"
import { TextNode } from "../UI/UIElements.js"

export class UIBlock extends MovableElement
{   
    private selected = false

    private ports: UIPort[] = []

    constructor(circuit: UICircuit, blockType: IFunctionBlockInterface, pos: Vec2) {
        super(pos, UIBlock.blockSize(blockType, circuit.snap))

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
    }

    setSelected(selected: boolean) {
        console.log('Clicked a block')
        this.selected = selected
        this.node.style.borderColor = selected ? Colors.BorderLight : Colors.Base
        this.node.style.zIndex = selected ? '3' : '2'
        return this
    }

    static blockSize(blockType: IFunctionBlockInterface, snap: Vec2) {
        const height = (Math.max(blockType.inputs.length, blockType.outputs.length) + 1) * snap.y
        const width = snap.x * 3
        return vec2(width, height)
    }
}