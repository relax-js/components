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
});
