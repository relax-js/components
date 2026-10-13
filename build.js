const esbuild = require('esbuild');
const fs = require('fs');

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
    .then(() => console.log('Build complete'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
