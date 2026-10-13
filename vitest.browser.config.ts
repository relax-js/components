import { defineConfig } from 'vitest/config';

// Layout tests: jsdom has no layout engine, so sizes, wrapping and overflow are checked in a real browser.
export default defineConfig({
    esbuild: { target: 'es2022' },
    test: {
        include: ['tests/**/*.browser.test.ts'],
        globals: true,
        browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
        },
    },
});
