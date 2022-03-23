import { FunctionLibrary } from "../ProgramModel/FunctionLib.js";
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
    onContextMenuCreateFunction(name, opcode) {
        const funcCall = this.circuit.createFunctionCallWithOpcode(opcode);
        if (!funcCall) {
            console.error('Could not create function call:', opcode, name);
            return;
        }
        this.addFunctionCall(funcCall);
    }
    onContextMenuCreateCircuitType(name) {
        const funcCall = this.circuit.createFunctionCallWithCircuitType(name);
        if (!funcCall) {
            console.error('Could not create circuit type:', name);
            return;
        }
        this.addFunctionCall(funcCall);
    }
    addFunctionCall(funcCall) {
        const blockType = (funcCall.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(funcCall.opcode)
            : this.circuit.program.getCircuitType(funcCall.circuitType);
        if (!blockType) {
            console.error('Could not find function type for function call:', funcCall.opcode, funcCall.circuitType);
            return;
        }
        const uiBlock = new UIBlock(this, blockType, this.localPointerOffset.snap(this.snap));
        this.append(uiBlock);
        this.uiBlocks.set(funcCall.id, uiBlock);
        uiBlock.events.subscribe('clicked', this.elementSelected.bind(this));
    }
    showContextMenu(pos) {
        const libraryItems = [...FunctionLibrary.libraryMap.entries()].map(([libID, lib]) => {
            return {
                name: lib.name,
                subItems: () => lib.functions.map((func, funcID) => {
                    return {
                        name: func.name,
                        id: FunctionLibrary.encodeOpcode(libID, funcID),
                        action: this.onContextMenuCreateFunction.bind(this)
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
function action() {
}
