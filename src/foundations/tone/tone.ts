import { reportProblem } from '../problems/problems';

/** How much something asks of the reader: fine, under way, worth a look, wrong, or nothing. */
export declare type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'muted';

const tones: readonly Tone[] = ['ok', 'info', 'warn', 'danger', 'muted'];

/** Whether `value` is one of the five tones. */
export function isTone(value: string): value is Tone {
    return (tones as readonly string[]).includes(value);
}

/** The icon each tone shows beside its text, so a tone is never told by colour alone. */
export const toneIcon: Record<Tone, string> = {
    ok: 'check-circle',
    info: 'clock',
    warn: 'minus-circle',
    danger: 'x-circle',
    muted: 'info',
};

/** Gives an element with `data-tone` the `--tone` and `--tone-soft` of its status pair, as the theme does. */
export const toneRules = /* css */ `
    [data-tone="ok"]     { --tone: var(--status-ok);      --tone-soft: var(--status-ok-soft); }
    [data-tone="info"]   { --tone: var(--status-info);    --tone-soft: var(--status-info-soft); }
    [data-tone="warn"]   { --tone: var(--status-warning); --tone-soft: var(--status-warning-soft); }
    [data-tone="danger"] { --tone: var(--status-danger);  --tone-soft: var(--status-danger-soft); }
    [data-tone="muted"]  { --tone: var(--status-muted);   --tone-soft: var(--status-muted-soft); }
`;

/**
 * Reads the `tone` attribute of `element`. Returns `fallback` when the attribute is missing,
 * and also when its value is not a tone, after reporting an error naming the tag.
 */
export function readTone(element: Element, fallback: Tone): Tone {
    return parseTone(element.getAttribute('tone'), fallback, element.localName);
}

/**
 * Turns a tone name into a tone. Returns `fallback` when `value` is missing, and also when it
 * is not a tone, after reporting an error naming `owner`.
 */
export function parseTone(value: string | null | undefined, fallback: Tone, owner: string): Tone {
    if (value === null || value === undefined) {
        return fallback;
    }
    if ((tones as readonly string[]).includes(value)) {
        return value as Tone;
    }
    reportProblem(owner, `tone "${value}" is not one of ${tones.join(', ')}`);
    return fallback;
}
