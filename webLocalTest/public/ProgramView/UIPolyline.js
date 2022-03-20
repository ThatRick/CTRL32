import { EventEmitter } from "../Events.js";
import Vec2, { vec2 } from "../Vector2.js";
import { UIPointHandle } from "./UIPointHandle.js";
const xmlns = 'http://www.w3.org/2000/svg';
export class UIPolyline {
    constructor(points, snap, parent) {
        this.pointHandles = [];
        this.updateRequest = null;
        this.svgSizeMargin = vec2(4);
        this.events = new EventEmitter(this);
        this.svg = document.createElementNS(xmlns, 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.userSelect = 'visible';
        this.svg.setAttributeNS(null, 'pointer-events', 'visibleStroke');
        this.polyline = document.createElementNS(xmlns, 'polyline');
        this.polyline.style.fill = 'none';
        this.polyline.style.stroke = 'white';
        this.polyline.style.strokeWidth = '2px';
        this.polyline.setAttributeNS(null, 'pointer-events', 'visibleStroke');
        this.polyline.onclick = ev => this.events.emit('lineClicked', ev);
        this.svg.appendChild(this.polyline);
        this.parent = parent;
        this.parent.appendChild(this.svg);
        this.snap = snap;
        points.forEach(pos => this.addPoint(pos));
        this.setSelected(false);
        this.render();
    }
    setSelected(selected) {
        this.selected = selected;
        this.polyline.style.stroke = selected ? 'PowderBlue' : 'GhostWhite';
        this.pointHandles.forEach(handle => handle.node.style.display = selected ? 'block' : 'none');
    }
    render() {
        const positions = this.pointHandles.map(handle => Vec2.add(handle.currentPos, Vec2.scale(handle.currentSize, 1 / 2)));
        const minPos = positions.reduce((min, pos) => Vec2.min(min, pos), vec2(Number.MAX_VALUE)).sub(this.svgSizeMargin);
        const maxPos = positions.reduce((max, pos) => Vec2.max(max, pos), vec2(Number.MIN_VALUE)).add(this.svgSizeMargin);
        const svgSize = Vec2.sub(maxPos, minPos);
        const shiftedPositions = positions.map(pos => Vec2.sub(pos, minPos));
        const pointsStr = shiftedPositions.reduce((points, pos) => points + `${pos.x},${pos.y} `, '');
        this.polyline.setAttributeNS(null, 'points', pointsStr);
        Object.assign(this.svg.style, {
            left: minPos.x + 'px',
            top: minPos.y + 'px',
            width: svgSize.x + 'px',
            height: svgSize.y + 'px'
        });
        this.updateRequest = null;
    }
    addPoint(pos) {
        const handle = new UIPointHandle(pos, this.snap);
        handle.events.subscribe('moved', this.requestUpdate.bind(this));
        this.pointHandles.push(handle);
        this.parent.appendChild(handle.node);
    }
    requestUpdate() {
        if (!this.updateRequest)
            this.updateRequest = requestAnimationFrame(this.render.bind(this));
    }
}
