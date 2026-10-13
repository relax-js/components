import { describe, expect, it } from 'vitest';
import '../../../src/dashboard/card/Card';
import { layoutProblems, mount, widths } from '../../layout';

function card(): HTMLElement {
    const element = document.createElement('r-card');
    element.setAttribute('heading', 'Certificates that need renewing');
    element.setAttribute('lead', 'TLS certificates for every public host, and how many days each has left before it runs out.');
    element.setAttribute('icon', 'lock');
    element.setAttribute('link-text', 'All certificates');
    element.setAttribute('href', '/certificates');
    element.innerHTML = `<select slot="action"><option>Last 30 days</option><option>Last year</option></select>
        <p>api.fleet.example renews in 3 days.</p>`;
    return element;
}

describe('r-card layout', () => {
    it.each(widths)('at_%ipx_the_heading_row_and_body_fit_without_text_overlapping', async (width) => {
        const element = await mount(card(), width);

        expect(layoutProblems(element)).toEqual([]);
    });
});
