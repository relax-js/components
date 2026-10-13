export interface Formatting {
    /** BCP 47 tag, such as `sv-SE`, used for every number, amount and date. */
    locale: string;
    /** ISO 4217 code, such as `SEK`, for amounts. */
    currency: string;
}

/** What `configureFormatting()` accepts: any part of the configuration. */
export interface FormattingChanges {
    locale?: string;
    currency?: string;
}

let configured: Partial<Formatting> = {};

/**
 * Sets the locale and currency every component writes numbers, amounts and dates with.
 * Components read the configuration when they draw, so what is already drawn keeps its
 * output until it draws again. Words are reworded through the `r-components` i18n namespace.
 *
 * @example
 * configureFormatting({ locale: 'sv-SE', currency: 'SEK' });
 */
export function configureFormatting(changes: FormattingChanges): void {
    if ('texts' in changes) {
        throw new Error(
            'configureFormatting: words are reworded through the "r-components" i18n namespace, not through texts'
        );
    }
    configured = {
        locale: changes.locale ?? configured.locale,
        currency: changes.currency ?? configured.currency,
    };
}

/** The configuration as it stands now: the configured values, else the browser's language and euros. */
export function formatting(): Readonly<Formatting> {
    return {
        locale: configured.locale ?? (typeof navigator === 'undefined' ? 'en-US' : navigator.language),
        currency: configured.currency ?? 'EUR',
    };
}

/** Puts the configuration back to its defaults. For tests. */
export function resetFormatting(): void {
    configured = {};
}

/** Writes a cell or label value the way the configured locale writes it. Empty for null and undefined. */
export function formatValue(value: unknown, locale = formatting().locale): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'number') {
        return new Intl.NumberFormat(locale).format(value);
    }
    if (value instanceof Date) {
        return new Intl.DateTimeFormat(locale).format(value);
    }
    return String(value);
}
