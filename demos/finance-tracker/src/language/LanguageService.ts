import { ContainerService } from '@relax.js/core/di';
import { loadNamespace, setLocale } from '@relax.js/core/i18n';
import { configureFormatting } from '@relax.js/components';
import type en from '../copy/en.json';

/** Every fixed text of the app; English is the source of truth for the shape. */
export type FinanceCopy = typeof en;

export type Language = 'en' | 'sv';

// Typed as FinanceCopy, so a key missing from a translation fails to compile.
const copies: Record<Language, () => Promise<{ default: FinanceCopy }>> = {
    en: () => import('../copy/en.json'),
    sv: () => import('../copy/sv.json'),
};

const formats: Record<Language, { locale: string; currency: string }> = {
    en: { locale: 'en-GB', currency: 'SEK' },
    sv: { locale: 'sv-SE', currency: 'SEK' },
};

/** Dispatched once a new language's copy, messages and formats are all in place. */
export class LanguageChangedEvent extends Event {
    static readonly type = 'language-changed';

    constructor(public readonly language: Language) {
        super(LanguageChangedEvent.type);
    }
}

/**
 * The reader's language. Switching changes three things together: the app's fixed copy, its
 * ICU messages (plurals) and the formats every component writes numbers, dates and amounts in.
 */
@ContainerService({ inject: [] })
export class LanguageService extends EventTarget {
    private currentCopy?: FinanceCopy;
    private currentLanguage: Language = 'en';

    get copy(): FinanceCopy {
        if (!this.currentCopy) {
            throw new Error('LanguageService: use() has not finished yet');
        }
        return this.currentCopy;
    }

    get language(): Language {
        return this.currentLanguage;
    }

    get locale(): string {
        return formats[this.currentLanguage].locale;
    }

    async use(language: Language): Promise<void> {
        // Formats first: components redraw on the locale change and read them then.
        configureFormatting(formats[language]);
        const [copy] = await Promise.all([copies[language](), setLocale(language)]);
        // setLocale clears what was loaded, so the namespaces load again for the new language.
        await Promise.all([loadNamespace('finance'), loadNamespace('r-components')]);
        this.currentCopy = copy.default;
        this.currentLanguage = language;
        document.documentElement.lang = language;
        this.dispatchEvent(new LanguageChangedEvent(language));
    }

    /** Calls `listener` after every language change; returns the function that stops it. */
    watch(listener: () => void): () => void {
        this.addEventListener(LanguageChangedEvent.type, listener);
        return () => this.removeEventListener(LanguageChangedEvent.type, listener);
    }
}
