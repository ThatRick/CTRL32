import { FunctionLibrary } from "../ProgramModel/FunctionLib/FunctionLib.js";
import { NodeElement } from "../UI/NodeElement.js";
import { backgroundGridStyle } from "../UI/UIBackgroundPattern.js";
import { UIContextMenu } from "../UI/UIContextMenu.js";
import { vec2 } from "../Vector2.js";
import { Colors } from "../View/Colors.js";
import { UIBlock } from "./UIBlock.js";
export class UICircuit extends NodeElement {
    constructor(circuit, snap = vec2(20)) {
        super('div');
        this.uiBlocks = new Map();
        this.uiConnections = new Map();
        this._snap = snap;
        this.circuit = circuit;
        this.style({
            overflow: 'auto',
            position: 'relative',
            backgroundColor: Colors.Panel,
            ...backgroundGridStyle(snap, Colors.PanelElement),
        });
        this.setupCircuitEventHandlers();
        this.setupPointerHandlers();
    }
    get snap() { return this._snap; }
    set snap(value) { this._snap = value; }
    elementSelected(elem, ev) {
        // ev.stopPropagation()
        if (this.selection)
            this.selection.setSelected(false);
        this.selection = elem;
        this.selection.setSelected(true);
    }
    showContextMenu(pos) {
        const libraryItems = [...FunctionLibrary.libraryMap.entries()].map(([libID, lib]) => {
            return {
                name: lib.name,
                subItems: () => lib.functions.map((func, funcID) => {
                    return {
                        name: func.name,
                        action: () => {
                            const opcode = FunctionLibrary.encodeOpcode(libID, funcID);
                            this.circuit.createFunctionCallWithOpcode(opcode);
                        }
                    };
                })
            };
        });
        const menuItems = [
            ...libraryItems,
            { name: 'Item A', action: this.onContextMenuSelect },
            { name: 'Item B', action: this.onContextMenuSelect },
        ];
        console.log(menuItems);
        this.contextMenu = new UIContextMenu(pos, menuItems);
    }
    onContextMenuSelect(name, index) {
        console.log('Context menu item selected: ', { name, index });
    }
    deselectAll() {
        if (this.selection)
            this.selection.setSelected(false);
        this.contextMenu?.closeSelfAndChildren();
        this.contextMenu = null;
    }
    setupCircuitEventHandlers() {
        this.circuit.events.subscribeEvents({
            functionCallAdded: (_, id) => {
                const func = this.circuit.getFunctionCall(id);
                const blockType = (func.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(func.opcode)
                    : this.circuit.program.getCircuitType(func.circuitType);
                if (!blockType) {
                    console.error('Could not find block interface for opcode (circuit type)', func.opcode, func.circuitType);
                    return;
                }
                const uiBlock = new UIBlock(this, blockType, this.localPointerOffset);
                this.append(uiBlock);
                this.uiBlocks.set(func.id, uiBlock);
            }
        });
    }
    setupPointerHandlers() {
        this.setPointerHandlers({
            onPointerClick: ev => {
                if (ev.target == this.node) {
                    this.deselectAll();
                }
            },
            onPointerContextMenu: ev => {
                this.localPointerOffset = vec2(ev.offsetX, ev.offsetY);
                if (ev.target == this.node) {
                    this.deselectAll();
                    this.showContextMenu(vec2(ev.clientX, ev.clientY));
                    ev.preventDefault();
                }
            }
        });
    }
}
