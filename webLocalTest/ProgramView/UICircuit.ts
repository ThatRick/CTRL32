import { CircuitSource } from "../ProgramModel/CircuitSource.js"
import { FunctionLibrary } from "../ProgramModel/FunctionLib/FunctionLib.js"
import { IFunctionBlockType } from "../ProgramModel/IDataTypes.js"
import { MouseButton, NodeElement } from "../UI/NodeElement.js"
import { backgroundGridStyle } from "../UI/UIBackgroundPattern.js"
import { IUIContextMenuItem, UIContextMenu } from "../UI/UIContextMenu.js"
import Vec2, { vec2 } from "../Vector2.js"
import { Colors } from "../View/Colors.js"
import { UIBlock } from "./UIBlock.js"
import { UIConnection } from "./UIConnection.js"

export class UICircuit extends NodeElement<'div'>
{
    constructor(circuit: CircuitSource, snap = vec2(20))
    {
        super('div')
        this._snap = snap
        this.circuit = circuit

        this.style({
            overflow: 'auto',
            position: 'relative',
            backgroundColor: Colors.Panel,
            ...backgroundGridStyle(snap, Colors.PanelElement),
        })

        this.setupCircuitEventHandlers()
        this.setupPointerHandlers()
    }

    get snap() { return this._snap }
    set snap(value: Vec2) { this._snap = value }

    private circuit: CircuitSource
    private _snap: Vec2

    private uiBlocks = new Map<number, UIBlock>()
    private uiConnections = new Map<number, UIConnection>()

    private selection: UIBlock
    private contextMenu: UIContextMenu
    private localPointerOffset: Vec2

    private elementSelected(elem: UIBlock, ev: PointerEvent) {
        // ev.stopPropagation()
        if (this.selection) this.selection.setSelected(false)
        this.selection = elem
        this.selection.setSelected(true)
    }

    private showContextMenu(pos: Vec2) {
        const libraryItems: IUIContextMenuItem[] = [...FunctionLibrary.libraryMap.entries()].map(([libID, lib]) => {
            return {
                name: lib.name,
                subItems: () => lib.functions.map((func, funcID) => {
                    return {
                        name: func.name,
                        action: () => {
                            const opcode = FunctionLibrary.encodeOpcode(libID, funcID)
                            this.circuit.createFunctionCallWithOpcode(opcode)
                        }
                    }
                })
            }
        })
        const menuItems: IUIContextMenuItem[] = [
            ...libraryItems,
            { name: 'Item A', action: this.onContextMenuSelect },
            { name: 'Item B', action: this.onContextMenuSelect },
        ]
        console.log(menuItems)

        this.contextMenu = new UIContextMenu(pos, menuItems)
    }

    private onContextMenuSelect(name: string, index: number) {
        console.log('Context menu item selected: ', { name, index })
    }

    private deselectAll() {
        if (this.selection) this.selection.setSelected(false)
        this.contextMenu?.closeSelfAndChildren()
        this.contextMenu = null
    }

    private setupCircuitEventHandlers()
    {
        this.circuit.events.subscribeEvents(
        {
            functionCallAdded: (_, id: number) => {
                const func = this.circuit.getFunctionCall(id)
                const blockType = (func.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(func.opcode)
                                                    : this.circuit.program.getCircuitType(func.circuitType)
                if (!blockType) {
                    console.error('Could not find block interface for opcode (circuit type)', func.opcode, func.circuitType); return
                }

                const uiBlock = new UIBlock(this, blockType, this.localPointerOffset)
                this.append(uiBlock)
                this.uiBlocks.set(func.id, uiBlock)
            }
        })
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