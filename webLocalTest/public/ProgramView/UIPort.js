import Vec2 from "../Vector2.js";
import { NodeElement } from "../UI/NodeElement.js";
export class UIPort extends NodeElement {
    constructor(block, ioNumber, localOffset, orientation, dataDirection, name, value) {
        super('div');
        this.block = block;
        this.ioNumber = ioNumber;
        this.localOffset = localOffset;
        this.orientation = orientation;
        this.dataDirection = dataDirection;
        this.name = name;
        this.value = value;
        this.block.events.subscribe('moved', this.onBlockMoved);
    }
    onBlockMoved() {
        this.connection?.update();
    }
    getPosition() {
        return Vec2.add(this.block.currentPos, this.localOffset);
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = value;
    }
    connect(connection) {
        this.connection = connection;
    }
}
