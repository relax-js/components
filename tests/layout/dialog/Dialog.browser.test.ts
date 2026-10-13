import { afterEach, describe, expect, it } from 'vitest';
import { page } from '@vitest/browser/context';
import '../../../src/layout/dialog/Dialog';
import type { Dialog } from '../../../src/layout/dialog/Dialog';
import { layoutProblems, mount, outsideViewport, settle } from '../../layout';

const windows = [[320, 568], [768, 1024], [1440, 900]] as const;

function dialog(rows: number): Dialog {
    const element = document.createElement('r-dialog');
    element.setAttribute('heading', 'Edit the delivery address for order ORD-2026-1042');
    const template = document.createElement('template');
    const fields = Array.from({ length: rows }, (_, i) => `<p><label>Address line ${String(i + 1)} <input name="line${String(i)}"></label></p>`).join('');
    template.innerHTML = `<form>${fields}<button>Save</button></form>`;
    element.append(template);
    return element;
}

describe('r-dialog layout', () => {
    afterEach(() => {
        document.querySelector<Dialog>('r-dialog[open]')?.close();
    });

    it.each(windows)('in_a_%ix%i_window_an_open_dialog_stays_inside_the_window', async (width, height) => {
        await page.viewport(width, height);
        const element = await mount(dialog(3), width);

        void element.open();
        await settle();

        const native = element.querySelector('dialog')!;
        expect(outsideViewport(native)).toEqual([]);
        expect(layoutProblems(native)).toEqual([]);
    });

    it('a_dialog_taller_than_the_window_scrolls_within_itself', async () => {
        await page.viewport(320, 568);
        const element = await mount(dialog(20), 320);

        void element.open();
        await settle();

        const native = element.querySelector('dialog')!;
        expect(outsideViewport(native)).toEqual([]);
        expect(native.scrollHeight).toBeGreaterThan(native.clientHeight);
    });
});
