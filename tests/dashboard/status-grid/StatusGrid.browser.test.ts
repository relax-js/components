import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/status-grid/StatusGrid';
import type { StatusGrid } from '../../../src/dashboard/status-grid/StatusGrid';
import { layoutProblems, mount, widths } from '../../layout';

const services = ['gateway', 'auth', 'accounts', 'catalog', 'search', 'checkout', 'payments', 'inventory', 'shipping', 'notifications', 'recommendations', 'reports'];

function grid(): StatusGrid {
    const element = document.createElement('r-status-grid');
    element.states = [
        { id: 'up', label: 'Healthy', tone: 'ok' },
        { id: 'slow', label: 'Degraded', tone: 'warn' },
        { id: 'down', label: 'Down', tone: 'danger' },
        { id: 'maintenance', label: 'Maintenance' },
    ];
    element.items = services.map((label, i) => ({ label, state: ['up', 'up', 'slow', 'down', 'maintenance'][i % 5] }));
    return element;
}

describe('r-status-grid layout', () => {
    it.each([120, ...widths])('at_%ipx_the_tiles_and_legend_fit_without_text_overlapping', async (width) => {
        const element = await mount(grid(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
