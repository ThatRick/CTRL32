import { CircuitSource } from "../ProgramModel/CircuitSource.js"
import { FunctionLibrary } from "../ProgramModel/FunctionLib.js"
import { IFunctionBlockCall, IFunctionBlockType } from "../ProgramModel/IDataTypes.js"
import { MouseButton, NodeElement } from "../UI/NodeElement.js"
import { backgroundGridStyle } from "../UI/UIBackgroundPattern.js"
import { IUIContextMenuItem, UIContextMenu } from "../UI/UIContextMenu.js"
import Vec2, { vec2 } from "../Vector2.js"
import { Colors } from "../View/Colors.js"
import { UIBlock } from "./UIBlock.js"
import { UIConnection } from "./UIConnection.js"
import { UILayerOrder } from './UILayerOrder.js'
import { UISelection } from './UISelection.js'

export { UILayerOrder as UILayers }

export class UICircuit extends NodeElement
{
    constructor(circuit: CircuitSource, snapSize = vec2(20))
    {
        super('div')
        this._snapSize = snapSize
        this.circuitSource = circuit

        this.style({
            overflow: 'auto',
            position: 'relative',
            backgroundColor: Colors.Panel,
            ...backgroundGridStyle(snapSize, Colors.PanelElement),
        })

        this.setupCircuitEventHandlers()
        this.setupPointerHandlers()
    }

    // Public API

    public get snapSize() { return this._snapSize }
    public set snapSize(size: Vec2) { this._snapSize = size }

    // Private

    private circuitSource: CircuitSource
    private _snapSize: Vec2

    private uiBlocks = new Map<number, UIBlock>()
    private uiConnections = new Map<number, UIConnection>()

    private selection = new UISelection()
    private contextMenu: UIContextMenu
    private localPointerOffset: Vec2

    private onBlockClicked(uiBlock: UIBlock, ev: PointerEvent) {
        if (ev.shiftKey)
            this.selection.toggle(uiBlock)
        else
            this.selection.set(uiBlock)
    }

    private addFunctionBlock(funcCall: IFunctionBlockCall) {
        const blockType = (funcCall.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(funcCall.opcode)
                                                : this.circuitSource.program.getCircuitType(funcCall.circuitType)

        if (!blockType) {
            console.error('Could not find function type for function call:', funcCall.opcode, funcCall.circuitType); return
        }
        const uiBlock = new UIBlock(this, blockType, this.localPointerOffset.snap(this.snapSize))
        this.append(uiBlock)
        this.uiBlocks.set(funcCall.id, uiBlock)

        uiBlock.events.subscribe('clicked', this.onBlockClicked.bind(this))
    }

    // ------------------------------------------------
    //      Context menu and action handlers
    // ------------------------------------------------
    private showContextMenu(pos: Vec2) {
        const libraryItems: IUIContextMenuItem[] = [...FunctionLibrary.libraryMap.entries()].map(([libID, lib]) => {
            return {
                name: lib.name,
                subItems: () => lib.functions.map((func, funcID) => {
                    return {
                        name:   func.name,
                        id:     FunctionLibrary.encodeOpcode(libID, funcID),
                        action: this.onContextMenuCreateFunction.bind(this)
                    } as IUIContextMenuItem
                })
            } as IUIContextMenuItem
        })

        const menuItems: IUIContextMenuItem[] = [
            ...libraryItems,
            { name: 'Item A', action: this.onContextMenuSelect },
            { name: 'Item B', action: this.onContextMenuSelect },
        ]

        this.contextMenu = new UIContextMenu(pos, menuItems)
    }

    private onContextMenuCreateFunction(name: string, opcode: number) {
        const funcCall = this.circuitSource.createFunctionCallWithOpcode(opcode)
        if (!funcCall) {
            console.error('Could not create function call:', opcode, name); return
        }
        this.addFunctionBlock(funcCall)
    }

    private onContextMenuCreateCircuitType(name: string) {
        const funcCall = this.circuitSource.createFunctionCallWithCircuitType(name)
        if (!funcCall) {
            console.error('Could not create circuit type:', name); return
        }
        this.addFunctionBlock(funcCall)
    }

    private onContextMenuSelect(name: string, index: number) {
        console.log('Context menu item selected: ', { name, index })
    }

    private deselectAll() {
        this.selection.deselectAll()
        this.contextMenu?.closeSelfAndChildren()
        this.contextMenu = null
    }

    private setupCircuitEventHandlers()
    {

    }

    private setupPointerHandlers()
    {
        this.setPointerHandlers(
        {
            onPointerClick: ev =>
            {
                if (ev.target == this.node) {
                    this.deselectAll()
                }
            },
            onPointerContextMenu: ev =>
            {
                this.localPointerOffset = vec2(ev.offsetX, ev.offsetY)
                
                if (ev.target == this.node)
                {
                    this.deselectAll()
                    this.showContextMenu(vec2(ev.clientX, ev.clientY))
                    ev.preventDefault()
                }
            }
        })
    }
}
