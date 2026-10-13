import { reportProblem } from '../../foundations/problems/problems';
import { installStyles } from '../../foundations/styles';
import { text, whenLanguageChanges } from '../../foundations/text/text';

const styles = /* css */ `
r-setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--control-gap);
    padding: var(--item-padding);

    & + r-setting-row {
        border-top: 1px solid var(--bd-muted);
    }

    & .setting-text {
        display: flex;
        flex-direction: column;
    }

    & .setting-state {
        color: var(--text-muted);
    }

    & button {
        font: inherit;
        color: var(--text-primary);
        background: none;
        border: 1px solid var(--bd-muted);
        border-radius: var(--control-radius);
        padding: var(--control-padding);
        cursor: pointer;
        transition: background var(--motion-fast) ease;

        &:hover {
            background: var(--surface-hover);
        }

        &:focus-visible {
            outline: 2px solid var(--focus-ring);
            outline-offset: 2px;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    r-setting-row button {
        transition: none;
    }
}
`;

/** Fired by `<r-setting-row>` after a change was saved. */
export class SettingSavedEvent extends Event {
    static readonly type = 'r-setting-saved';

    constructor(
        /** The new state text. */
        public readonly state: string,
        /** The saved values by field name. */
        public readonly values: Record<string, string>
    ) {
        super(SettingSavedEvent.type, { bubbles: true });
    }
}

/**
 * One setting in a list: its name, the text describing its current state and a button that
 * opens the setting's form. The form is a `<template>` child.
 *
 * @example
 * ```html
 * <r-setting-row name="Email notifications" state="On">
 *     <template><form>...</form></template>
 * </r-setting-row>
 * ```
 *
 * @attr {string} name - The setting's name
 * @attr {string} state - Text describing the current state
 * @fires r-setting-saved - {@link SettingSavedEvent}
 */
export class SettingRow extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['name', 'state'];
    }

    /** The setting's current values by field name; the form opens filled with them. */
    value: Record<string, string> = {};

    /** Saves the form's values and resolves with the new state text. */
    save?: (values: Record<string, string>, signal: AbortSignal) => Promise<string>;

    private dialog?: HTMLDialogElement;
    private stopListening?: () => void;
    private readonly redraw = () => this.draw();

    connectedCallback(): void {
        installStyles(this, 'r-setting-row', styles);
        this.stopListening = whenLanguageChanges(this.redraw);
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    private draw(): void {
        const name = this.getAttribute('name') ?? '';
        const state = this.getAttribute('state') ?? '';
        const template = this.querySelector(':scope > template');
        this.querySelectorAll(':scope > .setting-text, :scope > button').forEach((part) => part.remove());
        if (name === '') {
            reportProblem('r-setting-row', 'the name attribute is missing');
            return;
        }

        const label = document.createElement('div');
        label.className = 'setting-text';
        const nameElement = document.createElement('span');
        nameElement.className = 'setting-name';
        nameElement.textContent = name;
        const stateElement = document.createElement('span');
        stateElement.className = 'setting-state';
        stateElement.textContent = state;
        label.append(nameElement, stateElement);
        this.append(label);

        if (!template) {
            reportProblem('r-setting-row', 'there is no form template');
            return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', text('changeSetting', { name }));
        button.textContent = text('change');
        button.addEventListener('click', () => this.openForm(name, template as HTMLTemplateElement));
        this.append(button);
    }

    private openForm(name: string, template: HTMLTemplateElement): void {
        if (this.dialog) {
            return;
        }
        const dialog = document.createElement('dialog');
        dialog.className = 'setting-dialog';
        const heading = document.createElement('h2');
        heading.textContent = name;
        dialog.setAttribute('aria-label', name);
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'setting-close';
        close.textContent = text('close');
        close.addEventListener('click', () => dialog.close());
        const form = template.content.querySelector('form')?.cloneNode(true) as HTMLFormElement | undefined;
        dialog.append(heading, close);
        if (form) {
            this.fillForm(form);
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                void this.submit(form, dialog);
            });
            dialog.append(form);
        }
        dialog.addEventListener('close', () => {
            this.dialog = undefined;
            dialog.remove();
        });
        this.dialog = dialog;
        this.append(dialog);
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    // Inputs the value has no field for keep what the template gives them.
    private fillForm(form: HTMLFormElement): void {
        for (const [field, fieldValue] of Object.entries(this.value)) {
            const input = form.elements.namedItem(field);
            if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
                input.value = fieldValue;
            }
        }
    }

    private async submit(form: HTMLFormElement, dialog: HTMLDialogElement): Promise<void> {
        if (!form.reportValidity()) {
            return;
        }
        if (!this.save) {
            reportProblem('r-setting-row', 'no save function has been set');
            return;
        }
        const values: Record<string, string> = {};
        new FormData(form).forEach((entry, key) => {
            if (typeof entry === 'string') {
                values[key] = entry;
            }
        });
        if (dialog.getAttribute('aria-busy') === 'true') {
            return;
        }
        dialog.querySelector('.setting-failure')?.remove();
        dialog.setAttribute('aria-busy', 'true');
        const controller = new AbortController();
        // A dialog closed mid-save abandons the save: its outcome is ignored.
        dialog.addEventListener('close', () => controller.abort(), { once: true });
        try {
            const state = await this.save(values, controller.signal);
            if (controller.signal.aborted) {
                return;
            }
            this.value = values;
            this.setAttribute('state', state);
            dialog.close();
            this.dispatchEvent(new SettingSavedEvent(state, values));
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            reportProblem('r-setting-row', 'saving failed', { error });
            const failure = document.createElement('p');
            failure.className = 'setting-failure';
            failure.setAttribute('role', 'alert');
            failure.textContent = text('saveFailed');
            form.append(failure);
        } finally {
            dialog.removeAttribute('aria-busy');
        }
    }
}

if (!customElements.get('r-setting-row')) {
    customElements.define('r-setting-row', SettingRow);
}

declare global {
    interface HTMLElementEventMap {
        [SettingSavedEvent.type]: SettingSavedEvent;
    }
    interface HTMLElementTagNameMap {
        'r-setting-row': SettingRow;
    }
}
