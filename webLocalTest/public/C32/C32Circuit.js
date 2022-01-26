import { EventEmitter } from "../Events";
export class C32Circuit {
    constructor(data, link) {
        this.events = new EventEmitter(this);
        link.requestMemData(data.funcList, data.funcCount, 5 /* uint32 */, funcList => {
            this._funcCalls = funcList;
            if (this.complete)
                this.events.emit('complete');
            funcList.forEach(pointer => link.requestInfo(4 /* FUNCTION_INFO */, pointer));
        });
        if (!link.functionBlocks.has(data.pointer))
            link.requestInfo(4 /* FUNCTION_INFO */, data.pointer, () => {
                this.requestOutputRefs();
            });
        else
            this.requestOutputRefs();
        this._data = data;
        this._link = link;
    }
    get data() { return this._data; }
    get funcCalls() { return this._funcCalls; }
    get outputRefs() { return this._outputRefs; }
    get complete() { return (this._funcCalls != null && this._outputRefs != null); }
    remove() {
        this.events.emit('removed');
    }
    requestOutputRefs() {
        const funcData = this._link.functionBlocks.get(this._data.pointer)?.data;
        if (funcData) {
            this._link.requestMemData(this._data.outputRefList, funcData.numOutputs, 5 /* uint32 */, outputRefs => {
                this._outputRefs = outputRefs;
                if (this.complete)
                    this.events.emit('complete');
            });
        }
    }
}
