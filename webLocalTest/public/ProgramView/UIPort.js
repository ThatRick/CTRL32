import Vec2, { vec2 } from "../Vector2.js";
import { NodeElement } from "../UI/NodeElement.js";
import { Colors } from "../View/Colors.js";
const pinWidth = 0.5;
const pinHeight = 0.15;
const pinGraphicsByOrientation = {
    left: {
        size: vec2(pinWidth, pinHeight),
        offset: vec2(pinWidth, 0.5 - pinHeight / 2)
    },
    right: {
        size: vec2(pinWidth, pinHeight),
        offset: vec2(0.0, 0.5 - pinHeight / 2)
    },
    up: {
        size: vec2(pinHeight, pinWidth),
        offset: vec2(0.5 - pinHeight / 2, pinWidth)
    },
    down: {
        size: vec2(pinHeight, pinWidth),
        offset: vec2(0.5 - pinHeight / 2, 0.0)
    }
};
export class UIPort extends NodeElement {
    constructor(parent, offset, snap, orientation, dataDirection, name, value) {
        super('div');
        this.parent = parent;
        this.offset = offset;
        this.snap = snap;
        this.orientation = orientation;
        this.dataDirection = dataDirection;
        this.name = name;
        this.value = value;
        this.position(offset, 'absolute');
        this.size(snap);
        this.node.style.cursor = 'default';
        this.parent.append(this);
        this.parent.events.subscribe('moved', this.onParentMoved.bind(this));
        this.drawPin();
    }
    onParentMoved() {
        this.connection?.update();
    }
    drawPin() {
        if (this.pin)
            this.pin.remove();
        const pinGraphics = pinGraphicsByOrientation[this.orientation];
        const size = Vec2.mul(this.snap, pinGraphics.size).round();
        const offset = Vec2.mul(this.snap, pinGraphics.offset).round();
        this.pin = new NodeElement('div')
            .size(size)
            .position(offset, 'absolute')
            .backgroundColor(Colors.Link);
        this.append(this.pin);
    }
    getPosition() {
        return Vec2.add(this.parent.currentPos, this.offset);
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
