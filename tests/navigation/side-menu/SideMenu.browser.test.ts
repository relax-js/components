import { describe, expect, it } from 'vitest';
import '../../../src/navigation/side-menu/SideMenu';
import type { SideMenu } from '../../../src/navigation/side-menu/SideMenu';
import { layoutProblems, mount } from '../../layout';

function menu(): SideMenu {
    const element = document.createElement('r-side-menu');
    element.setAttribute('title', 'Monitoring and operations');
    element.items = [
        { name: 'overview', title: 'Overview', href: '/' },
        { name: 'traffic', title: 'Traffic by region and service', href: '/traffic' },
        {
            name: 'settings',
            title: 'Settings for notifications',
            children: [
                { name: 'alerts', title: 'Alert rules and escalation policies', href: '/alerts' },
                { name: 'oncall', title: 'On-call schedule', href: '/oncall' },
            ],
        },
    ];
    return element;
}

describe('r-side-menu layout', () => {
    it.each([160, 224, 280])('at_%ipx_long_titles_wrap_inside_the_menu_without_overlapping', async (width) => {
        const element = await mount(menu(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
