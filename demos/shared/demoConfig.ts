import { fileURLToPath } from 'node:url';
import type { Plugin, UserConfig } from 'vite';

const componentsSource = fileURLToPath(new URL('../../src/', import.meta.url));

/**
 * The Vite configuration every demo shares. The demos run against the components' source, so a
 * change in `src/` shows up in a running demo without building the package first.
 */
export function demoConfig(port: number, plugins: Plugin[] = []): UserConfig {
    return {
        resolve: {
            alias: [
                { find: /^@relax\.js\/components$/, replacement: `${componentsSource}index.ts` },
                { find: '@relax.js/components/theme.css', replacement: `${componentsSource}theme.css` },
                { find: '@relax.js/components/theme-sizes.css', replacement: `${componentsSource}theme-sizes.css` },
            ],
        },
        plugins,
        // Vite's dev transform targets esnext and ignores tsconfig's target, which leaves Stage 3
        // decorators in the code; no browser parses them yet, so they are lowered here.
        esbuild: { target: 'es2022' },
        build: { target: 'es2022' },
        server: { port },
        preview: { port },
    };
}
