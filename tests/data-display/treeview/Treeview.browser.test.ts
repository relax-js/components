import { describe, expect, it } from 'vitest';
import '../../../src/data-display/treeview/Treeview';
import type { TreeNode, Treeview } from '../../../src/data-display/treeview/Treeview';
import { layoutProblems, mount, widths } from '../../layout';

function nested(depth: number): TreeNode<number> {
    const label = ['Furniture and interior design', 'Seating for offices and conference rooms', 'Ergonomic chairs with adjustable armrests', 'Replacement parts and upholstery kits', 'Gas lift cylinders, 120 mm stroke'][depth];
    return depth === 4 ? { label, data: depth } : { label, data: depth, expanded: true, children: [nested(depth + 1), { label: 'Accessories', data: depth + 10 }] };
}

describe('r-treeview layout', () => {
    it.each(widths)('at_%ipx_deep_branches_with_long_labels_fit_without_text_overlapping', async (width) => {
        const element = document.createElement('r-treeview') as Treeview<number>;
        element.nodes = [nested(0), { label: 'Lighting', data: 99 }];
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
