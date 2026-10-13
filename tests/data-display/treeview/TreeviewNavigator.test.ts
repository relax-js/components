import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/data-display/treeview/Treeview';
import type { NodeToggledEvent, TreeNode, Treeview } from '../../../src/data-display/treeview/Treeview';

interface FileData {
    path: string;
}

function file(path: string, extra: Partial<TreeNode<FileData>> = {}): TreeNode<FileData> {
    return { label: path.split('/').at(-1)!, data: { path }, key: path, ...extra };
}

function keyedNodes(): TreeNode<FileData>[] {
    return [
        file('src', { children: [file('src/app.ts'), file('src/lib', { children: [file('src/lib/util.ts')] })] }),
        file('README.md'),
    ];
}

function mountTree(nodes: TreeNode<FileData>[] = keyedNodes()): Treeview<FileData> {
    const { element } = mount<Treeview<FileData>>('r-treeview');
    element.nodes = nodes;
    return element;
}

function item(tree: Treeview<FileData>, label: string): HTMLLIElement {
    return Array.from(tree.querySelectorAll<HTMLLIElement>('.node')).find(
        (candidate) => candidate.querySelector(':scope > .node-row .label')!.textContent === label,
    )!;
}

function press(target: Element, key: string): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('r-treeview as a navigator', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('rich nodes', () => {
        it('a_node_shows_its_icon_before_the_label_and_its_note_after_it', () => {
            const tree = mountTree([file('app.ts', { icon: 'file', note: '42 lines, long' })]);
            const row = item(tree, 'app.ts').querySelector(':scope > .node-row')!;

            expect([...row.children].map((child) => child.className || child.localName)).toEqual([
                'toggle',
                'icon',
                'label',
                'note',
            ]);
            expect(row.querySelector('.icon')!.getAttribute('name')).toBe('file');
            expect(row.querySelector('.note')!.textContent).toBe('42 lines, long');
        });

        it('a_badge_shows_its_text_or_count_with_its_tone', () => {
            const tree = mountTree([
                file('a.ts', { badge: { text: 'low', tone: 'danger' } }),
                file('b.ts', { badge: { count: 3, tone: 'warn' } }),
            ]);

            const text = item(tree, 'a.ts').querySelector('r-badge')!;
            expect(text.textContent).toBe('low');
            expect(text.getAttribute('tone')).toBe('danger');
            const count = item(tree, 'b.ts').querySelector('r-badge')!;
            expect(count.getAttribute('count')).toBe('3');
            expect(count.getAttribute('tone')).toBe('warn');
        });

        it('a_badge_count_of_zero_is_shown_because_none_is_information', () => {
            const tree = mountTree([file('a.ts', { badge: { count: 0 } })]);

            expect(item(tree, 'a.ts').querySelector('r-badge')!.hasAttribute('show-zero')).toBe(true);
        });

        it('a_node_tone_is_carried_on_its_row_and_shows_the_tone_icon_when_the_node_has_none', () => {
            const tree = mountTree([file('risky.ts', { tone: 'danger' }), file('own.ts', { tone: 'warn', icon: 'file' })]);

            const risky = item(tree, 'risky.ts').querySelector<HTMLElement>(':scope > .node-row')!;
            expect(risky.dataset.tone).toBe('danger');
            expect(risky.querySelector('.icon')!.getAttribute('name')).toBe('x-circle');
            const own = item(tree, 'own.ts').querySelector<HTMLElement>(':scope > .node-row')!;
            expect(own.querySelector('.icon')!.getAttribute('name')).toBe('file');
        });

        it('an_unknown_node_tone_reports_and_leaves_the_row_untoned', () => {
            const reported = captureProblems();
            const tree = mountTree([file('a.ts', { tone: 'loud' as never })]);

            expect(reported.messages()).toContainEqual(expect.stringMatching(/^r-treeview: tone "loud"/));
            expect(item(tree, 'a.ts').querySelector<HTMLElement>('.node-row')!.dataset.tone).toBeUndefined();
        });

        it('note_and_badge_text_are_shown_as_given', () => {
            const tree = mountTree([file('a.ts', { note: '<b>n</b>', badge: { text: '<i>b</i>' } })]);

            expect(tree.querySelector('.note')!.textContent).toBe('<b>n</b>');
            expect(tree.querySelector('r-badge')!.textContent).toBe('<i>b</i>');
            expect(tree.querySelector('b, i')).toBeNull();
        });
    });

    describe('lazy children', () => {
        it('a_branch_with_children_to_load_is_drawn_collapsed_and_loads_them_on_first_expand', async () => {
            const tree = mountTree([file('src', { hasChildren: true })]);
            const loader = vi.fn(async () => [file('src/app.ts')]);
            tree.loadChildren = loader;
            const src = item(tree, 'src');
            expect(src.getAttribute('aria-expanded')).toBe('false');

            const shown = tree.expand('src');
            expect(src.getAttribute('aria-busy')).toBe('true');
            await shown;

            expect(src.hasAttribute('aria-busy')).toBe(false);
            expect(item(tree, 'app.ts').closest('.children')!.parentElement).toBe(src);
            expect(loader).toHaveBeenCalledWith(expect.objectContaining({ key: 'src' }), expect.any(AbortSignal));

            tree.collapse('src');
            await tree.expand('src');
            expect(loader).toHaveBeenCalledTimes(1);
        });

        it('loaded_children_can_be_found_and_selected_and_the_given_node_stays_unchanged', async () => {
            const src = file('src', { hasChildren: true });
            const before = JSON.stringify(src);
            const tree = mountTree([src]);
            tree.loadChildren = async () => [file('src/app.ts')];
            await tree.expand(src);

            tree.select('src/app.ts');

            expect(tree.selected?.key).toBe('src/app.ts');
            expect(tree.find((data) => data.path === 'src/app.ts')).toHaveLength(1);
            expect(JSON.stringify(src)).toBe(before);
        });

        it('clicking_the_arrow_of_an_unloaded_branch_loads_its_children', async () => {
            const tree = mountTree([file('src', { hasChildren: true })]);
            tree.loadChildren = async () => [file('src/app.ts')];

            item(tree, 'src').querySelector<HTMLElement>('.toggle')!.click();
            await settled();

            expect(item(tree, 'app.ts')).toBeDefined();
        });

        it('a_branch_whose_loaded_children_are_none_becomes_a_leaf', async () => {
            const tree = mountTree([file('empty', { hasChildren: true })]);
            tree.loadChildren = async () => [];

            await tree.expand('empty');

            const empty = item(tree, 'empty');
            expect(empty.hasAttribute('aria-expanded')).toBe(false);
            expect(empty.querySelector('.children')).toBeNull();
        });

        it('a_failed_load_reports_collapses_the_branch_and_loads_again_on_the_next_expand', async () => {
            const reported = captureProblems();
            const tree = mountTree([file('src', { hasChildren: true })]);
            const loader = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([file('src/app.ts')]);
            tree.loadChildren = loader;

            await expect(tree.expand('src')).rejects.toThrow('offline');
            expect(reported.messages()).toContainEqual("r-treeview: loading the children of 'src' failed: offline");
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('false');

            await tree.expand('src');
            expect(item(tree, 'app.ts')).toBeDefined();
        });

        it('expanding_a_branch_to_load_without_a_loader_reports_and_stays_collapsed', async () => {
            const reported = captureProblems();
            const tree = mountTree([file('src', { hasChildren: true })]);

            await expect(tree.expand('src')).rejects.toThrow();

            expect(reported.messages()).toContainEqual(
                "r-treeview: node 'src' has children to load, but loadChildren is not set",
            );
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('false');
        });

        it('setting_nodes_aborts_loads_still_running_and_draws_nothing_from_them', async () => {
            const tree = mountTree([file('src', { hasChildren: true })]);
            let signal: AbortSignal | undefined;
            let finish: (nodes: TreeNode<FileData>[]) => void = () => {};
            tree.loadChildren = (_node, given) => {
                signal = given;
                return new Promise((resolve) => (finish = resolve));
            };
            const shown = tree.expand('src');

            tree.nodes = [file('other')];
            finish([file('src/app.ts')]);
            await shown;

            expect(signal!.aborted).toBe(true);
            expect(item(tree, 'app.ts')).toBeUndefined();
        });

        it('a_branch_marked_expanded_loads_its_children_when_drawn_whatever_order_the_properties_are_set_in', async () => {
            const { element: tree } = mount<Treeview<FileData>>('r-treeview');
            tree.nodes = [file('src', { hasChildren: true, expanded: true })];
            tree.loadChildren = async () => [file('src/app.ts')];
            await settled();

            expect(item(tree, 'app.ts')).toBeDefined();
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('true');
        });
    });

    describe('keys', () => {
        it('setting_nodes_keeps_expansion_and_selection_by_key', () => {
            const tree = mountTree();
            tree.select('src/lib/util.ts');
            tree.collapse('src/lib');

            tree.nodes = keyedNodes();

            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('true');
            expect(item(tree, 'lib').getAttribute('aria-expanded')).toBe('false');
            expect(tree.selected?.key).toBe('src/lib/util.ts');
            expect(item(tree, 'util.ts').getAttribute('aria-selected')).toBe('true');
        });

        it('keeping_the_selection_across_a_nodes_set_dispatches_nothing', () => {
            const tree = mountTree();
            tree.select('README.md');
            const listener = vi.fn();
            tree.addEventListener('r-node-navigated', listener);

            tree.nodes = keyedNodes();

            expect(listener).not.toHaveBeenCalled();
        });

        it('a_selected_key_gone_from_the_new_nodes_clears_the_selection', () => {
            const tree = mountTree();
            tree.select('README.md');

            tree.nodes = [file('src')];

            expect(tree.selected).toBeUndefined();
        });

        it('a_new_keyed_branch_follows_its_own_expanded_flag', () => {
            const tree = mountTree();

            tree.nodes = [...keyedNodes(), file('docs', { expanded: true, children: [file('docs/a.md')] })];

            expect(item(tree, 'docs').getAttribute('aria-expanded')).toBe('true');
        });

        it('select_expand_and_collapse_accept_a_key', () => {
            const tree = mountTree();

            tree.select('src/lib/util.ts');
            expect(item(tree, 'lib').getAttribute('aria-expanded')).toBe('true');
            tree.collapse('src');
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('false');
            void tree.expand('src');
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('true');
        });

        it('a_key_the_tree_does_not_hold_throws_naming_the_tree', () => {
            const tree = mountTree();

            expect(() => tree.select('nowhere')).toThrow(/r-treeview: no node with key 'nowhere' in this tree/);
        });

        it('a_key_used_twice_reports_and_reaches_the_first_node', () => {
            const reported = captureProblems();
            const tree = mountTree([file('a', { label: 'first' }), file('a', { label: 'second' })]);

            expect(reported.messages()).toContainEqual("r-treeview: key 'a' is used by more than one node");
            tree.select('a');
            expect(tree.selected?.label).toBe('first');
        });
    });

    describe('selecting and toggling', () => {
        it('a_silent_select_selects_without_dispatching_so_reflecting_an_opened_file_cannot_loop', () => {
            const tree = mountTree();
            const listener = vi.fn();
            tree.addEventListener('r-node-navigated', listener);

            tree.select('src/app.ts', { silent: true });

            expect(tree.selected?.key).toBe('src/app.ts');
            expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('true');
            expect(listener).not.toHaveBeenCalled();
        });

        it('the_user_expanding_or_collapsing_a_branch_dispatches_r_node_toggled', () => {
            const tree = mountTree();
            const toggled: string[] = [];
            tree.addEventListener('r-node-toggled', (event: NodeToggledEvent) =>
                toggled.push(`${event.node.key}:${event.expanded}`),
            );
            const src = item(tree, 'src');

            src.querySelector<HTMLElement>('.toggle')!.click();
            press(src, 'ArrowLeft');

            expect(toggled).toEqual(['src:true', 'src:false']);
        });

        it('expanding_from_code_or_selecting_dispatches_no_toggle', () => {
            const tree = mountTree();
            const listener = vi.fn();
            tree.addEventListener('r-node-toggled', listener);

            void tree.expand('src');
            tree.select('src/lib/util.ts');

            expect(listener).not.toHaveBeenCalled();
        });

        it('double_clicking_a_branch_row_toggles_it', () => {
            const tree = mountTree();
            const src = item(tree, 'src');

            src.querySelector(':scope > .node-row .label')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            expect(src.getAttribute('aria-expanded')).toBe('true');

            src.querySelector(':scope > .node-row .label')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            expect(src.getAttribute('aria-expanded')).toBe('false');
        });

        it('typing_moves_focus_to_the_next_visible_node_whose_label_starts_with_the_typed_text', () => {
            vi.useFakeTimers();
            const tree = mountTree([file('alpha'), file('beta'), file('bravo'), file('charlie')]);
            const listener = vi.fn();
            tree.addEventListener('r-node-navigated', listener);

            press(item(tree, 'alpha'), 'b');
            expect(document.activeElement).toBe(item(tree, 'beta'));
            press(item(tree, 'beta'), 'r');
            expect(document.activeElement).toBe(item(tree, 'bravo'));

            vi.advanceTimersByTime(1000);
            press(item(tree, 'bravo'), 'B');
            expect(document.activeElement).toBe(item(tree, 'beta'));
            expect(listener).not.toHaveBeenCalled();
        });

        it('the_label_attribute_names_the_tree_for_assistive_technology', () => {
            const tree = mountTree();
            tree.setAttribute('label', 'Explorer');

            expect(tree.querySelector('[role="tree"]')!.getAttribute('aria-label')).toBe('Explorer');
        });
    });
});
