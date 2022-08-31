import { FunctionLibrary } from "../ProgramModel/FunctionLib.js";
import { NodeElement } from "../UI/NodeElement.js";
import { backgroundGridStyle } from "../UI/UIBackgroundPattern.js";
import { UIContextMenu } from "../UI/UIContextMenu.js";
import { vec2 } from "../Vector2.js";
import { Colors } from "../View/Colors.js";
import { UIBlock } from "./UIBlock.js";
import { UISelection } from './UISelection.js';
export class UICircuit extends NodeElement {
    constructor(circuit, snapSize = vec2(20)) {
        super('div');
        this.uiBlocks = new Map();
        this.uiConnections = new Map();
        this.selection = new UISelection();
        this._snapSize = snapSize;
        this.circuitSource = circuit;
        this.style({
            overflow: 'auto',
            position: 'relative',
            backgroundColor: Colors.Panel,
            ...backgroundGridStyle(snapSize, Colors.PanelElement),
        });
        this.setupCircuitEventHandlers();
        this.setupPointerHandlers();
    }
    // Public API
    get snapSize() { return this._snapSize; }
    set snapSize(size) { this._snapSize = size; }
    onBlockClicked(uiBlock, ev) {
        if (ev.shiftKey)
            this.selection.toggle(uiBlock);
        else
            this.selection.set(uiBlock);
    }
    addFunctionBlock(funcCall) {
        const blockType = (funcCall.opcode > 0) ? FunctionLibrary.getFunctionByOpcode(funcCall.opcode)
            : this.circuitSource.program.getCircuitType(funcCall.circuitType);
        if (!blockType) {
            console.error('Could not find function type for function call:', funcCall.opcode, funcCall.circuitType);
            return;
        }
        const uiBlock = new UIBlock(this, blockType, this.localPointerOffset.snap(this.snapSize));
        this.append(uiBlock);
        this.uiBlocks.set(funcCall.id, uiBlock);
        uiBlock.events.subscribe('clicked', this.onBlockClicked.bind(this));
    }
    // ------------------------------------------------
    //      Context menu and action handlers
    // ------------------------------------------------
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
        this.contextMenu = new UIContextMenu(pos, menuItems);
    }
    onContextMenuCreateFunction(name, opcode) {
        const funcCall = this.circuitSource.createFunctionCallWithOpcode(opcode);
        if (!funcCall) {
            console.error('Could not create function call:', opcode, name);
            return;
        }
        this.addFunctionBlock(funcCall);
    }
    onContextMenuCreateCircuitType(name) {
        const funcCall = this.circuitSource.createFunctionCallWithCircuitType(name);
        if (!funcCall) {
            console.error('Could not create circuit type:', name);
            return;
        }
        this.addFunctionBlock(funcCall);
    }
    onContextMenuSelect(name, index) {
        console.log('Context menu item selected: ', { name, index });
    }
    deselectAll() {
        this.selection.deselectAll();
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
