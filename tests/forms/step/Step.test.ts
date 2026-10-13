import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/forms/step/Step';
import type { Step } from '../../../src/forms/step/Step';

function step(): Step {
    const element = document.createElement('r-step');
    element.innerHTML = '<form><input name="email" required></form>';
    return element;
}

function submit(element: Step): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('r-step', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('step_checks_its_own_form_with_native_validation', () => {
        const { element } = mount(step());
        const form = element.querySelector('form')!;
        expect(form.checkValidity()).toBe(false);
        form.querySelector('input')!.value = 'a@b.se';
        expect(form.checkValidity()).toBe(true);
    });

    it('valid_form_fires_done_with_the_form_values', () => {
        const { element } = mount(step());
        const events: Record<string, string>[] = [];
        element.addEventListener('r-step-done', (event) => events.push(event.values));
        element.querySelector('input')!.value = 'a@b.se';

        submit(element);

        expect(events).toEqual([{ email: 'a@b.se' }]);
    });

    it('invalid_form_fires_nothing_and_shows_the_validation_messages', () => {
        const { element } = mount(step());
        let fired = 0;
        let invalid = 0;
        element.addEventListener('r-step-done', () => fired++);
        element.querySelector('input')!.addEventListener('invalid', () => invalid++);

        submit(element);

        expect(fired).toBe(0);
        expect(invalid).toBe(1);
    });

    it('step_starts_from_the_values_the_page_gives_it', () => {
        const { element } = mount(step());
        element.value = { email: 'back@b.se' };
        expect(element.querySelector('input')!.value).toBe('back@b.se');

        const events: Record<string, string>[] = [];
        element.addEventListener('r-step-done', (event) => events.push(event.values));
        submit(element);
        expect(events).toEqual([{ email: 'back@b.se' }]);
    });
});
