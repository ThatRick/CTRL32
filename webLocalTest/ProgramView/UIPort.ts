import { UIConnection } from "./UIConnection.js"
import Vec2 from "../Vector2.js"
import { UIBlock } from "./UIBlock.js"
import { NodeElement } from "../UI/NodeElement.js"

type PortOrientation = 'left' | 'right' | 'up' | 'down'
type PortDataDirection = 'input' | 'output'

export class UIPort extends NodeElement
{
    private connection: UIConnection
    private value: number


    private pin: NodeElement

    constructor(
        public readonly block:          UIBlock,
        public readonly ioNumber:       number,
        public readonly localOffset:    Vec2,
        public readonly orientation:    PortOrientation,
        public readonly dataDirection:  PortDataDirection,
        public readonly name:           string,
                        value:          number
    ) {
        super('div')
        this.value = value
        this.block.events.subscribe('moved', this.onBlockMoved)
    }

    private onBlockMoved() {
        this.connection?.update()
    }

    getPosition() {
        return Vec2.add(this.block.currentPos, this.localOffset)
    }

    getValue() {
        return this.value
    }

    setValue(value: number) {
        this.value = value
    }

    connect(connection: UIConnection) {
        this.connection = connection
    }
}