/** Fired by `<r-step>` when its form was submitted valid. */
export class StepDoneEvent extends Event {
    static readonly type = 'r-step-done';

    constructor(
        /** The form's values by field name. */
        public readonly values: Record<string, string>
    ) {
        super(StepDoneEvent.type, { bubbles: true });
    }
}

/**
 * One step of a multi-step flow. It holds its own form, checked with the browser's native
 * validation, and says when it is done.
 *
 * @example
 * ```html
 * <r-step><form><input name="email" required><button>Next</button></form></r-step>
 * ```
 *
 * @fires r-step-done - {@link StepDoneEvent}
 */
export class Step extends HTMLElement {
    private values: Record<string, string> = {};

    /** The values the form starts from, such as when the user goes back to the step. */
    get value(): Record<string, string> {
        return this.values;
    }

    set value(values: Record<string, string>) {
        this.values = values;
        this.fillForm();
    }

    connectedCallback(): void {
        this.addEventListener('submit', this.onSubmit);
        this.fillForm();
    }

    disconnectedCallback(): void {
        this.removeEventListener('submit', this.onSubmit);
    }

    private readonly onSubmit = (event: Event): void => {
        event.preventDefault();
        const form = this.querySelector('form');
        if (!form || !form.reportValidity()) {
            return;
        }
        const values: Record<string, string> = {};
        new FormData(form).forEach((entry, key) => {
            if (typeof entry === 'string') {
                values[key] = entry;
            }
        });
        this.dispatchEvent(new StepDoneEvent(values));
    };

    // Inputs the values have no field for keep what the markup gives them.
    private fillForm(): void {
        const form = this.querySelector('form');
        if (!form) {
            return;
        }
        for (const [field, fieldValue] of Object.entries(this.values)) {
            const input = form.elements.namedItem(field);
            if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
                input.value = fieldValue;
            }
        }
    }
}

if (!customElements.get('r-step')) {
    customElements.define('r-step', Step);
}

declare global {
    interface HTMLElementEventMap {
        [StepDoneEvent.type]: StepDoneEvent;
    }
    interface HTMLElementTagNameMap {
        'r-step': Step;
    }
}
