import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/status-mark/StatusMark';
import type { StatusMark } from '../../../src/dashboard/status-mark/StatusMark';

function markWith(html: string): StatusMark {
    document.body.innerHTML = html;
    return document.querySelector('r-status-mark')!;
}

describe('r-status-mark', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('the_mark_replaces_its_content_with_the_tone_icon_label_and_note', () => {
        const mark = markWith('<r-status-mark tone="ok" note="2025-09-20">Paid</r-status-mark>');

        expect(mark.querySelector('r-icon')!.getAttribute('name')).toBe('check-circle');
        expect(mark.querySelector('.label')!.textContent).toBe('Paid');
        expect(mark.querySelector('.note')!.textContent).toBe('2025-09-20');
    });

    it('an_empty_or_missing_note_leaves_the_note_out', () => {
        expect(markWith('<r-status-mark note="">Paid</r-status-mark>').querySelector('.note')).toBeNull();
        expect(markWith('<r-status-mark>Paid</r-status-mark>').querySelector('.note')).toBeNull();
    });

    it('a_mark_without_text_leaves_the_label_out', () => {
        const mark = markWith('<r-status-mark note="x"></r-status-mark>');

        expect(mark.querySelector('.label')).toBeNull();
        expect(mark.querySelector('r-icon')).not.toBeNull();
        expect(mark.querySelector('.note')).not.toBeNull();
    });

    it('a_mark_without_tone_is_muted', () => {
        expect(markWith('<r-status-mark>Paid</r-status-mark>').dataset.tone).toBe('muted');
    });

    it('an_unknown_tone_reports_an_error_and_is_muted', () => {
        const reported = captureProblems();
        const mark = markWith('<r-status-mark tone="loud">Paid</r-status-mark>');

        expect(reported.messages()).not.toEqual([]);
        expect(mark.dataset.tone).toBe('muted');
    });

    it('the_mark_carries_its_tone_as_data_tone', () => {
        expect(markWith('<r-status-mark tone="danger">Late</r-status-mark>').dataset.tone).toBe('danger');
    });

    it('moving_the_mark_keeps_its_label_and_does_not_draw_it_again', () => {
        const mark = markWith('<r-status-mark tone="ok">Paid</r-status-mark>');
        const icon = mark.querySelector('r-icon');

        document.body.append(document.createElement('div'));
        document.body.querySelector('div')!.append(mark);

        expect(mark.querySelector('.label')!.textContent).toBe('Paid');
        expect(mark.querySelector('r-icon')).toBe(icon);
    });

    it('changing_tone_or_note_updates_the_mark_and_keeps_the_label', () => {
        const mark = markWith('<r-status-mark tone="ok" note="a">Paid</r-status-mark>');

        mark.setAttribute('tone', 'danger');
        mark.setAttribute('note', 'b');

        expect(mark.dataset.tone).toBe('danger');
        expect(mark.querySelector('r-icon')!.getAttribute('name')).toBe('x-circle');
        expect(mark.querySelector('.note')!.textContent).toBe('b');
        expect(mark.querySelector('.label')!.textContent).toBe('Paid');
    });

    it('changing_the_text_after_drawing_does_not_change_the_label', () => {
        const mark = markWith('<r-status-mark>Paid</r-status-mark>');

        mark.append('Other');
        mark.setAttribute('note', 'x');

        expect(mark.querySelector('.label')!.textContent).toBe('Paid');
    });
});
