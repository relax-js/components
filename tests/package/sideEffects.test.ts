import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

// These entries only declare functions and constants; every other entry registers a tag or a word
// namespace when imported, which a bundler must keep even for a bare `import`.
const entriesWithoutSideEffects = ['formatting', 'tone'];

function sideEffects(): string[] {
    return JSON.parse(readFileSync('package.json', 'utf8')).sideEffects;
}

function entryNames(): string[] {
    const index = readFileSync('src/index.ts', 'utf8');
    return Array.from(index.matchAll(/export \* from '\.\/(.+)';/g), ([, path]) => basename(dirname(path)));
}

describe('package sideEffects', () => {
    it('every_entry_that_registers_something_is_kept_by_bundlers_even_when_imported_bare', () => {
        const declared = sideEffects();
        const registering = entryNames().filter((name) => !entriesWithoutSideEffects.includes(name));

        expect(declared).toEqual(expect.arrayContaining(['./dist/index.mjs', './dist/chunks/*.mjs', '*.css']));
        expect(declared).toEqual(expect.arrayContaining(registering.map((name) => `./dist/${name}.mjs`)));
    });

    it('entries_that_only_declare_functions_can_be_dropped_when_unused', () => {
        const declared = sideEffects();

        for (const name of entriesWithoutSideEffects) {
            expect(declared).not.toContain(`./dist/${name}.mjs`);
        }
    });
});
