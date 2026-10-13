import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/data-display/treeview/Treeview';
import type { NodeNavigatedEvent, TreeNode, Treeview } from '../../../src/data-display/treeview/Treeview';

interface FileData {
    id: number;
    kind: 'folder' | 'file';
}

function sampleNodes(): TreeNode<FileData>[] {
    return [
        {
            label: 'Documents',
            data: { id: 1, kind: 'folder' },
            children: [
                { label: 'Report.pdf', data: { id: 2, kind: 'file' } },
                {
                    label: 'Archive',
                    data: { id: 3, kind: 'folder' },
                    children: [{ label: 'Old.pdf', data: { id: 4, kind: 'file' } }],
                },
            ],
        },
        { label: 'Notes.txt', data: { id: 5, kind: 'file' } },
    ];
}

function mountTree(): Treeview<FileData> {
    const { element } = mount<Treeview<FileData>>('r-treeview');
    element.nodes = sampleNodes();
    return element;
}

function itemLabelled(tree: Treeview<FileData>, label: string): HTMLLIElement {
    return Array.from(tree.querySelectorAll<HTMLLIElement>('.node')).find(
        (item) => item.querySelector(':scope > .node-row .label')!.textContent === label
    )!;
}

function byId(tree: Treeview<FileData>, id: number): TreeNode<FileData> {
    return tree.find((data) => data.id === id)[0];
}

describe('r-treeview', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('nodes_are_drawn_in_the_light_dom_with_children_nested', () => {
        const tree = mountTree();

        expect(tree.shadowRoot).toBeNull();
        expect(itemLabelled(tree, 'Old.pdf').closest('.children')!.parentElement).toBe(itemLabelled(tree, 'Archive'));
    });

    it('setting_nodes_again_replaces_the_tree', () => {
        const tree = mountTree();

        tree.nodes = [{ label: 'Only', data: { id: 9, kind: 'file' } }];

        expect(tree.querySelectorAll('.node')).toHaveLength(1);
    });

    it('nodes_set_before_connecting_are_drawn_on_connect', () => {
        const tree = document.createElement('r-treeview') as Treeview<FileData>;
        tree.nodes = sampleNodes();

        mount(tree);

        expect(tree.querySelectorAll('.node')).toHaveLength(5);
    });

    it('moving_the_tree_in_the_dom_does_not_draw_it_again', () => {
        const tree = mountTree();
        const elsewhere = document.createElement('div');
        document.body.append(elsewhere);

        elsewhere.append(tree);

        expect(tree.querySelectorAll(':scope > .tree')).toHaveLength(1);
        expect(tree.querySelectorAll('.node')).toHaveLength(5);
    });

    it('branches_start_collapsed_unless_marked_expanded', () => {
        const { element } = mount<Treeview<FileData>>('r-treeview');
        const nodes = sampleNodes();
        nodes[0].expanded = true;
        element.nodes = nodes;

        expect(itemLabelled(element, 'Documents').getAttribute('aria-expanded')).toBe('true');
        expect(itemLabelled(element, 'Archive').getAttribute('aria-expanded')).toBe('false');
        expect(itemLabelled(element, 'Notes.txt').hasAttribute('aria-expanded')).toBe(false);
    });

    it('branches_show_an_arrow_icon_and_leaves_show_none', () => {
        const tree = mountTree();

        expect(itemLabelled(tree, 'Documents').querySelector(':scope > .node-row r-icon')!.getAttribute('name')).toBe(
            'chevron-right'
        );
        expect(itemLabelled(tree, 'Notes.txt').querySelector('r-icon')).toBeNull();
    });

    it('inline_json_in_a_data_template_is_drawn_without_code', () => {
        document.body.innerHTML = `
            <r-treeview>
                <template name="data">[{ "label": "Root", "data": { "id": 1 }, "children": [{ "label": "Child", "data": { "id": 2 } }] }]</template>
            </r-treeview>`;
        const tree = document.querySelector('r-treeview')!;

        expect(Array.from(tree.querySelectorAll('.label')).map((label) => label.textContent)).toEqual(['Root', 'Child']);
    });

    it('invalid_inline_json_reports_an_error_and_renders_empty', () => {
        const reported = captureProblems();
        document.body.innerHTML = '<r-treeview><template name="data">[{ label: </template></r-treeview>';

        expect(document.querySelectorAll('.node')).toHaveLength(0);
        expect(reported.messages()).toContainEqual(expect.stringMatching(/^r-treeview: the data template is not valid JSON/));
    });

    it('clicking_a_label_selects_the_node_and_reports_it', () => {
        const tree = mountTree();
        const navigated: string[] = [];
        tree.addEventListener('r-node-navigated', (event: NodeNavigatedEvent) => navigated.push(event.node.label));

        itemLabelled(tree, 'Notes.txt').querySelector<HTMLElement>('.label')!.click();

        expect(navigated).toEqual(['Notes.txt']);
        expect(tree.selected?.label).toBe('Notes.txt');
        expect(itemLabelled(tree, 'Notes.txt').getAttribute('aria-selected')).toBe('true');
    });

    it('clicking_the_arrow_toggles_the_branch_without_selecting_it', () => {
        const tree = mountTree();
        const listener = vi.fn();
        tree.addEventListener('r-node-navigated', listener);
        const documents = itemLabelled(tree, 'Documents');

        documents.querySelector<HTMLElement>(':scope > .node-row .toggle')!.click();
        expect(documents.getAttribute('aria-expanded')).toBe('true');

        documents.querySelector<HTMLElement>(':scope > .node-row .toggle')!.click();
        expect(documents.getAttribute('aria-expanded')).toBe('false');
        expect(listener).not.toHaveBeenCalled();
    });

    it('selecting_from_code_expands_every_ancestor_and_moves_the_selection', () => {
        const tree = mountTree();
        tree.select(byId(tree, 5));

        tree.select(byId(tree, 4));

        expect(itemLabelled(tree, 'Documents').getAttribute('aria-expanded')).toBe('true');
        expect(itemLabelled(tree, 'Archive').getAttribute('aria-expanded')).toBe('true');
        expect(itemLabelled(tree, 'Notes.txt').getAttribute('aria-selected')).toBe('false');
        expect(itemLabelled(tree, 'Old.pdf').getAttribute('aria-selected')).toBe('true');
    });

    it('selecting_a_node_the_tree_does_not_hold_throws', () => {
        const tree = mountTree();

        expect(() => tree.select({ label: 'Stranger', data: { id: 99, kind: 'file' } })).toThrow(
            /r-treeview: node 'Stranger' is not in this tree/
        );
    });

    it('find_returns_matching_nodes_in_display_order', () => {
        const tree = mountTree();

        expect(tree.find((data) => data.kind === 'file').map((node) => node.label)).toEqual([
            'Report.pdf',
            'Old.pdf',
            'Notes.txt',
        ]);
    });

    it('find_under_a_node_searches_only_its_descendants', () => {
        const tree = mountTree();

        expect(tree.find((data) => data.kind === 'file', byId(tree, 3)).map((node) => node.label)).toEqual(['Old.pdf']);
    });

    it('a_node_added_without_parent_goes_last_at_the_top_level', () => {
        const tree = mountTree();

        tree.add({ label: 'Last', data: { id: 6, kind: 'file' } });

        expect(Array.from(tree.querySelectorAll(':scope > .tree > .node > .node-row .label')).map((l) => l.textContent)).toEqual([
            'Documents',
            'Notes.txt',
            'Last',
        ]);
    });

    it('a_node_added_to_a_leaf_turns_it_into_a_collapsed_branch', () => {
        const tree = mountTree();
        const notes = byId(tree, 5);

        tree.add({ label: 'Attachment', data: { id: 7, kind: 'file' } }, notes);

        expect(itemLabelled(tree, 'Notes.txt').getAttribute('aria-expanded')).toBe('false');
        expect(tree.find((data) => data.id === 7, notes)).toHaveLength(1);
    });

    it('arrow_right_expands_a_collapsed_branch', () => {
        const tree = mountTree();
        const documents = itemLabelled(tree, 'Documents');

        documents.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

        expect(documents.getAttribute('aria-expanded')).toBe('true');
    });

    it('expand_and_collapse_from_code_change_visibility_without_selecting_or_dispatching', () => {
        const tree = mountTree();
        const listener = vi.fn();
        tree.addEventListener('r-node-navigated', listener);
        const documents = itemLabelled(tree, 'Documents');

        tree.expand(byId(tree, 1));
        expect(documents.getAttribute('aria-expanded')).toBe('true');
        tree.collapse(byId(tree, 1));
        expect(documents.getAttribute('aria-expanded')).toBe('false');

        expect(listener).not.toHaveBeenCalled();
        expect(tree.selected).toBeUndefined();
    });

    it('expand_or_collapse_on_a_leaf_changes_nothing', () => {
        const tree = mountTree();
        const notes = itemLabelled(tree, 'Notes.txt');

        tree.expand(byId(tree, 5));
        tree.collapse(byId(tree, 5));

        expect(notes.hasAttribute('aria-expanded')).toBe(false);
    });

    it('collapsing_a_branch_holding_the_focused_node_moves_focus_to_the_branch_and_keeps_the_selection', () => {
        const tree = mountTree();
        tree.select(byId(tree, 4));
        const old = itemLabelled(tree, 'Old.pdf');
        old.focus();
        expect(document.activeElement).toBe(old);

        tree.collapse(byId(tree, 1));

        const documents = itemLabelled(tree, 'Documents');
        expect(document.activeElement).toBe(documents);
        expect(documents.tabIndex).toBe(0);
        expect(old.tabIndex).toBe(-1);
        expect(tree.selected?.label).toBe('Old.pdf');
    });

    it('arrow_down_skips_the_children_of_collapsed_branches', () => {
        const tree = mountTree();
        const documents = itemLabelled(tree, 'Documents');

        documents.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

        expect(itemLabelled(tree, 'Notes.txt').tabIndex).toBe(0);
    });

    function press(item: Element, key: string): void {
        item.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    function tabStops(tree: Treeview<FileData>): string[] {
        return Array.from(tree.querySelectorAll<HTMLLIElement>('.node'))
            .filter((item) => item.tabIndex === 0)
            .map((item) => item.querySelector(':scope > .node-row .label')!.textContent!);
    }

    it('clicking_the_selected_node_again_dispatches_the_event_again', () => {
        const tree = mountTree();
        const listener = vi.fn();
        tree.addEventListener('r-node-navigated', listener);
        const label = itemLabelled(tree, 'Notes.txt').querySelector<HTMLElement>('.label')!;

        label.click();
        label.click();

        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('node_navigated_bubbles_to_ancestors_of_the_tree', () => {
        const tree = mountTree();
        const listener = vi.fn();
        document.body.addEventListener('r-node-navigated', listener);

        tree.select(byId(tree, 5));

        document.body.removeEventListener('r-node-navigated', listener);
        expect(listener).toHaveBeenCalledTimes(1);
        expect((listener.mock.calls[0][0] as NodeNavigatedEvent).bubbles).toBe(true);
        expect((listener.mock.calls[0][0] as NodeNavigatedEvent).node.label).toBe('Notes.txt');
    });

    it('select_from_code_dispatches_the_event_with_the_node', () => {
        const tree = mountTree();
        const navigated: string[] = [];
        tree.addEventListener('r-node-navigated', (event: NodeNavigatedEvent) => navigated.push(event.node.label));

        tree.select(byId(tree, 4));

        expect(navigated).toEqual(['Old.pdf']);
        expect(tree.selected?.label).toBe('Old.pdf');
    });

    it('selected_is_undefined_before_any_selection', () => {
        expect(mountTree().selected).toBeUndefined();
    });

    it('home_end_up_and_down_move_focus_among_visible_nodes_without_selecting_or_dispatching', () => {
        const tree = mountTree();
        const listener = vi.fn();
        tree.addEventListener('r-node-navigated', listener);
        const documents = itemLabelled(tree, 'Documents');
        const notes = itemLabelled(tree, 'Notes.txt');

        press(documents, 'End');
        expect(document.activeElement).toBe(notes);
        press(notes, 'ArrowUp');
        expect(document.activeElement).toBe(documents);
        press(documents, 'ArrowDown');
        expect(document.activeElement).toBe(notes);
        press(notes, 'Home');
        expect(document.activeElement).toBe(documents);

        expect(listener).not.toHaveBeenCalled();
        expect(tree.selected).toBeUndefined();
    });

    it('right_moves_to_the_first_child_of_an_expanded_branch_and_left_moves_to_the_parent', () => {
        const tree = mountTree();
        tree.expand(byId(tree, 1));
        const documents = itemLabelled(tree, 'Documents');

        press(documents, 'ArrowRight');
        expect(document.activeElement).toBe(itemLabelled(tree, 'Report.pdf'));

        press(itemLabelled(tree, 'Report.pdf'), 'ArrowLeft');
        expect(document.activeElement).toBe(documents);
    });

    it('left_collapses_an_expanded_branch', () => {
        const tree = mountTree();
        tree.expand(byId(tree, 1));
        const documents = itemLabelled(tree, 'Documents');

        press(documents, 'ArrowLeft');

        expect(documents.getAttribute('aria-expanded')).toBe('false');
    });

    it('enter_and_space_select_the_focused_node_and_dispatch', () => {
        const tree = mountTree();
        const navigated: string[] = [];
        tree.addEventListener('r-node-navigated', (event: NodeNavigatedEvent) => navigated.push(event.node.label));
        const notes = itemLabelled(tree, 'Notes.txt');

        press(notes, 'Enter');
        press(itemLabelled(tree, 'Documents'), ' ');

        expect(navigated).toEqual(['Notes.txt', 'Documents']);
        expect(tree.selected?.label).toBe('Documents');
    });

    it('exactly_one_node_is_in_the_tab_order', () => {
        const tree = mountTree();
        expect(tabStops(tree)).toEqual(['Documents']);

        press(itemLabelled(tree, 'Documents'), 'End');
        expect(tabStops(tree)).toEqual(['Notes.txt']);

        tree.select(byId(tree, 4));
        expect(tabStops(tree)).toEqual(['Old.pdf']);
    });

    it('tabbing_in_reaches_the_last_focused_node_else_the_selected_node_else_the_first', () => {
        const tree = mountTree();
        expect(tabStops(tree)).toEqual(['Documents']);

        tree.select(byId(tree, 5));
        expect(tabStops(tree)).toEqual(['Notes.txt']);

        press(itemLabelled(tree, 'Notes.txt'), 'Home');
        expect(tabStops(tree)).toEqual(['Documents']);
    });

    it('setting_nodes_clears_the_selection', () => {
        const tree = mountTree();
        tree.select(byId(tree, 5));

        tree.nodes = sampleNodes();

        expect(tree.selected).toBeUndefined();
        expect(tree.querySelector('[aria-selected="true"]')).toBeNull();
    });

    it('set_nodes_replace_the_nodes_of_a_data_template', () => {
        document.body.innerHTML =
            '<r-treeview><template name="data">[{ "label": "FromTemplate", "data": {} }]</template></r-treeview>';
        const tree = document.querySelector('r-treeview') as Treeview<FileData>;

        tree.nodes = [{ label: 'FromCode', data: { id: 1, kind: 'file' } }];

        expect(Array.from(tree.querySelectorAll('.label')).map((label) => label.textContent)).toEqual(['FromCode']);
    });

    it('template_nodes_are_ignored_when_nodes_are_set_before_connecting', () => {
        const tree = document.createElement('r-treeview') as Treeview<FileData>;
        tree.innerHTML = '<template name="data">[{ "label": "FromTemplate", "data": {} }]</template>';
        tree.nodes = [{ label: 'FromCode', data: { id: 1, kind: 'file' } }];

        mount(tree);

        expect(Array.from(tree.querySelectorAll('.label')).map((label) => label.textContent)).toEqual(['FromCode']);
    });

    it('json_that_is_not_a_node_list_reports_an_error_and_renders_empty', () => {
        const reported = captureProblems();
        document.body.innerHTML = '<r-treeview><template name="data">{ "label": "Root" }</template></r-treeview>';

        expect(document.querySelectorAll('.node')).toHaveLength(0);
        expect(reported.messages()).toContainEqual(expect.stringMatching(/^r-treeview:/));
    });

    it('the_tree_never_changes_the_nodes_it_is_given', () => {
        const nodes = sampleNodes();
        const before = JSON.stringify(nodes);
        const { element } = mount<Treeview<FileData>>('r-treeview');
        element.nodes = nodes;

        element.select(nodes[0].children![1].children![0]);
        element.collapse(nodes[0]);

        expect(JSON.stringify(nodes)).toBe(before);
        expect(element.nodes).toBe(nodes);
    });

    it('every_method_given_a_node_the_tree_does_not_hold_throws_an_error_naming_the_tree', () => {
        const tree = mountTree();
        const stranger: TreeNode<FileData> = { label: 'Stranger', data: { id: 99, kind: 'file' } };
        const message = /r-treeview: node 'Stranger' is not in this tree/;

        expect(() => tree.expand(stranger)).toThrow(message);
        expect(() => tree.collapse(stranger)).toThrow(message);
        expect(() => tree.find(() => true, stranger)).toThrow(message);
        expect(() => tree.add({ label: 'X', data: { id: 1, kind: 'file' } }, stranger)).toThrow(message);
    });

    it('a_node_added_to_a_parent_goes_last_among_its_children', () => {
        const tree = mountTree();

        tree.add({ label: 'New.pdf', data: { id: 8, kind: 'file' } }, byId(tree, 1));

        const group = itemLabelled(tree, 'Documents').querySelector('.children')!;
        const children = Array.from(group.children).map((item) => item.querySelector('.label')!.textContent);
        expect(children).toEqual(['Report.pdf', 'Archive', 'New.pdf']);
    });

    it('added_nodes_can_be_found_and_selected_and_the_given_list_and_children_stay_unchanged', () => {
        const nodes = sampleNodes();
        const before = JSON.stringify(nodes);
        const { element } = mount<Treeview<FileData>>('r-treeview');
        element.nodes = nodes;
        const top = { label: 'Top', data: { id: 10, kind: 'file' } as FileData };
        const nested = { label: 'Nested', data: { id: 11, kind: 'file' } as FileData };

        element.add(top);
        element.add(nested, nodes[0]);

        expect(element.find((d) => d.id === 10)).toEqual([top]);
        element.select(nested);
        expect(element.selected).toBe(nested);
        expect(element.nodes).not.toBe(nodes);
        expect(element.nodes).toEqual([...nodes, top]);
        expect(JSON.stringify(nodes)).toBe(before);
        expect(nodes[0].children).toHaveLength(2);
    });

    it('a_label_holding_markup_is_shown_as_literal_text', () => {
        const { element } = mount<Treeview<FileData>>('r-treeview');
        element.nodes = [{ label: '<b>bold</b>', data: { id: 1, kind: 'file' } }];

        expect(element.querySelector('.label')!.textContent).toBe('<b>bold</b>');
        expect(element.querySelector('.label b')).toBeNull();
    });

    it('the_tree_follows_the_tree_pattern_roles', () => {
        const tree = mountTree();

        expect(tree.querySelector(':scope > .tree')!.getAttribute('role')).toBe('tree');
        const documents = itemLabelled(tree, 'Documents');
        expect(documents.getAttribute('role')).toBe('treeitem');
        expect(documents.getAttribute('aria-selected')).toBe('false');
        expect(documents.querySelector(':scope > .children')!.getAttribute('role')).toBe('group');
        expect(documents.getAttribute('aria-expanded')).toBe('false');
        tree.expand(byId(tree, 1));
        expect(documents.getAttribute('aria-expanded')).toBe('true');
    });

    it('moving_the_tree_keeps_expanded_branches_and_selection', () => {
        const tree = mountTree();
        tree.select(byId(tree, 4));
        const elsewhere = document.createElement('div');
        document.body.append(elsewhere);

        elsewhere.append(tree);

        expect(tree.selected).toBe(byId(tree, 4));
        expect(itemLabelled(tree, 'Archive').getAttribute('aria-expanded')).toBe('true');
        expect(itemLabelled(tree, 'Old.pdf').getAttribute('aria-selected')).toBe('true');
    });

    it('styles_sit_in_the_relax_components_layer', () => {
        mountTree();

        const css = Array.from(document.querySelectorAll('style')).map((style) => style.textContent).join('');
        expect(css).toContain('@layer relax-components');
        expect(css).toContain('r-treeview');
    });
});
