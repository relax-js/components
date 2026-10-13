import { readdirSync, readFileSync } from 'node:fs';
import { checkProject, formatDiagnostic } from '@relax.js/core/check';

function keyPaths(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) {
        return [prefix];
    }
    return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf8'));
}

describe('demos', () => {
    it('every_demo_template_resolves_against_its_view_model', () => {
        const result = checkProject('demos/tsconfig.json');
        expect(result.diagnostics.map(formatDiagnostic)).toEqual([]);
        expect(result.skipped).toEqual([]);
        expect(result.templates).toBeGreaterThan(0);
    }, 60_000);

    it('every_finance_copy_language_has_exactly_the_keys_of_english', () => {
        const folder = 'demos/finance-tracker/src/copy';
        const expected = keyPaths(readJson(`${folder}/en.json`)).sort();
        for (const file of readdirSync(folder).filter((name) => name.endsWith('.json'))) {
            expect(keyPaths(readJson(`${folder}/${file}`)).sort(), file).toEqual(expected);
        }
    });

    it('every_finance_message_language_has_exactly_the_keys_of_english', () => {
        const folder = 'demos/finance-tracker/src/i18n/locales';
        const expected = keyPaths(readJson(`${folder}/en/finance.json`)).sort();
        for (const locale of readdirSync(folder)) {
            expect(keyPaths(readJson(`${folder}/${locale}/finance.json`)).sort(), locale).toEqual(expected);
        }
    });
});
