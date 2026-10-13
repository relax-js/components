import { describe, expect, it } from 'vitest';
import '../../../src/forms/step/Step';
import { layoutProblems, mount, widths } from '../../layout';

describe('r-step layout', () => {
    it.each(widths)('at_%ipx_the_form_it_holds_fits', async (width) => {
        const element = document.createElement('r-step');
        element.innerHTML = '<form><label>Email <input name="email" required></label><button>Next</button></form>';
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
