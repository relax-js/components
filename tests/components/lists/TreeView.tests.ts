import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    TreeNode,
    TreeNodeNavigated,
    TreeView
} from '../../../src/components/lists/TreeView';

describe('TreeView Component', () => {
    let treeView: TreeView;

    beforeEach(() => {
        document.body.innerHTML = '';

        treeView = document.createElement('r-treeview') as TreeView;
        document.body.appendChild(treeView);
        return new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('should initialize TreeView component', () => {
        expect(treeView).toBeInstanceOf(TreeView);
        expect(treeView.add).toBeDefined();
        expect(treeView.find).toBeDefined();
    });

    it('should add a node to the tree', () => {
        const node: TreeNode = { label: 'Root Node', data: {} };
        treeView.add(node);

        // Check internal state instead of DOM elements
        const nodes = treeView.find(() => true);
        expect(nodes.length).toBe(1);
        expect(nodes[0].node.label).toBe('Root Node');
    });

    it('should add a child node to a parent node', () => {
        const parent: TreeNode = { label: 'Parent Node', data: {} };
        const child: TreeNode = { label: 'Child Node', data: {} };
        treeView.add(parent);
        treeView.addToParent(child, parent);

        const childNodes = treeView.find(_ => true, parent);
        expect(childNodes.length).toBe(1);
        expect(childNodes[0].node.label).toBe('Child Node');
    });

    it('should find nodes based on filter criteria', () => {
        const nodes: TreeNode[] = [
            { label: 'First Node', data: { id: 1 } },
            { label: 'Second Node', data: { id: 2 } }
        ];
        treeView.render(nodes);

        const results = treeView.find<{ id: number }>((data) => data.id === 2);
        expect(results.length).toBe(1);
        expect(results[0].data.id).toBe(2);
        expect(results[0].node.label).toBe('Second Node');
    });

    it('should dispatch TreeNodeNavigated event when node is selected', () => {
        const node: TreeNode = { label: 'Navigable Node', data: {} };
        treeView.add(node);

        const spy = vi.fn();
        treeView.addEventListener(TreeNodeNavigated.NAME, spy);

        // Use the component's API to select a node programmatically
        // Assuming there's a select method or similar
        treeView.select(node);

        expect(spy).toHaveBeenCalled();
        const event = spy.mock.calls[0][0] as TreeNodeNavigated;
        expect(event.node.label).toBe('Navigable Node');
    });

    it('should throw an error when adding a node without specifying it', () => {
        expect(() =>
            treeView.add(undefined as unknown as TreeNode)
        ).toThrowError('node was not specified');
    });

    it('should throw an error when adding a child node without a parent', () => {
        const child: TreeNode = { label: 'Child Node', data: {} };
        expect(() =>
            treeView.addToParent(child, undefined as unknown as TreeNode)
        ).toThrowError('Parent was not specified');
    });

    it('should mark a node as selected when selected programmatically', () => {
        const node: TreeNode = { label: 'Selectable Node', data: {} };
        treeView.add(node);

        // Select the node programmatically
        treeView.select(node);

        expect(treeView.selected?.label).toBe('Selectable Node');
    });

    it('should find nodes only within specified parent subtree', () => {
        const root1: TreeNode = { label: 'Root 1', data: { id: 1 } };
        const child1: TreeNode = { label: 'Child 1', data: { id: 2 } };
        const grandchild1: TreeNode = {
            label: 'Grandchild 1',
            data: { id: 3 }
        };
        const root2: TreeNode = { label: 'Root 2', data: { id: 4 } };
        const child2: TreeNode = { label: 'Child 2', data: { id: 5 } };
        treeView.add(root1);
        treeView.addToParent(child1, root1);
        treeView.addToParent(grandchild1, child1);
        treeView.add(root2);
        treeView.addToParent(child2, root2);

        // Should find all nodes without parent filter
        const allNodes = treeView.find(() => true);
        expect(allNodes.length).toBe(5);

        // Should find only nodes in root1 subtree
        const root1Subtree = treeView.find(() => true, root1);
        expect(root1Subtree.length).toBe(2);

        // Should find only nodes in root2 subtree
        const root2Subtree = treeView.find(() => true, root2);
        expect(root2Subtree.length).toBe(1);

        // Should find only grandchild nodes in child1 subtree
        const child1Subtree = treeView.find(() => true, child1);
        expect(child1Subtree.length).toBe(1);
        expect(child1Subtree[0].node.label).toBe('Grandchild 1');
    });

    it('should find nodes in subtree based on filter criteria', () => {
        const root: TreeNode = { label: 'Root', data: { type: 'folder' } };
        const child1: TreeNode = {
            label: 'Child 1',
            data: { type: 'file', ext: 'txt' }
        };
        const child2: TreeNode = {
            label: 'Child 2',
            data: { type: 'file', ext: 'pdf' }
        };
        treeView.add(root);
        treeView.addToParent(child1, root);
        treeView.addToParent(child2, root);

        // Find only PDF files in root subtree
        const pdfFiles = treeView.find<{ type: string; ext?: string }>(
            (data) => data.type === 'file' && data.ext === 'pdf',
            root
        );

        expect(pdfFiles.length).toBe(1);
        expect(pdfFiles[0].node.label).toBe('Child 2');
    });

    // Tests for the new select method
    it('should return false when trying to select a non-existent node', () => {
        const nonExistentNode: TreeNode = { label: 'Non-existent', data: {} };
        const result = treeView.select(nonExistentNode);
        expect(result).toBe(false);
    });

    it('should return true when selecting an existing node', () => {
        const node: TreeNode = { label: 'Existing Node', data: {} };
        treeView.add(node);

        const result = treeView.select(node);
        expect(result).toBe(true);
    });

    it('should expand path to node when selecting a deeply nested node', () => {
        // Create nested structure
        const root: TreeNode = { label: 'Root', data: {}, children: [] };
        const level1: TreeNode = { label: 'Level 1', data: {}, children: [] };
        const level2: TreeNode = { label: 'Level 2', data: {}, children: [] };
        const level3: TreeNode = { label: 'Level 3', data: {} };
        treeView.add(root);
        treeView.addToParent(level1, root);
        treeView.addToParent(level2, level1);
        treeView.addToParent(level3, level2);
        let isSelected = false;

        // Spy on the TreeNodeNavigated event
        treeView.addEventListener(TreeNodeNavigated.NAME, () => isSelected = true);

        // Select the deeply nested node
        treeView.select(level3);

        // Verify that the node is selected
        expect(treeView.selected).toBe(level3);
        expect(isSelected).toBeTruthy();

        // Check that the expanded property is set on all parent nodes
        expect(root.expanded).toBeTruthy();
        expect(level1.expanded).toBeTruthy();
        expect(level2.expanded).toBeTruthy();
    });
});
