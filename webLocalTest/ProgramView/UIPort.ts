import { UIConnection } from "./UIConnection.js"
import Vec2 from "../Vector2.js"
import { UIBlock } from "./UIBlock.js"
import { NodeElement } from "../UI/NodeElement.js"

type PortOrientation = 'left' | 'right' | 'up' | 'down'
type PortDataDirection = 'input' | 'output'

export class UIPort extends NodeElement<'div'>
{
    private connection: UIConnection

    private value: number

    private onBlockMoved() {
        this.connection?.update()
    }

    constructor(
        public readonly block:          UIBlock,
        public readonly ioNumber:       number,
        public readonly localOffset:    Vec2,
        public readonly orientation:    PortOrientation,
        public readonly dataDirection:  PortDataDirection,
        public readonly name?:          string
    ) {
        super('div')
        this.block.events.subscribe('moved', this.onBlockMoved)
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