import { NodeElement } from '../GUI/UIElements.js';
import { TreeNodeView } from '../View/ControllerNavigatorView.js';
export const testTree = [
    {
        name: 'Node1',
        children: [
            {
                name: 'Node1-1'
            }, {
                name: 'Node1-2',
                children: [
                    {
                        name: 'Node1-2-1'
                    }, {
                        name: 'Node1-2-2'
                    }, {
                        name: 'Node1-2-3'
                    }, {
                        name: 'Node1-2-4'
                    }
                ]
            }, {
                name: 'Node1-3',
                children: [
                    {
                        name: 'Node1-3-1'
                    }, {
                        name: 'Node1-3-2'
                    }
                ]
            }
        ]
    },
    {
        name: 'Node2',
        children: [
            {
                name: 'Node2-1',
                children: [
                    {
                        name: 'Node2-1-1'
                    }
                ]
            }, {
                name: 'Node2-2',
                children: [
                    {
                        name: 'Node2-2-1',
                        children: [
                            {
                                name: 'Node2-2-1-1'
                            }, {
                                name: 'Node2-2-1-2'
                            }
                        ]
                    }
                ]
            }, {
                name: 'Node2-3',
                children: [
                    {
                        name: 'Node2-3-1'
                    }, {
                        name: 'Node2-3-2'
                    }
                ]
            }
        ]
    },
];
export class TreeView extends NodeElement {
    constructor(treeInfo) {
        super('div');
        this.treeNodesViews = new Map();
        this.append(...treeInfo.map(nodeInfo => this.createNodeView(nodeInfo)));
    }
    selectNode(targetNode) {
        if (this.selectedNode && this.selectedNode != targetNode) {
            this.selectedNode.deselect();
        }
        this.selectedNode = targetNode;
    }
    createNodeView(treeInfo) {
        const childNodeGetter = treeInfo.children ? () => treeInfo.children?.map(childNode => this.createNodeView(childNode)) : null;
        const nodeView = new TreeNodeView(treeInfo.name, childNodeGetter);
        nodeView.onClick(ev => {
            this.selectNode(nodeView);
            ev.stopPropagation();
        });
        return nodeView;
    }
}
export function createTestTreeView() {
    return new TreeView(testTree);
}
