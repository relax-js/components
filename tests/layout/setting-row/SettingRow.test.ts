import { captureProblems } from '../../captureProblems';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@relax.js/core/testing';
import '../../../src/layout/setting-row/SettingRow';
import type { SettingRow } from '../../../src/layout/setting-row/SettingRow';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';

function settingRow(attributes: Record<string, string>, withForm = true): SettingRow {
    const element = document.createElement('r-setting-row');
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    if (withForm) {
        const template = document.createElement('template');
        template.innerHTML = '<form><input name="email"></form>';
        element.append(template);
    }
    return element;
}

describe('r-setting-row', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        document.head.querySelectorAll('style[data-r-styles]').forEach((style) => style.remove());
        await restoreWords();
        vi.restoreAllMocks();
    });

    it('row_shows_name_and_state_and_follows_changes_to_either', () => {
        const { element } = mount(settingRow({ name: 'Email notifications', state: 'On' }));
        expect(element.querySelector('.setting-name')!.textContent).toBe('Email notifications');
        expect(element.querySelector('.setting-state')!.textContent).toBe('On');

        element.setAttribute('state', 'Off');
        element.setAttribute('name', 'Mail');

        expect(element.querySelector('.setting-name')!.textContent).toBe('Mail');
        expect(element.querySelector('.setting-state')!.textContent).toBe('Off');
        expect(element.querySelectorAll('button')).toHaveLength(1);
    });

    it('row_without_name_reports_an_error_naming_its_tag_and_renders_empty', () => {
        const reported = captureProblems();

        const { element } = mount(settingRow({ state: 'On' }));

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-setting-row'));
        expect(element.querySelector('.setting-text')).toBeNull();
        expect(element.querySelector('button')).toBeNull();
    });

    it('change_button_accessible_name_is_one_message_with_the_setting_name', async () => {
        const { element } = mount(settingRow({ name: 'Email notifications', state: 'On' }));
        expect(element.querySelector('button')!.getAttribute('aria-label')).toBe('Change Email notifications');

        await rewordEnglish({ changeSetting: 'Edit {name} now' });
        element.setAttribute('state', 'Off');

        expect(element.querySelector('button')!.getAttribute('aria-label')).toBe('Edit Email notifications now');
    });

    it('row_without_form_template_reports_an_error_and_shows_name_and_state_without_button', () => {
        const reported = captureProblems();

        const { element } = mount(settingRow({ name: 'Email notifications', state: 'On' }, false));

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-setting-row'));
        expect(element.querySelector('.setting-name')!.textContent).toBe('Email notifications');
        expect(element.querySelector('.setting-state')!.textContent).toBe('On');
        expect(element.querySelector('button')).toBeNull();
    });

    function open(element: SettingRow): HTMLDialogElement {
        element.querySelector('button')!.click();
        return element.querySelector('dialog')!;
    }

    function submit(dialog: HTMLDialogElement): void {
        dialog.querySelector('form')!.requestSubmit();
    }

    // jsdom has no modal dialog behaviour, so open and close are stood in for.
    beforeEach(() => {
        HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
            this.setAttribute('open', '');
        };
        HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        };
    });

    const flush =() => new Promise((resolve) => setTimeout(resolve, 0));

    it('button_opens_a_dialog_titled_with_the_name_holding_a_fresh_form_copy_inside_the_row', () => {
        const { element } = mount(settingRow({ name: 'Email notifications', state: 'On' }));
        const dialog = open(element);

        expect(dialog.querySelector('h2')!.textContent).toBe('Email notifications');
        expect(dialog.querySelector('form')).not.toBeNull();
        expect(dialog.closest('r-setting-row')).toBe(element);
        dialog.querySelector('input')!.value = 'typed';
        dialog.querySelector<HTMLButtonElement>('.setting-close')!.click();
        expect(open(element).querySelector('input')!.value).toBe('');
    });

    it('form_opens_with_each_field_of_value_in_the_input_of_the_same_name', () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        element.value = { email: 'a@b.se', unknown: 'x' };

        expect(open(element).querySelector('input')!.value).toBe('a@b.se');
    });

    it('input_without_a_value_field_keeps_what_the_template_gives_it', () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        element.querySelector('template')!.innerHTML = '<form><input name="email" value="default"></form>';
        element.value = { other: 'x' };

        expect(open(element).querySelector('input')!.value).toBe('default');
    });

    it('submitting_calls_the_save_function_with_the_values_and_an_abort_signal', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        const save = vi.fn().mockResolvedValue('Off');
        element.save = save;
        const dialog = open(element);
        dialog.querySelector('input')!.value = 'a@b.se';

        submit(dialog);
        await flush();

        expect(save).toHaveBeenCalledWith({ email: 'a@b.se' }, expect.any(AbortSignal));
    });

    it('invalid_form_calls_nothing', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        const save = vi.fn().mockResolvedValue('Off');
        element.save = save;
        const dialog = open(element);
        dialog.querySelector('input')!.required = true;

        submit(dialog);
        await flush();

        expect(save).not.toHaveBeenCalled();
    });

    it('submitting_without_a_save_function_reports_an_error_naming_the_tag_and_keeps_the_dialog_open', async () => {
        const reported = captureProblems();
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        const dialog = open(element);

        submit(dialog);
        await flush();

        expect(reported.messages()).toContainEqual(expect.stringContaining('r-setting-row'));
        expect(element.querySelector('dialog')).toBe(dialog);
    });

    it('saved_closes_the_dialog_shows_the_new_state_and_keeps_the_values_and_fires_the_event', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        element.save = vi.fn().mockResolvedValue('Off');
        const saved = vi.fn();
        element.addEventListener('r-setting-saved', saved);
        const dialog = open(element);
        dialog.querySelector('input')!.value = 'a@b.se';

        submit(dialog);
        await flush();

        expect(element.querySelector('dialog')).toBeNull();
        expect(element.querySelector('.setting-state')!.textContent).toBe('Off');
        expect(element.value).toEqual({ email: 'a@b.se' });
        const event = saved.mock.calls[0][0];
        expect(event.state).toBe('Off');
        expect(event.values).toEqual({ email: 'a@b.se' });
    });

    it('while_saving_the_dialog_is_aria_busy_and_the_form_cannot_be_submitted_again', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        let finish!: (state: string) => void;
        const save = vi.fn().mockReturnValue(new Promise<string>((resolve) => (finish = resolve)));
        element.save = save;
        const dialog = open(element);

        submit(dialog);
        submit(dialog);
        await flush();

        expect(dialog.getAttribute('aria-busy')).toBe('true');
        expect(save).toHaveBeenCalledTimes(1);
        finish('Off');
        await flush();
        expect(dialog.hasAttribute('aria-busy')).toBe(false);
    });

    it('closing_while_saving_aborts_the_signal_and_the_outcome_changes_nothing_and_fires_nothing', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        let finish!: (state: string) => void;
        let signal!: AbortSignal;
        element.save = (_values, s) => {
            signal = s;
            return new Promise<string>((resolve) => (finish = resolve));
        };
        const saved = vi.fn();
        element.addEventListener('r-setting-saved', saved);
        const dialog = open(element);
        submit(dialog);
        await flush();

        dialog.querySelector<HTMLButtonElement>('.setting-close')!.click();
        finish('Off');
        await flush();

        expect(signal.aborted).toBe(true);
        expect(saved).not.toHaveBeenCalled();
        expect(element.querySelector('.setting-state')!.textContent).toBe('On');
        expect(element.value).toEqual({});
    });

    it('failed_save_keeps_the_dialog_open_with_the_entries_and_shows_a_failure_message', async () => {
        captureProblems();
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        element.save = vi.fn().mockRejectedValue(new Error('boom'));
        const saved = vi.fn();
        element.addEventListener('r-setting-saved', saved);
        const dialog = open(element);
        dialog.querySelector('input')!.value = 'a@b.se';

        submit(dialog);
        await flush();

        expect(element.querySelector('dialog')).toBe(dialog);
        expect(dialog.querySelector('input')!.value).toBe('a@b.se');
        expect(dialog.querySelector('[role="alert"]')!.textContent).toBe('The change could not be saved. Try again.');
        expect(dialog.hasAttribute('aria-busy')).toBe(false);
        expect(saved).not.toHaveBeenCalled();
    });

    it('closing_without_saving_calls_nothing_fires_nothing_and_leaves_the_row', async () => {
        const { element } = mount(settingRow({ name: 'Mail', state: 'On' }));
        const save = vi.fn().mockResolvedValue('Off');
        element.save = save;
        const saved = vi.fn();
        element.addEventListener('r-setting-saved', saved);

        open(element).querySelector<HTMLButtonElement>('.setting-close')!.click();
        await flush();

        expect(save).not.toHaveBeenCalled();
        expect(saved).not.toHaveBeenCalled();
        expect(element.querySelector('dialog')).toBeNull();
        expect(element.querySelector('.setting-state')!.textContent).toBe('On');
    });

    it('rows_in_a_list_are_separated_by_a_1px_muted_line', () => {
        mount(settingRow({ name: 'A', state: 'x' }));
        const css = document.head.querySelector('style[data-r-styles="r-setting-row"]')!.textContent!;

        expect(css).toMatch(/& \+ r-setting-row\s*\{\s*border-top: 1px solid var\(--bd-muted\);/);
    });

    it('row_stays_still_on_hover_and_only_the_button_responds', () => {
        mount(settingRow({ name: 'A', state: 'x' }));
        const css = document.head.querySelector('style[data-r-styles="r-setting-row"]')!.textContent!;

        expect(css).not.toMatch(/r-setting-row\s*\{[^}]*:hover/);
        expect(css).toMatch(/button\s*\{[\s\S]*&:hover\s*\{\s*background: var\(--surface-hover\)/);
    });
});
