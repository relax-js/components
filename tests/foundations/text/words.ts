import { loadNamespace, registerNamespace, setLocale } from '@relax.js/core/i18n';
import en from '../../../src/locales/en/r-components.json';

/** Rewords the English words for the rest of the test; `restoreWords()` puts the shipped ones back. */
export async function rewordEnglish(words: Partial<typeof en>): Promise<void> {
    registerNamespace('en', 'r-components', { ...en, ...words });
    await setLocale('en');
    await loadNamespace('r-components');
}

export async function restoreWords(): Promise<void> {
    registerNamespace('en', 'r-components', en);
    await setLocale('en');
    await loadNamespace('r-components');
}
