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

export class UICircuit extends NodeElement
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

    private onContextMenuCreateFunction(name: string, opcode: number) {
        const funcCall = this.circuit.createFunctionCallWithOpcode(opcode)
        if (!funcCall) {
            console.error('Could not create function call:', opcode, name); return
        }
        this.addFunctionCall(funcCall)
    }

    private onContextMenuCreateCircuitType(name: string) {
        const funcCall = this.circuit.createFunctionCallWithCircuitType(name)
        if (!funcCall) {
            console.error('Could not create circuit type:', name); return
        }
        this.addFunctionCall(funcCall)
    }

    private addFunctionCall(funcCall: IFunctionBlockCall) {
        const blockType = (funcCall.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(funcCall.opcode)
                                                : this.circuit.program.getCircuitType(funcCall.circuitType)

        if (!blockType) {
            console.error('Could not find function type for function call:', funcCall.opcode, funcCall.circuitType); return
        }
        const uiBlock = new UIBlock(this, blockType, this.localPointerOffset.snap(this.snap))
        this.append(uiBlock)
        this.uiBlocks.set(funcCall.id, uiBlock)

        uiBlock.events.subscribe('clicked', this.elementSelected.bind(this))
    }

    private showContextMenu(pos: Vec2) {
        const libraryItems: IUIContextMenuItem[] = [...FunctionLibrary.libraryMap.entries()].map(([libID, lib]) => {
            return {
                name: lib.name,
                subItems: () => lib.functions.map((func, funcID) => {
                    return {
                        name:   func.name,
                        id:     FunctionLibrary.encodeOpcode(libID, funcID),
                        action: this.onContextMenuCreateFunction.bind(this)
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

function action(this: UICircuit) {
}