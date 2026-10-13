import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '@relax.js/core/i18n';
import { restoreWords } from '../../foundations/text/words';
import '../../../src/forms/file-input/FileInput';
import { FileErrorEvent, FileReadEvent, type FileInput } from '../../../src/forms/file-input/FileInput';

// jsdom has no form association, so what the element hands to its form is recorded instead.
const formState = new WeakMap<object, { value: File | FormData | null; missing: boolean }>();
const internalsProto = ElementInternals.prototype as unknown as Record<string, unknown>;
internalsProto.setFormValue = function (this: object, value: File | FormData | null) {
    formState.set(this, { value, missing: formState.get(this)?.missing ?? false });
};
internalsProto.setValidity = function (this: object, flags: { valueMissing?: boolean }) {
    formState.set(this, { value: formState.get(this)?.value ?? null, missing: flags.valueMissing === true });
};

function formOf(element: FileInput): { value: File | FormData | null; missing: boolean } {
    const internals = (element as unknown as { internals: object }).internals;
    return formState.get(internals)!;
}

function mountInput(attributes = '', inForm = false): { element: FileInput; form: HTMLFormElement } {
    document.body.innerHTML = `<form><r-file-input name="statement" ${attributes}></r-file-input></form>`;
    const form = document.querySelector('form')!;
    return { element: form.querySelector('r-file-input')!, form };
}

async function choose(element: FileInput, ...files: File[]): Promise<void> {
    const input = element.querySelector('input')!;
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 20));
}

function collect(element: FileInput): { reads: FileReadEvent[]; errors: FileErrorEvent[] } {
    const reads: FileReadEvent[] = [];
    const errors: FileErrorEvent[] = [];
    element.addEventListener('r-file-read', (event) => reads.push(event));
    element.addEventListener('r-file-error', (event) => errors.push(event));
    return { reads, errors };
}

describe('r-file-input', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('choosing_a_file_opens_the_native_file_picker', () => {
        const { element } = mountInput();
        const input = element.querySelector('input')!;
        expect(input.type).toBe('file');
    });

    it('the_chosen_file_is_the_value_in_the_form_data', async () => {
        const { element } = mountInput();
        const file = new File(['a,b'], 'bank.csv', { type: 'text/csv' });
        await choose(element, file);
        expect(formOf(element).value).toBe(file);
    });

    it('required_without_a_file_fails_form_validation', async () => {
        const { element } = mountInput('required');
        expect(formOf(element).missing).toBe(true);
        await choose(element, new File(['x'], 'a.txt'));
        expect(formOf(element).missing).toBe(false);
    });

    it('resetting_the_form_clears_the_chosen_file', async () => {
        const { element, form } = mountInput('required');
        await choose(element, new File(['x'], 'a.txt'));
        form.reset();
        // jsdom does not call formResetCallback on form-associated elements.
        element.formResetCallback();
        expect(element.files).toHaveLength(0);
        expect(formOf(element).value).toBeNull();
        expect(formOf(element).missing).toBe(true);
    });

    it('the_page_can_limit_the_picker_to_given_file_types', () => {
        const { element } = mountInput('accept=".csv,text/csv"');
        expect(element.querySelector('input')!.accept).toBe('.csv,text/csv');
    });

    it('a_file_of_another_type_fires_the_error_event_and_is_not_read', async () => {
        const { element } = mountInput('accept=".csv"');
        const { reads, errors } = collect(element);
        await choose(element, new File(['x'], 'photo.png', { type: 'image/png' }));
        expect(reads).toHaveLength(0);
        expect(errors.map((e) => e.name)).toEqual(['photo.png']);
    });

    it('reading_a_file_makes_no_network_request', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        const open = vi.spyOn(XMLHttpRequest.prototype, 'open');
        const { element } = mountInput();
        const { reads } = collect(element);
        await choose(element, new File(['hello'], 'a.txt'));
        expect(reads).toHaveLength(1);
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
    });

    it('once_read_the_input_fires_an_event_with_name_type_and_content', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        await choose(element, new File(['a,b'], 'bank.csv', { type: 'text/csv' }));
        expect(reads).toHaveLength(1);
        expect([reads[0].name, reads[0].mimeType, reads[0].content]).toEqual(['bank.csv', 'text/csv', 'a,b']);
    });

    it('choosing_the_same_file_again_reads_it_again', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        const file = new File(['a'], 'a.txt');
        await choose(element, file);
        await choose(element, file);
        expect(reads).toHaveLength(2);
    });

    it('closing_the_picker_without_choosing_fires_nothing_and_keeps_the_file', async () => {
        const { element } = mountInput();
        const { reads, errors } = collect(element);
        const file = new File(['a'], 'a.txt');
        await choose(element, file);
        await choose(element);
        expect(reads).toHaveLength(1);
        expect(errors).toHaveLength(0);
        expect(element.files).toEqual([file]);
    });

    it('content_is_text_by_default', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        await choose(element, new File(['abc'], 'a.txt'));
        expect(typeof reads[0].content).toBe('string');
    });

    it('the_page_can_ask_for_the_raw_bytes', async () => {
        const { element } = mountInput('read-as="bytes"');
        const { reads } = collect(element);
        await choose(element, new File([new Uint8Array([1, 2, 3])], 'a.bin'));
        const content = reads[0].content as ArrayBuffer;
        expect(Array.from(new Uint8Array(content))).toEqual([1, 2, 3]);
    });

    it('an_unknown_read_mode_reports_an_error_naming_the_tag_and_renders_empty', () => {
        const reported = captureProblems();
        const { element } = mountInput('read-as="json"');
        expect(reported.messages()).toContainEqual(expect.stringContaining('r-file-input'));
        expect(element.querySelector('input')).toBeNull();
    });

    it('text_is_read_in_the_encoding_the_page_names', async () => {
        const { element } = mountInput('encoding="windows-1252"');
        const { reads } = collect(element);
        await choose(element, new File([new Uint8Array([0xe5])], 'a.txt'));
        expect(reads[0].content).toBe('å');
    });

    it('text_is_read_as_utf8_unless_another_encoding_is_named', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        await choose(element, new File([new Uint8Array([0xc3, 0xa5])], 'a.txt'));
        expect(reads[0].content).toBe('å');
    });

    it('an_unknown_encoding_reports_an_error_naming_the_tag_and_renders_empty', () => {
        const reported = captureProblems();
        const { element } = mountInput('encoding="nonsense-9"');
        expect(reported.messages()).toContainEqual(expect.stringContaining('r-file-input'));
        expect(element.querySelector('input')).toBeNull();
    });

    it('with_multiple_the_input_fires_one_event_per_file', async () => {
        const { element } = mountInput('multiple');
        const { reads } = collect(element);
        expect(element.querySelector('input')!.multiple).toBe(true);
        await choose(element, new File(['1'], 'a.txt'), new File(['2'], 'b.txt'));
        expect(reads.map((r) => r.name)).toEqual(['a.txt', 'b.txt']);
    });

    it('a_file_larger_than_max_size_fires_the_error_event_and_is_not_read', async () => {
        const { element } = mountInput('max-size="3"');
        const { reads, errors } = collect(element);
        await choose(element, new File(['abcd'], 'big.txt'), new File(['abc'], 'ok.txt'));
        expect(errors.map((e) => e.name)).toEqual(['big.txt']);
        expect(reads.map((r) => r.name)).toEqual(['ok.txt']);
    });

    it('without_max_size_any_size_is_read', async () => {
        const { element } = mountInput();
        const { reads, errors } = collect(element);
        await choose(element, new File(['x'.repeat(100000)], 'big.txt'));
        expect(errors).toHaveLength(0);
        expect(reads).toHaveLength(1);
    });

    it('a_file_that_cannot_be_read_fires_an_error_event_naming_the_file_and_reports_it', async () => {
        const reported = captureProblems();
        vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) {
            queueMicrotask(() => this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>));
        });
        const { element } = mountInput();
        const { reads, errors } = collect(element);
        await choose(element, new File(['x'], 'broken.txt'));
        expect(reads).toHaveLength(0);
        expect(errors.map((e) => e.name)).toEqual(['broken.txt']);
        expect(reported.messages()).toContainEqual(expect.stringContaining('broken.txt'));
    });

    async function drop(element: FileInput, ...files: File[]): Promise<void> {
        const event = new Event('drop', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', { value: { files } });
        element.dispatchEvent(event);
        await new Promise((resolve) => setTimeout(resolve, 20));
    }

    it('a_dropped_file_is_read_as_if_chosen_in_the_picker', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        const file = new File(['a,b'], 'bank.csv', { type: 'text/csv' });
        await drop(element, file);
        expect(reads.map((r) => r.content)).toEqual(['a,b']);
        expect(formOf(element).value).toBe(file);
    });

    it('several_dropped_files_without_multiple_fire_the_error_event_and_read_none', async () => {
        const { element } = mountInput();
        const { reads, errors } = collect(element);
        await drop(element, new File(['a'], 'a.txt'), new File(['b'], 'b.txt'));
        expect(reads).toHaveLength(0);
        expect(errors).toHaveLength(1);
    });

    it('a_file_dragged_over_the_input_marks_it_as_a_drop_target_and_the_mark_goes_when_it_leaves_or_drops', async () => {
        const { element } = mountInput();
        element.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
        expect(element.hasAttribute('drop-target')).toBe(true);
        element.dispatchEvent(new Event('dragleave', { bubbles: true }));
        expect(element.hasAttribute('drop-target')).toBe(false);
        element.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
        await drop(element, new File(['a'], 'a.txt'));
        expect(element.hasAttribute('drop-target')).toBe(false);
    });

    it('the_button_text_comes_from_the_r_components_words_in_the_current_language', async () => {
        const { element } = mountInput();
        const button = element.querySelector('button')!;
        expect(button.textContent).toBe('Choose file');
        await setLocale('sv');
        await vi.waitFor(() => expect(button.textContent).toBe('Välj fil'));
        await restoreWords();
    });

    it('the_chosen_file_name_is_shown_exactly_as_given', async () => {
        const { element } = mountInput();
        await choose(element, new File(['x'], '  Bänk <b>2024</b>.csv '));
        expect(element.querySelector('.chosen-name')!.textContent).toBe('  Bänk <b>2024</b>.csv ');
    });

    it('while_a_file_is_being_read_the_input_carries_loading_and_aria_busy', async () => {
        const { element } = mountInput();
        let release!: () => void;
        const file = new File(['x'], 'a.txt');
        vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) {
            release = () => {
                Object.defineProperty(this, 'result', { value: new ArrayBuffer(1) });
                this.dispatchEvent(new Event('load'));
            };
        });
        const pending = choose(element, file);
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(element.hasAttribute('loading')).toBe(true);
        expect(element.getAttribute('aria-busy')).toBe('true');
        release();
        await pending;
        expect(element.hasAttribute('loading')).toBe(false);
        expect(element.getAttribute('aria-busy')).toBe('false');
    });

    it('an_input_in_a_disabled_form_cannot_be_chosen_or_dropped_on', async () => {
        const { element } = mountInput();
        const { reads } = collect(element);
        element.formDisabledCallback(true);
        expect(element.querySelector('button')!.disabled).toBe(true);
        expect(element.querySelector('input')!.disabled).toBe(true);
        await drop(element, new File(['a'], 'a.txt'));
        expect(reads).toHaveLength(0);
        expect(element.files).toHaveLength(0);
    });
});
