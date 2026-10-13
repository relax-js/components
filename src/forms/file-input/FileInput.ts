import { text, whenLanguageChanges } from '../../foundations/text/text';

/** Dispatched by `<r-file-input>` once a chosen file has been read in the browser. */
export class FileReadEvent extends Event {
    static readonly type = 'r-file-read';

    constructor(
        /** Name of the file, as given. */
        public readonly name: string,
        /** MIME type of the file, empty when the browser does not know it. */
        public readonly mimeType: string,
        /** The content: a string in text mode, an `ArrayBuffer` in bytes mode. */
        public readonly content: string | ArrayBuffer
    ) {
        super(FileReadEvent.type, { bubbles: true });
    }
}

/** Dispatched by `<r-file-input>` when a file is refused or cannot be read. */
export class FileErrorEvent extends Event {
    static readonly type = 'r-file-error';

    constructor(
        /** Name of the file the error is about. */
        public readonly name: string,
        /** What went wrong. */
        public readonly reason: string
    ) {
        super(FileErrorEvent.type, { bubbles: true });
    }
}

/**
 * A file picker that reads the chosen file in the browser, without uploading it, and still takes
 * part in its form like a native input.
 *
 * @example
 * ```html
 * <r-file-input name="statement" accept=".csv" read-as="text" encoding="windows-1252"></r-file-input>
 * ```
 *
 * @attr {string} accept - Limits the picker to file types, as on a native file input
 * @attr {boolean} multiple - Lets the user choose several files
 * @attr {boolean} required - The form fails validation until a file is chosen
 * @attr {string} read-as - `text` (default) or `bytes`
 * @attr {string} encoding - Encoding of text content, UTF-8 when absent
 * @attr {number} max-size - Largest file in bytes that is read
 * @attr {string} name - Name of the value in the form
 * @fires r-file-read - {@link FileReadEvent}
 * @fires r-file-error - {@link FileErrorEvent}
 */
export class FileInput extends HTMLElement {
    static readonly formAssociated = true;

    static get observedAttributes(): string[] {
        return ['accept', 'multiple', 'required', 'read-as', 'encoding', 'max-size'];
    }

    private readonly internals: ElementInternals;
    private input: HTMLInputElement | null = null;
    private chosen: File[] = [];
    private button: HTMLButtonElement | null = null;
    private chosenName: HTMLElement | null = null;
    private formDisabled = false;
    private stopListening?: () => void;

    constructor() {
        super();
        this.internals = this.attachInternals();
        this.addEventListener('dragover', (e) => this.onDragOver(e));
        this.addEventListener('dragleave', (e) => this.onDragLeave(e));
        this.addEventListener('drop', (e) => void this.onDrop(e));
    }

    connectedCallback(): void {
        this.render();
        this.stopListening = whenLanguageChanges(() => this.reflectWords());
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.render();
        }
    }

    /** The files currently chosen. */
    get files(): readonly File[] {
        return this.chosen;
    }

    formResetCallback(): void {
        this.chosen = [];
        this.reflectValue();
        this.reflectWords();
    }

    private get tag(): string {
        return this.localName;
    }

    private render(): void {
        const readAs = this.getAttribute('read-as') ?? 'text';
        const encoding = this.getAttribute('encoding');
        const maxSize = this.getAttribute('max-size');

        if (readAs !== 'text' && readAs !== 'bytes') {
            return this.renderEmpty(`${this.tag}: read-as must be "text" or "bytes", not "${readAs}"`);
        }
        if (encoding !== null && !isKnownEncoding(encoding)) {
            return this.renderEmpty(`${this.tag}: encoding "${encoding}" is not known to the browser`);
        }
        if (maxSize !== null && !(Number(maxSize) >= 0)) {
            return this.renderEmpty(`${this.tag}: max-size must be a number of bytes, not "${maxSize}"`);
        }

        if (!this.input) {
            this.input = document.createElement('input');
            this.input.type = 'file';
            this.input.tabIndex = -1;
            // The native control is only the picker; the button below carries the words.
            this.input.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
            this.input.addEventListener('change', () => void this.onChange());
            this.button = document.createElement('button');
            this.button.type = 'button';
            this.button.addEventListener('click', () => this.input?.click());
            this.chosenName = document.createElement('span');
            this.chosenName.className = 'chosen-name';
            this.replaceChildren(this.input, this.button, this.chosenName);
        }
        this.input.accept = this.getAttribute('accept') ?? '';
        this.input.multiple = this.hasAttribute('multiple');
        this.reflectValue();
        this.reflectWords();
    }

    private reflectWords(): void {
        if (!this.input || !this.button || !this.chosenName) {
            return;
        }
        const disabled = this.isDisabled();
        this.input.disabled = disabled;
        this.button.disabled = disabled;
        this.button.textContent = text(this.hasAttribute('multiple') ? 'chooseFiles' : 'chooseFile');
        this.chosenName.textContent = this.chosen.map((f) => f.name).join(', ');
    }

    private setReading(reading: boolean): void {
        this.toggleAttribute('loading', reading);
        this.setAttribute('aria-busy', String(reading));
    }

    formDisabledCallback(disabled: boolean): void {
        this.formDisabled = disabled;
        this.reflectWords();
    }

    private renderEmpty(message: string): void {
        console.error(message);
        this.input = null;
        this.button = null;
        this.chosenName = null;
        this.replaceChildren();
        this.internals.setFormValue(null);
        this.internals.setValidity({});
    }

    private reflectValue(): void {
        if (!this.input) {
            return;
        }
        const name = this.getAttribute('name') ?? '';
        if (this.chosen.length === 0) {
            this.internals.setFormValue(null);
        } else if (this.chosen.length === 1) {
            this.internals.setFormValue(this.chosen[0]);
        } else {
            const data = new FormData();
            for (const file of this.chosen) {
                data.append(name, file);
            }
            this.internals.setFormValue(data);
        }

        if (this.hasAttribute('required') && this.chosen.length === 0) {
            this.internals.setValidity({ valueMissing: true }, text('fileRequired'), this.input);
        } else {
            this.internals.setValidity({});
        }
    }

    private async onChange(): Promise<void> {
        const input = this.input;
        if (!input) {
            return;
        }
        const picked = Array.from(input.files ?? []);
        // Cleared so that choosing the same file again is a change the browser reports.
        input.value = '';
        await this.take(picked);
    }

    private onDragOver(event: DragEvent): void {
        if (!this.input || this.input.disabled || this.isDisabled()) {
            return;
        }
        event.preventDefault();
        this.setAttribute('drop-target', '');
    }

    private onDragLeave(event: DragEvent): void {
        if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) {
            return;
        }
        this.removeAttribute('drop-target');
    }

    private async onDrop(event: DragEvent): Promise<void> {
        this.removeAttribute('drop-target');
        if (!this.input || this.isDisabled()) {
            return;
        }
        event.preventDefault();
        const dropped = Array.from(event.dataTransfer?.files ?? []);
        if (dropped.length > 1 && !this.hasAttribute('multiple')) {
            this.dispatchEvent(
                new FileErrorEvent(dropped.map((f) => f.name).join(', '), 'Only one file can be dropped here')
            );
            return;
        }
        await this.take(dropped);
    }

    private isDisabled(): boolean {
        return this.formDisabled || this.matches(':disabled');
    }

    private async take(picked: File[]): Promise<void> {
        if (picked.length === 0) {
            return;
        }

        const accepted: File[] = [];
        for (const file of picked) {
            const refusal = this.refusalFor(file);
            if (refusal) {
                this.dispatchEvent(new FileErrorEvent(file.name, refusal));
            } else {
                accepted.push(file);
            }
        }
        if (accepted.length === 0) {
            return;
        }

        this.chosen = accepted;
        this.reflectValue();
        this.reflectWords();
        this.setReading(true);
        try {
            for (const file of accepted) {
                await this.read(file);
            }
        } finally {
            this.setReading(false);
        }
    }

    private refusalFor(file: File): string | null {
        const accept = this.getAttribute('accept');
        if (accept && !matchesAccept(file, accept)) {
            return `${file.name} is not an accepted type`;
        }
        const maxSize = this.getAttribute('max-size');
        if (maxSize !== null && file.size > Number(maxSize)) {
            return `${file.name} is larger than ${maxSize} bytes`;
        }
        return null;
    }

    private async read(file: File): Promise<void> {
        try {
            const bytes = await readBytes(file);
            const content =
                this.getAttribute('read-as') === 'bytes'
                    ? bytes
                    : new TextDecoder(this.getAttribute('encoding') ?? 'utf-8').decode(bytes);
            this.dispatchEvent(new FileReadEvent(file.name, file.type, content));
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.error(`${this.tag}: ${file.name} could not be read: ${reason}`);
            this.dispatchEvent(new FileErrorEvent(file.name, reason));
        }
    }
}

function isKnownEncoding(label: string): boolean {
    try {
        new TextDecoder(label);
        return true;
    } catch {
        return false;
    }
}

function matchesAccept(file: File, accept: string): boolean {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
        .split(',')
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token !== '')
        .some((token) => {
            if (token.startsWith('.')) {
                return name.endsWith(token);
            }
            if (token.endsWith('/*')) {
                return type.startsWith(token.slice(0, -1));
            }
            return type === token;
        });
}

function readBytes(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error ?? new Error('read failed'));
        reader.readAsArrayBuffer(file);
    });
}

if (!customElements.get('r-file-input')) {
    customElements.define('r-file-input', FileInput);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-file-input': FileInput;
    }
    interface HTMLElementEventMap {
        [FileReadEvent.type]: FileReadEvent;
        [FileErrorEvent.type]: FileErrorEvent;
    }
}
