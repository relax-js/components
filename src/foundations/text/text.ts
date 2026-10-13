import { loadNamespace, registerNamespace, t } from '@relax.js/core/i18n';
import en from '../../locales/en/r-components.json';
import sv from '../../locales/sv/r-components.json';

registerNamespace('en', 'r-components', en);
registerNamespace('sv', 'r-components', sv);

/** Every word a component can write. */
export type TextKey = keyof typeof en;

/**
 * A word in the reader's language. Without i18n set up, or without the namespace loaded, or
 * when an app namespace lacks the key, the English text is written, never the key.
 */
export function text(key: TextKey, values?: Record<string, unknown>): string {
    return t(`r-components:${key}`, values, { fallback: en[key] });
}

/**
 * Calls `redraw` after the Relaxjs locale changes, once the new language's words are loaded,
 * so the redraw writes both words and values in the new language. Returns the function that stops listening.
 */
export function whenLanguageChanges(redraw: () => void): () => void {
    const listener = () => void loadNamespace('r-components').then(redraw);
    document.addEventListener('localechange', listener);
    return () => document.removeEventListener('localechange', listener);
}
