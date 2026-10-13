import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import { setLocale } from '@relax.js/core/i18n';
import { restoreWords } from '../../foundations/text/words';
import '../../../src/feedback/spinner/Spinner';
import type { Spinner } from '../../../src/feedback/spinner/Spinner';

describe('r-spinner', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        await restoreWords();
    });

    it('is_busy_for_assistive_technology_while_loading', () => {
        const { element } = mount<Spinner>('r-spinner');
        expect(element.getAttribute('aria-busy')).toBe('false');

        element.setAttribute('loading', '');

        expect(element.getAttribute('aria-busy')).toBe('true');
    });

    it('the_loading_property_mirrors_the_attribute', () => {
        const { element } = mount<Spinner>('r-spinner');

        element.loading = true;
        expect(element.hasAttribute('loading')).toBe(true);

        element.loading = false;
        expect(element.hasAttribute('loading')).toBe(false);
    });

    it('dimmed_content_cannot_be_reached_while_loading', () => {
        const { element } = mount<Spinner>('r-spinner');
        const content = element.shadowRoot!.querySelector('.content')!;

        element.loading = true;
        expect(content.hasAttribute('inert')).toBe(true);

        element.loading = false;
        expect(content.hasAttribute('inert')).toBe(false);
    });

    it('loading_is_announced_with_the_loading_text_and_nothing_is_announced_while_not_loading', () => {
        const { element } = mount<Spinner>('r-spinner');
        const announcement = element.shadowRoot!.querySelector('[role="status"]')!;
        expect(announcement.textContent).toBe('');

        element.loading = true;
        expect(announcement.textContent).toBe('Loading');

        element.loading = false;
        expect(announcement.textContent).toBe('');
    });

    it('the_announcement_follows_the_language_after_localechange', async () => {
        const { element } = mount<Spinner>('r-spinner');
        element.loading = true;
        const announcement = element.shadowRoot!.querySelector('[role="status"]')!;

        await setLocale('sv');

        await vi.waitFor(() => expect(announcement.textContent).toBe('Laddar'));
    });

    it('only_the_presence_of_the_loading_attribute_counts_not_its_value', () => {
        const { element } = mount<Spinner>('r-spinner');

        element.setAttribute('loading', 'false');

        expect(element.loading).toBe(true);
        expect(element.getAttribute('aria-busy')).toBe('true');
    });

    it('an_element_with_loading_in_its_markup_is_inert_and_busy_when_connected', () => {
        document.body.innerHTML = '<r-spinner loading><button>x</button></r-spinner>';
        const element = document.querySelector('r-spinner') as Spinner;

        expect(element.shadowRoot!.querySelector('.content')!.hasAttribute('inert')).toBe(true);
        expect(element.getAttribute('aria-busy')).toBe('true');
    });

    it('the_overlay_covers_only_the_spinner_own_box_fades_in_over_motion_base_and_skips_the_fade_when_reduced_motion_is_preferred_while_the_ring_keeps_spinning', () => {
        const { element } = mount<Spinner>('r-spinner');
        const css = element.shadowRoot!.querySelector('style')!.textContent!;
        const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

        expect(css).toMatch(/:host\s*{[^}]*position:\s*relative/);
        expect(css).toMatch(/\.overlay\s*{[^}]*position:\s*absolute;\s*inset:\s*0/);
        expect(css).toMatch(/transition:\s*opacity var\(--motion-base\)/);
        expect(css).not.toMatch(/transition-delay|setTimeout/);
        expect(reduced).toMatch(/\.overlay\s*{\s*transition:\s*none/);
        expect(reduced).not.toContain('.ring');
        expect(css).toMatch(/\.ring\s*{[^}]*animation:\s*spin/);
    });

    it('a_custom_spinner_in_the_spinner_slot_replaces_the_default_ring_and_is_rotated_like_it', () => {
        document.body.innerHTML = '<r-spinner loading><span slot="spinner">wait</span></r-spinner>';
        const element = document.querySelector('r-spinner') as Spinner;
        const slot = element.shadowRoot!.querySelector('slot[name="spinner"]') as HTMLSlotElement;
        const css = element.shadowRoot!.querySelector('style')!.textContent!;

        expect(slot.assignedElements()).toEqual([element.querySelector('[slot="spinner"]')]);
        expect(css).toMatch(/::slotted\(\[slot='spinner'\]\)\s*{[^}]*animation:\s*spin/);
    });

    it('removing_the_custom_spinner_brings_the_default_ring_back', async () => {
        document.body.innerHTML = '<r-spinner loading><span slot="spinner">wait</span></r-spinner>';
        const element = document.querySelector('r-spinner') as Spinner;
        const slot = element.shadowRoot!.querySelector('slot[name="spinner"]') as HTMLSlotElement;

        element.querySelector('[slot="spinner"]')!.remove();

        expect(slot.assignedElements()).toEqual([]);
        expect(slot.querySelector('[part="ring"]')).not.toBeNull();
    });

    it('the_ring_uses_spinner_size_and_thickness_with_defaults_and_the_accent_on_a_muted_track', () => {
        const { element } = mount<Spinner>('r-spinner');
        const css = element.shadowRoot!.querySelector('style')!.textContent!;
        const ring = css.slice(css.indexOf('.ring {'), css.indexOf('}', css.indexOf('.ring {')));

        expect(ring).toMatch(/width:\s*var\(--spinner-size,\s*2\.5rem\)/);
        expect(ring).toMatch(/height:\s*var\(--spinner-size,\s*2\.5rem\)/);
        expect(ring).toMatch(/border:\s*var\(--spinner-thickness,\s*3px\) solid var\(--bd-muted\)/);
        expect(ring).toMatch(/border-top-color:\s*var\(--accent-primary\)/);
    });

    it('the_overlay_and_the_ring_are_exposed_as_styling_parts', () => {
        const { element } = mount<Spinner>('r-spinner');
        const shadow = element.shadowRoot!;

        expect(shadow.querySelector('.overlay')!.getAttribute('part')).toBe('overlay');
        expect(shadow.querySelector('.ring')!.getAttribute('part')).toBe('ring');
    });

    it('the_default_ring_is_the_fallback_of_the_spinner_slot', () => {
        const { element } = mount<Spinner>('r-spinner');

        const slot = element.shadowRoot!.querySelector('slot[name="spinner"]')!;
        expect(slot.querySelector('[part="ring"]')).not.toBeNull();
    });
});
