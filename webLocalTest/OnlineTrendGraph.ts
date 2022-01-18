export class OnlineTrendGraph
{
    public lineColor = '#44D'
    public bgColor = '#EEE'

    get width() { return this.screenCanvas.width }
    get height() { return this.screenCanvas.height }

    get canvas() { return this.screenCanvas }

    // Add value 0..1
    addValue(value: number) {
        const w = this.offScreenCanvas.width;
        const length = Math.round(value * w)
        this.drawBufferLine(this.offset, length);
        this.blit();

        this.offset += 1;
        if (this.offset >= this.width) this.offset = 0;
    }

    addValues(values: number[]) {
        const w = this.offScreenCanvas.width;
        values.forEach(value => {
            const length = Math.round(value * w)
            this.drawBufferLine(this.offset, length);            
            this.offset += 1;
            if (this.offset >= this.width) this.offset = 0;
        })
        this.blit();
    }

    clear() {
        this.bufferCtx.fillStyle = this.bgColor
        this.bufferCtx.fillRect(0, 0, this.height, this.width)
        this.offset = 0
    }

    protected screenCanvas: HTMLCanvasElement
    protected offScreenCanvas: HTMLCanvasElement
    protected screenCtx: CanvasRenderingContext2D
    protected bufferCtx: CanvasRenderingContext2D

    protected offset: number = 0

    constructor(width: number, height: number)
    {
        this.screenCanvas = document.createElement('canvas')
        this.screenCanvas.width = width
        this.screenCanvas.height = height

        // Off-screen canvas height is On-screen canvas width and vice versa
        this.offScreenCanvas = document.createElement('canvas')
        this.offScreenCanvas.width = height
        this.offScreenCanvas.height = width

        const settings: CanvasRenderingContext2DSettings = {
            alpha: false,
            desynchronized: false 
        }
        this.screenCtx = this.screenCanvas.getContext('2d', settings)!
        this.bufferCtx = this.offScreenCanvas.getContext('2d', settings)!
        
        // move to the center of the canvas for rotation
        this.screenCtx.translate(this.width/2,this.height/2)
        // off-screen canvas is drawn horizontally so canvas drawing is rotated 90 degrees
        this.screenCtx.rotate(-90*Math.PI/180)
        
        this.screenCanvas.style.overflow = 'hidden'

        this.clear()

        // Blit buffer to screen with 90deg rotated
        this.blit()
    }

    protected drawBufferLine(pos: number, length: number) {
        const w = this.offScreenCanvas.width
        this.bufferCtx.fillStyle = this.lineColor
        this.bufferCtx.fillRect(0, pos, length, 1)
        this.bufferCtx.fillStyle = this.bgColor
        this.bufferCtx.fillRect(length, pos, w-length, 1)
    }

    protected blit() {
        // draw the image
        // since the this.ctx is rotated, the image will be rotated also
        this.screenCtx.drawImage(this.offScreenCanvas, -0.5 * this.height, 0.5 * this.width - this.offset - 1);
        if (this.offset > 0) {
            this.screenCtx.drawImage(this.offScreenCanvas, -0.5 * this.height, -0.5 * this.width - this.offset - 1)
        }
    }
}