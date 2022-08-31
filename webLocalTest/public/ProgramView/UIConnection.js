export class UIConnection {
    constructor(dest, source, midpoints) {
        this.dest = dest;
        this.source = source;
        this.dest.events.subscribeEvents({
            removed: this.onPortRemoved.bind(this)
        });
    }
    update() {
        this.polyline.render();
    }
    onPortRemoved(port) {
    }
}
