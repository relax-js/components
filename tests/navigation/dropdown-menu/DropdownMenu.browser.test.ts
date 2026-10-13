import { afterEach, describe, expect, it } from 'vitest';
import { page } from '@vitest/browser/context';
import '../../../src/navigation/dropdown-menu/DropdownMenu';
import type { DropdownMenu } from '../../../src/navigation/dropdown-menu/DropdownMenu';
import { layoutProblems, mount, outsideViewport, settle } from '../../layout';

function menu(): DropdownMenu {
    const element = document.createElement('r-dropdown-menu');
    element.setAttribute('label', 'Order actions');
    element.items = [
        { name: 'duplicate', title: 'Duplicate this order as a new draft' },
        { name: 'invoice', title: 'Send the invoice again to the customer' },
        { name: 'cancel', title: 'Cancel order and refund payment' },
    ];
    return element;
}

// Places the trigger in a corner of the window, where a panel opening down and to the right would leave it.
async function inCorner(corner: 'top-left' | 'top-right' | 'bottom-right'): Promise<DropdownMenu> {
    const element = menu();
    const host = await mount(document.createElement('div'), 320);
    host.style.cssText = 'position: fixed; inset: 0; display: flex; padding: 4px;';
    host.style.justifyContent = corner === 'top-left' ? 'flex-start' : 'flex-end';
    host.style.alignItems = corner === 'bottom-right' ? 'flex-end' : 'flex-start';
    host.append(element);
    await settle();
    return element;
}

describe('r-dropdown-menu layout', () => {
    afterEach(() => {
        document.querySelector<DropdownMenu>('r-dropdown-menu[open]')?.close();
    });

    it.each(['top-left', 'top-right', 'bottom-right'] as const)('on_a_phone_a_menu_opened_in_the_%s_corner_stays_inside_the_window', async (corner) => {
        await page.viewport(320, 568);
        const element = await inCorner(corner);

        element.show();
        await settle();

        const panel = element.shadowRoot!.querySelector<HTMLElement>('[part~="panel"]')!;
        expect(outsideViewport(panel)).toEqual([]);
        expect(layoutProblems(panel)).toEqual([]);
    });
});
