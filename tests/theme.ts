import { readFileSync } from 'node:fs';

/** The default theme as shipped: its sizes and its colours. */
export function readTheme(): string {
    return readFileSync('src/theme-sizes.css', 'utf8') + readFileSync('src/theme-colors.css', 'utf8');
}
