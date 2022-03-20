import Vec2 from "../Vector2.js"
import { UIPolyline } from "./UIPolyline.js"
import { UIPort } from "./UIPort.js"

export class UIConnection
{
    source:     UIPort
    dest:       UIPort
    polyline:   UIPolyline

    constructor(dest: UIPort, source: UIPort, midpoints: Vec2[]) {
        this.dest = dest
        this.source = source

    }

    update() {
        this.polyline.render()
    }
}