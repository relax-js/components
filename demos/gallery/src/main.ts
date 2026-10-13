import { configureFormatting } from '@relax.js/components';
import '@relax.js/components/theme.css';
import './gallery.css';
import { shots, type Shot } from './shots';

declare global {
    interface Window {
        /** What the screenshot script reads to know which shots exist. */
        gallery: { shots: Omit<Shot, 'render'>[] };
    }
}

// Fixed, so the images do not change with the machine they are taken on.
configureFormatting({ locale: 'en-GB', currency: 'EUR' });

window.gallery = { shots: shots.map(({ render: _, ...shot }) => shot) };

/** How the page and the screenshot script name a shot: its tag and state, as in the image's path. */
function idOf(shot: Pick<Shot, 'tag' | 'name'>): string {
    return `${shot.tag}/${shot.name}`;
}

function stageFor(shot: Shot): HTMLElement {
    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.dataset.shot = idOf(shot);
    stage.style.width = `${String(shot.width ?? 480)}px`;
    if (shot.height) {
        stage.style.minHeight = `${String(shot.height)}px`;
    }
    return stage;
}

/** One shot alone on the page, as the screenshot script captures it. */
async function showOne(shot: Shot): Promise<void> {
    const stage = stageFor(shot);
    document.body.classList.add('single');
    document.body.append(stage);
    await shot.render(stage);
}

/** Every shot that leaves the page as it was, under its component's tag, for looking through by hand. */
async function showAll(): Promise<void> {
    const main = document.createElement('main');
    main.innerHTML = '<h1>Component gallery</h1><p>Every state <code>npm run docs:screenshots</code> captures. Open one alone with <code>?shot=tag/state</code>.</p>';
    document.body.append(main);
    let tag = '';
    for (const shot of shots) {
        if (shot.tag !== tag) {
            tag = shot.tag;
            const heading = document.createElement('h2');
            heading.textContent = `<${tag}>`;
            main.append(heading);
        }
        const figure = document.createElement('figure');
        const caption = document.createElement('figcaption');
        caption.innerHTML = `<a href="?shot=${idOf(shot)}">${shot.title}</a>`;
        figure.append(caption);
        main.append(figure);
        if (shot.window) {
            // a modal would cover the whole gallery
            continue;
        }
        const stage = stageFor(shot);
        figure.append(stage);
        await shot.render(stage);
    }
}

async function start(): Promise<void> {
    const params = new URLSearchParams(location.search);
    if (params.has('list')) {
        // the screenshot script only reads window.gallery
        return;
    }
    const name = params.get('shot');
    const shot = shots.find((candidate) => idOf(candidate) === name);
    if (name && !shot) {
        throw new Error(`There is no shot named "${name}"`);
    }
    await (shot ? showOne(shot) : showAll());
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.body.dataset.ready = '';
}

void start();
