import { captureProblems } from '../../captureProblems';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import { NavigateRouteEvent } from '@relax.js/core';
import { Dialog } from '../../../src/layout/dialog/Dialog';
import { toneIcon } from '../../../src/foundations/tone/tone';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function dialogElement(attributes: Record<string, string>): Dialog {
    const element = document.createElement('r-dialog');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    const template = document.createElement('template');
    template.innerHTML = '<p class="body">Hello</p><input name="a">';
    element.append(template);
    return element;
}

function nativeDialog(element: Dialog): HTMLDialogElement | null {
    return element.querySelector('dialog');
}

describe('r-dialog', () => {
    let showModal: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // jsdom has no modal support: the stand-ins mark the dialog open and fire close like a browser
        showModal = vi.fn(function (this: HTMLDialogElement) {
            this.setAttribute('open', '');
        });
        HTMLDialogElement.prototype.showModal = showModal as unknown as () => void;
        HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        };
    });

    afterEach(async () => {
        document.body.replaceChildren();
        document.head.querySelectorAll('style[data-r-styles]').forEach((style) => style.remove());
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('dialog_opens_as_a_native_modal_dialog', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        expect(showModal).toHaveBeenCalledTimes(1);
        expect(nativeDialog(element)).not.toBeNull();
    });

    it('content_is_copied_in_on_open_and_removed_on_close', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        expect(element.querySelector('.body')).toBeNull();
        void element.open();
        expect(element.querySelector('dialog .body')).not.toBeNull();
        nativeDialog(element)!.close();
        expect(element.querySelector('.body')).toBeNull();
        expect(nativeDialog(element)).toBeNull();
    });

    it('opening_an_open_dialog_throws_an_error_naming_the_component', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        expect(() => element.open()).toThrow(/r-dialog/);
    });

    it('moving_an_open_dialog_never_copies_its_content_a_second_time', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        const other = document.createElement('div');
        document.body.append(other);
        other.append(element);
        expect(element.querySelectorAll('.body')).toHaveLength(1);
    });

    it('open_attribute_is_present_while_open_and_absent_when_closed', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        expect(element.hasAttribute('open')).toBe(false);
        void element.open();
        expect(element.hasAttribute('open')).toBe(true);
        nativeDialog(element)!.close();
        expect(element.hasAttribute('open')).toBe(false);
    });

    it('dialog_shows_heading_as_its_name_and_a_close_button_with_the_close_text', async () => {
        await rewordEnglish({ close: 'Shut' });
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        const dialog = nativeDialog(element)!;
        const title = dialog.querySelector('h2')!;
        expect(title.textContent).toBe('Title');
        expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
        expect(dialog.querySelector('.dialog-close')!.textContent).toBe('Shut');
    });

    it('missing_heading_reports_an_error_naming_the_component_and_still_opens', () => {
        const reported = captureProblems();
        const { element } = mount(dialogElement({}));
        void element.open();
        expect(reported.messages()).toContainEqual(expect.stringContaining('r-dialog'));
        expect(element.hasAttribute('open')).toBe(true);
    });

    it('focus_moves_into_the_dialog_on_open_and_returns_to_the_opener_on_close', () => {
        const trigger = document.createElement('button');
        document.body.append(trigger);
        trigger.focus();
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        expect(nativeDialog(element)!.contains(document.activeElement)).toBe(true);
        nativeDialog(element)!.close();
        expect(document.activeElement).toBe(trigger);
    });

    it('opening_resolves_with_the_result_the_content_closed_it_with', async () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const result = element.open();
        element.close({ id: 7 });
        expect(await result).toEqual({ id: 7 });
    });

    it('content_closes_the_dialog_with_a_result_by_calling_close_on_it', async () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const result = element.open();
        element.querySelector('.body')!.closest('r-dialog')!.close('saved');
        // closed again is a no-op
        element.close('late');
        expect(await result).toBe('saved');
        expect(nativeDialog(element)).toBeNull();
    });

    it('form_with_dialog_method_closes_with_the_submitting_buttons_value', async () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const result = element.open();
        // a native dialog form leaves the submitter's value as the return value, then closes
        const dialog = nativeDialog(element)!;
        dialog.returnValue = 'ok';
        dialog.close();
        expect(await result).toBe('ok');
    });

    it('dismissed_dialog_resolves_with_no_value_and_never_rejects', async () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const result = element.open();
        element.querySelector<HTMLElement>('.dialog-close')!.click();
        expect(await result).toBeUndefined();
    });

    it('every_close_fires_r_dialog_close_carrying_the_result_or_no_value_when_dismissed', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const results: unknown[] = [];
        element.addEventListener('r-dialog-close', (event) => results.push(event.result));
        void element.open();
        element.close('a');
        void element.open();
        element.querySelector<HTMLElement>('.dialog-close')!.click();
        expect(results).toEqual(['a', undefined]);
    });

    it('escape_dismisses_the_dialog_the_same_way_the_close_button_does', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const closing = vi.fn();
        element.addEventListener('r-dialog-closing', closing);
        void element.open();
        const cancel = new Event('cancel', { cancelable: true });
        nativeDialog(element)!.dispatchEvent(cancel);
        expect(cancel.defaultPrevented).toBe(true);
        expect(closing).toHaveBeenCalledTimes(1);
        expect(nativeDialog(element)).toBeNull();
    });

    it('click_outside_the_dialog_leaves_it_open', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        void element.open();
        nativeDialog(element)!.click();
        document.body.click();
        expect(element.hasAttribute('open')).toBe(true);
    });

    it('cancelled_closing_event_keeps_the_dialog_open_on_dismissal', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        element.addEventListener('r-dialog-closing', (e) => e.preventDefault());
        void element.open();
        element.querySelector<HTMLElement>('.dialog-close')!.click();
        nativeDialog(element)!.dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(element.hasAttribute('open')).toBe(true);
    });

    it('explicit_close_with_a_result_never_fires_r_dialog_closing_and_cannot_be_stopped', () => {
        const { element } = mount(dialogElement({ heading: 'Title' }));
        const closing = vi.fn((e: Event) => e.preventDefault());
        element.addEventListener('r-dialog-closing', closing);
        void element.open();
        element.close('x');
        expect(closing).not.toHaveBeenCalled();
        expect(element.hasAttribute('open')).toBe(false);
    });

    it('dialog_takes_radius_padding_gap_and_shadow_from_the_dialog_tier', () => {
        mount(dialogElement({ heading: 'Title' }));
        const css = document.head.querySelector('style[data-r-styles="r-dialog"]')!.textContent!;
        expect(css).toContain('border-radius: var(--dialog-radius)');
        expect(css).toContain('padding: var(--dialog-padding)');
        expect(css).toContain('gap: var(--dialog-gap)');
        expect(css).toContain('box-shadow: var(--dialog-shadow)');
    });

    it('backdrop_dims_the_page_with_overlay_dim', () => {
        mount(dialogElement({ heading: 'Title' }));
        const css = document.head.querySelector('style[data-r-styles="r-dialog"]')!.textContent!;
        expect(css).toMatch(/::backdrop\s*\{[^}]*background: var\(--overlay-dim\)/);
    });

    it('opening_fades_in_with_motion_variables_and_not_when_reduced_motion_is_preferred', () => {
        mount(dialogElement({ heading: 'Title' }));
        const css = document.head.querySelector('style[data-r-styles="r-dialog"]')!.textContent!;
        expect(css).toContain('animation: r-dialog-in var(--motion-base) ease');
        expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*animation: none/);
    });

    describe('confirm', () => {
        const ask = (extra: Record<string, unknown> = {}) =>
            Dialog.confirm({ heading: 'Delete', message: 'Sure?', tone: 'danger', ...extra });
        const button = (name: string) => document.querySelector<HTMLButtonElement>(`dialog .${name}`)!;

        it('confirmation_resolves_true_on_confirm', async () => {
            const result = ask();
            expect(document.querySelector('dialog')!.textContent).toContain('Sure?');
            button('dialog-confirm').click();
            expect(await result).toBe(true);
            expect(document.querySelector('r-dialog')).toBeNull();
        });

        it('confirmation_resolves_false_on_cancel_and_on_dismissal', async () => {
            const cancelled = ask();
            button('dialog-cancel').click();
            expect(await cancelled).toBe(false);
            const dismissed = ask();
            button('dialog-close').click();
            expect(await dismissed).toBe(false);
        });

        it('confirmation_message_is_shown_as_text_never_as_markup', async () => {
            const result = ask({ message: '<b>bold</b>' });
            const message = document.querySelector('.dialog-message')!;
            expect(message.querySelector('b')).toBeNull();
            expect(message.textContent).toContain('<b>bold</b>');
            button('dialog-cancel').click();
            await result;
        });

        it('confirmation_shows_the_tone_icon_beside_the_message_and_colours_it_by_tone', async () => {
            const result = ask();
            const message = document.querySelector('.dialog-message') as HTMLElement;
            expect(message.querySelector('r-icon')!.getAttribute('name')).toBe(toneIcon.danger);
            expect(message.dataset.tone).toBe('danger');
            button('dialog-cancel').click();
            await result;
        });

        it('confirmation_with_an_unknown_tone_throws_an_error_naming_the_component', async () => {
            await expect(ask({ tone: 'loud' })).rejects.toThrow('r-dialog');
        });

        it('confirmation_buttons_use_the_confirm_and_cancel_words_unless_given_their_own', async () => {
            await rewordEnglish({ confirm: 'Yes', cancel: 'No' });
            const words = ask();
            expect(button('dialog-confirm').textContent).toBe('Yes');
            expect(button('dialog-cancel').textContent).toBe('No');
            button('dialog-cancel').click();
            await words;
            const own = ask({ confirmText: 'Delete it', cancelText: 'Keep' });
            expect(button('dialog-confirm').textContent).toBe('Delete it');
            expect(button('dialog-cancel').textContent).toBe('Keep');
            button('dialog-cancel').click();
            await own;
        });
    });

    describe('route target', () => {
        function navigateTo(target: string): void {
            const route = { path: '/preview', target, componentTagName: 'x-preview-page' };
            document.dispatchEvent(new NavigateRouteEvent(route, ['preview'], undefined, target));
        }

        it('route_opened_into_the_dialog_target_shows_in_it_created_on_navigation_and_removed_on_close', () => {
            const { element } = mount(dialogElement({ heading: 'Title', name: 'modal' }));
            expect(element.querySelector('x-preview-page')).toBeNull();
            navigateTo('modal');
            expect(element.hasAttribute('open')).toBe(true);
            expect(element.querySelector('dialog x-preview-page')).not.toBeNull();
            expect(element.querySelector('dialog .body')).toBeNull();
            element.querySelector<HTMLElement>('.dialog-close')!.click();
            expect(element.querySelector('x-preview-page')).toBeNull();
            expect(element.hasAttribute('open')).toBe(false);
        });

        it('route_dialog_closes_on_escape_like_any_dialog', () => {
            const { element } = mount(dialogElement({ heading: 'Title', name: 'escape-modal' }));
            navigateTo('escape-modal');
            nativeDialog(element)!.dispatchEvent(new Event('cancel', { cancelable: true }));
            expect(nativeDialog(element)).toBeNull();
            expect(element.querySelector('x-preview-page')).toBeNull();
        });
    });
});
