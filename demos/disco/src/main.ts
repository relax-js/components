import { configureFormatting, type BarChart, type HeatmapValue, type StatTile } from '@relax.js/components';
import '@relax.js/components/theme-sizes.css';
import './styles.css';

import { loadNamespace, setLocale } from '@relax.js/core/i18n';

const bands = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '6k', '8k', '10k', '12k', '14k', '16k', '18k', '20k'];
const floorSize = 8;
const tracks = ['Stayin’ Alive', 'Le Freak', 'I Feel Love', 'Night Fever', 'Get Lucky', 'Don’t Start Now', 'Dancing Queen'];

let beat = 0;
let bpm = 126;
let drinks = 412;
const crowd: number[] = Array.from({ length: 20 }, (_, i) => 80 + i * 4);

function bounce(base: number, swing: number): number {
    return Math.max(0, Math.round(base + (Math.random() - 0.5) * swing));
}

/** Bass heavy, with the low bands kicking on every beat. */
function equalizerLevels(kick: boolean): number[] {
    return bands.map((_, i) => {
        const tilt = 85 - i * 3.5;
        return Math.min(100, bounce(kick && i < 4 ? tilt + 15 : tilt - 10, 40));
    });
}

/** A ripple running out from the middle of the floor, so the hot tiles move with the beat. */
function floorHeat(): HeatmapValue[][] {
    const middle = (floorSize - 1) / 2;
    return Array.from({ length: floorSize }, (_, row) =>
        Array.from({ length: floorSize }, (_, column) => {
            const distance = Math.hypot(row - middle, column - middle);
            const wave = Math.sin(distance * 1.4 - beat * 0.9);
            return Math.round(Math.min(10, Math.max(0, 5 + wave * 4 + (Math.random() - 0.5) * 3)));
        }),
    );
}

function drawEqualizer(kick: boolean): void {
    document.querySelector<BarChart>('#equalizer')!.data = {
        labels: bands,
        series: [
            { name: 'Left', values: equalizerLevels(kick) },
            { name: 'Right', values: equalizerLevels(kick) },
            // A fixed ceiling keeps the axis still while the bars jump.
            { name: 'Clipping', values: bands.map(() => 100), threshold: true },
        ],
        summary: 'Live levels per frequency band',
    };
}

function addDanceFloor(): void {
    const floor = document.createElement('r-heatmap');
    floor.setAttribute('min', '0');
    floor.setAttribute('max', '10');
    floor.summary = 'Dancers per floor tile';
    floor.rows = Array.from({ length: floorSize }, (_, i) => String.fromCharCode(65 + i));
    floor.columns = Array.from({ length: floorSize }, (_, i) => String(i + 1));
    floor.values = floorHeat();
    document.querySelector('.floor')!.append(floor);
}

function drawFigures(): void {
    const previousBpm = bpm;
    bpm = Math.min(132, Math.max(118, bpm + Math.round((Math.random() - 0.5) * 4)));
    drinks += Math.round(Math.random() * 3);
    crowd.push(Math.min(260, Math.max(60, bounce(crowd.at(-1)! + 2, 24))));
    crowd.shift();

    const bpmTile = document.querySelector('#bpm')!;
    bpmTile.setAttribute('value', String(bpm));
    bpmTile.setAttribute('previous', String(previousBpm));

    const crowdTile = document.querySelector<StatTile>('#crowd')!;
    crowdTile.setAttribute('value', String(crowd.at(-1)));
    crowdTile.setAttribute('previous', String(crowd[0]));
    crowdTile.trend = {
        labels: crowd.map((_, i) => `${i}`),
        series: [{ name: 'On the floor', values: [...crowd] }],
        summary: 'Dancers over the last minute',
    };

    const drinksTile = document.querySelector('#drinks')!;
    drinksTile.setAttribute('value', String(drinks));
    drinksTile.setAttribute('previous', '388');
}

function drawBooth(): void {
    document.querySelector('#volume')!.setAttribute('value', String(Math.min(120, bounce(98, 30))));
    document.querySelector('#energy')!.setAttribute('value', String(Math.min(100, bounce(60 + Math.sin(beat / 6) * 30, 20))));
    document.querySelector('#smoke')!.setAttribute('value', String((beat * 3) % 100));
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function flash(): void {
    if (reducedMotion.matches) {
        return;
    }
    document.querySelector('.light-show')!.animate(
        [{ filter: 'brightness(1.8)' }, { filter: 'brightness(1)' }],
        { duration: 60000 / bpm, easing: 'ease-out' },
    );
}

function onBeat(): void {
    beat++;
    flash();
    drawEqualizer(true);
    drawFigures();
    drawBooth();
    document.querySelector('r-heatmap')!.values = floorHeat();
    if (beat % 16 === 1) {
        document.querySelector('#track')!.textContent = tracks[Math.floor(beat / 16) % tracks.length];
    }
    setTimeout(onBeat, 60000 / bpm);
}

async function bootstrap(): Promise<void> {
    configureFormatting({ locale: 'en-GB', currency: 'EUR' });
    await setLocale('en');
    await loadNamespace('r-components');

    addDanceFloor();
    onBeat();
    // Between beats the bars fall back, so the equalizer moves at twice the tempo.
    setTimeout(function offBeat() {
        drawEqualizer(false);
        setTimeout(offBeat, 60000 / bpm);
    }, 30000 / bpm);
}

void bootstrap();
