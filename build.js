const esbuild = require('esbuild');
const fs = require('fs');

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

esbuild
    .build({
        entryPoints: ['src/index.ts'],
        outfile: 'dist/index.mjs',
        format: 'esm',
        bundle: true,
        minify: true,
        target: 'es2022',
        sourcemap: true,
        external: ['@relax.js/core', '@relax.js/core/*'],
    })
    .then(() => fs.copyFileSync('src/theme.css', 'dist/theme.css'))
    .then(keepDeclaredEvents)
    .then(() => console.log('Build complete'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
