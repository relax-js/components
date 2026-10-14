import { describe, expect, it } from 'vitest';
import '../../../src/foundations/icon/Icon';
import { mount } from '../../layout';

describe('r-icon layout', () => {
    it.each(['12px', '16px', '32px'])('at_a_font_size_of_%s_the_icon_is_one_em_square_and_sits_in_the_line', async (size) => {
        const line = document.createElement('p');
        line.style.fontSize = size;
        line.innerHTML = '<r-icon name="check-circle"></r-icon> Paid';
        await mount(line, 280);

        const icon = line.querySelector('r-icon svg')!.getBoundingClientRect();
        expect(Math.round(icon.width)).toBe(parseInt(size, 10));
        expect(Math.round(icon.height)).toBe(parseInt(size, 10));
        expect(icon.bottom).toBeLessThanOrEqual(line.getBoundingClientRect().bottom);
    });

    it('sizing_the_element_sizes_the_shape', async () => {
        const line = document.createElement('p');
        line.innerHTML = '<r-icon name="user" style="width: 40px; height: 40px"></r-icon>';
        await mount(line, 280);

        const icon = line.querySelector('r-icon svg')!.getBoundingClientRect();
        expect(Math.round(icon.width)).toBe(40);
        expect(Math.round(icon.height)).toBe(40);
    });

    it('a_hidden_icon_takes_no_space', async () => {
        const line = document.createElement('p');
        line.innerHTML = '<r-icon name="user" hidden></r-icon>';
        await mount(line, 280);

        expect(line.querySelector('r-icon')!.getBoundingClientRect().width).toBe(0);
    });
});
