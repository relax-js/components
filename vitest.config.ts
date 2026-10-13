import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.{tests,test,spec}.{ts,tsx}'],
        exclude: ['tests/**/*.browser.test.ts', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.{tests,test,spec}.ts']
        },
        globals: true
    }
});
