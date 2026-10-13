import { describe, expect, it } from 'vitest';
import '../../../src/layout/setting-row/SettingRow';
import { layoutProblems, mount, widths } from '../../layout';

function row(): HTMLElement {
    const element = document.createElement('r-setting-row');
    element.setAttribute('name', 'Email notifications for overdue invoices');
    element.setAttribute('state', 'On, sent every weekday at 08:00 to accounts@example.com');
    const template = document.createElement('template');
    template.innerHTML = '<form><input name="email"></form>';
    element.append(template);
    return element;
}

describe('r-setting-row layout', () => {
    it.each(widths)('at_%ipx_the_name_state_and_button_fit_without_text_overlapping', async (width) => {
        const element = await mount(row(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
