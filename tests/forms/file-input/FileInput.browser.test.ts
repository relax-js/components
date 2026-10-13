import { describe, expect, it } from 'vitest';
import '../../../src/forms/file-input/FileInput';
import { layoutProblems, mount, widths } from '../../layout';

describe('r-file-input layout', () => {
    it.each([200, ...widths])('at_%ipx_the_picker_fits_without_text_overlapping', async (width) => {
        const element = document.createElement('r-file-input');
        element.setAttribute('accept', '.csv');
        await mount(element, width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
