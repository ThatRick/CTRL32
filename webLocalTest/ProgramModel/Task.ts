import { ITaskSource } from "./IDataTypes";

export class ControlTask
{
    protected _id:             number
    protected _functionBlocks: number[]
    protected _interval:       number
    protected _offset:         number

    constructor(id: number) { this._id = id }

    get data(): ITaskSource { return {
        id:             this._id,
        functionBlocks: this._functionBlocks,
        interval:       this._interval,
        offset:         this._offset,
    }}

    get id() { return this._id }
}