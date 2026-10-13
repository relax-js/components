const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const manifestPath = 'dist/custom-elements.json';

// The analyzer also guesses an event from every `dispatchEvent(new X(arg))`, naming it after the
// argument. Only the events a component declares with `@fires` carry their real `r-` name.
function keepDeclaredEvents() {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const module of manifest.modules) {
        for (const declaration of module.declarations ?? []) {
            if (declaration.events) {
                declaration.events = declaration.events.filter((event) => event.name?.startsWith('r-'));
            }
        }
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// src/index.ts lists every public module; each also ships alone as `@relax.js/components/<folder>`,
// so an app pays only for the elements it imports.
function moduleEntries() {
    const index = fs.readFileSync('src/index.ts', 'utf8');
    const entries = { index: 'src/index.ts' };
    for (const [, modulePath] of index.matchAll(/export \* from '\.\/(.+)';/g)) {
        const name = path.basename(path.dirname(modulePath));
        if (entries[name]) {
            throw new Error(`Two modules in src/index.ts would both ship as "${name}"`);
        }
        entries[name] = `src/${modulePath}.ts`;
    }
    return entries;
}

function writeEntryTypes(entries) {
    for (const [name, source] of Object.entries(entries)) {
        if (name === 'index') {
            continue;
        }
        const declaration = './' + source.slice('src/'.length, -'.ts'.length);
        fs.writeFileSync(`dist/${name}.d.ts`, `export * from '${declaration}';\n`);
    }
}

// The shipped theme files are self-contained, so a plain <link> needs no further requests.
function writeThemes() {
    const sizes = fs.readFileSync('src/theme-sizes.css', 'utf8');
    const colors = fs.readFileSync('src/theme-colors.css', 'utf8');
    fs.writeFileSync('dist/theme-sizes.css', sizes);
    fs.writeFileSync('dist/theme-colors.css', colors);
    fs.writeFileSync('dist/theme.css', `${sizes}\n${colors}`);
}

// The typings of the words read the English locale file, so it ships next to them.
function copyLocales() {
    fs.cpSync('src/locales', 'dist/locales', { recursive: true });
}

const entries = moduleEntries();
fs.rmSync('dist/chunks', { recursive: true, force: true });

esbuild
    .build({
        entryPoints: entries,
        outdir: 'dist',
        outExtension: { '.js': '.mjs' },
        chunkNames: 'chunks/[name]-[hash]',
        splitting: true,
        format: 'esm',
        bundle: true,
        minify: true,
        target: 'es2022',
        sourcemap: true,
        external: ['@relax.js/core', '@relax.js/core/*'],
    })
    .then(() => writeEntryTypes(entries))
    .then(writeThemes)
    .then(copyLocales)
    .then(keepDeclaredEvents)
    .then(() => console.log('Build complete'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
