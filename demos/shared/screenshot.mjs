// Takes the screenshots the READMEs show: starts each demo's dev server, waits for its data to
// draw, and saves the first screen in light and dark to demos/screenshots/.
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const demosFolder = fileURLToPath(new URL('../', import.meta.url));

const shots = [
    { demo: 'ops-dashboard', path: '/', ready: 'r-status-grid li', settleMs: 4000 },
    { demo: 'back-office', path: '/', ready: 'r-table tbody tr:not(.empty)', settleMs: 500 },
    { demo: 'finance-tracker', path: '/', ready: 'r-line-chart svg', settleMs: 500, height: 960 },
];

await mkdir(`${demosFolder}screenshots`, { recursive: true });
const browser = await chromium.launch();
try {
    for (const shot of shots) {
        const root = `${demosFolder}${shot.demo}`;
        const server = await createServer({ root, configFile: `${root}/vite.config.ts`, logLevel: 'error' });
        await server.listen();
        try {
            const url = new URL(shot.path, server.resolvedUrls.local[0]).href;
            for (const colorScheme of ['light', 'dark']) {
                const page = await browser.newPage({ viewport: { width: 1440, height: shot.height ?? 900 }, colorScheme, locale: 'en-GB' });
                page.on('pageerror', (error) => console.error(`${shot.demo}: ${error.message}`));
                await page.goto(url);
                await page.waitForSelector(shot.ready);
                await page.waitForTimeout(shot.settleMs);
                const file = `${demosFolder}screenshots/${shot.demo}-${colorScheme}.png`;
                await page.screenshot({ path: file });
                console.log(`saved ${file}`);
                await page.close();
            }
        } finally {
            await server.close();
        }
    }
} finally {
    await browser.close();
}
