export class ControlTask {
    constructor(id) { this._id = id; }
    get data() {
        return {
            id: this._id,
            functionBlocks: this._functionBlocks,
            interval: this._interval,
            offset: this._offset,
        };
    }
    get id() { return this._id; }
}
