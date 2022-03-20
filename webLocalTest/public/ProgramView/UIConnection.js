export class UIConnection {
    constructor(dest, source, midpoints) {
        this.dest = dest;
        this.source = source;
    }
    update() {
        this.polyline.render();
    }
}
