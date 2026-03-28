const esbuild = require('esbuild');

const entryPoints = [
    { entry: 'src/index.ts', out: 'index' },
];

const commonOptions = {
    bundle: true,
    minify: true,
    target: 'es2022',
    sourcemap: true,
    preserveSymlinks: true,
    external: ['relaxjs', 'relaxjs/*'],
};

async function build() {
    const builds = entryPoints.flatMap(({ entry, out }) => [
        esbuild.build({
            ...commonOptions,
            entryPoints: [entry],
            outfile: `dist/${out}.mjs`,
            format: 'esm',
        }),
        esbuild.build({
            ...commonOptions,
            entryPoints: [entry],
            outfile: `dist/${out}.js`,
            format: 'cjs',
        }),
    ]);

    await Promise.all(builds);
    console.log('Build complete');
}

build().catch(() => process.exit(1));
