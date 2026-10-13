import { onTestFinished } from 'vitest';
import '../src/theme.css';

/** Widths a component is commonly given: a card on a phone, a card on a tablet, a page section on a desktop. */
export const widths = [280, 480, 960] as const;

/** The smallest text size, in CSS pixels, that a component may draw. */
export const smallestText = 10;

/** Places the element in a host of the given width, waits for it to lay out, and removes it after the test. */
export async function mount<T extends HTMLElement>(element: T, width: number): Promise<T> {
    const host = document.createElement('div');
    host.className = 'layout-host';
    host.style.width = `${String(width)}px`;
    host.append(element);
    document.body.append(host);
    onTestFinished(() => host.remove());
    await settle();
    return element;
}

/** Gives the host of a mounted element a new width and waits for the element to follow. */
export async function resize(element: HTMLElement, width: number): Promise<void> {
    (element.closest('.layout-host') as HTMLElement).style.width = `${String(width)}px`;
    await settle();
}

/** Waits until layout and resize observers have run. */
export async function settle(): Promise<void> {
    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
}

function describeElement(element: Element): string {
    const text = element.textContent?.trim().slice(0, 30);
    const classes = element.getAttribute('class');
    return `<${element.tagName.toLowerCase()}${classes ? ` class="${classes}"` : ''}>${text ? ` "${text}"` : ''}`;
}

interface Part {
    element: Element;
    /** The box it has to stay inside: the element checked, or a container that clips it. */
    within: Element;
}

function* allParts(root: Element | ShadowRoot): Generator<Element> {
    for (const child of root.children) {
        if (!child.checkVisibility({ visibilityProperty: true, opacityProperty: false }) || child.classList.contains('visually-hidden')) {
            continue;
        }
        yield child;
        yield* allParts(child);
        if (child.shadowRoot) {
            yield* allParts(child.shadowRoot);
        }
    }
}

// The parent as rendered: the slot a light-DOM child is shown in, or the host of a shadow root.
function renderedParent(element: Element): Element | null {
    return element.assignedSlot ?? element.parentElement ?? ((element.getRootNode() as ShadowRoot).host || null);
}

/**
 * Each visible part with the box it must stay inside, following the rendered tree through slots.
 * Content a container scrolls is reachable and left out; content it clips must fit inside it, or it is cut off.
 */
function* visibleParts(root: Element): Generator<Part> {
    const parts = root.shadowRoot ? [...allParts(root), ...allParts(root.shadowRoot)] : [...allParts(root)];
    for (const element of parts) {
        let within: Element = root;
        let scrolled = false;
        for (let ancestor = renderedParent(element); ancestor && ancestor !== root; ancestor = renderedParent(ancestor)) {
            const overflow = getComputedStyle(ancestor).overflowX;
            if (overflow === 'auto' || overflow === 'scroll') {
                scrolled = true;
                break;
            }
            if ((overflow === 'hidden' || overflow === 'clip') && within === root) {
                within = ancestor;
            }
        }
        if (!scrolled) {
            yield { element, within };
        }
    }
}

/** Every visible part of the element that sticks out past its left or right edge, or is cut off by a container, described for an assertion message. */
export function overflowing(element: Element): string[] {
    const found: string[] = [];
    // Catches what is drawn out of sight too, such as a clipped table that still widens the page.
    if (element.scrollWidth > element.clientWidth + 1) {
        found.push(`${describeElement(element).split('>')[0]}> scrolls sideways: ${String(element.scrollWidth)} wide in ${String(element.clientWidth)}`);
    }
    for (const { element: part, within } of visibleParts(element)) {
        const box = part.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) {
            continue;
        }
        const bounds = within.getBoundingClientRect();
        if (box.left < bounds.left - 1 || box.right > bounds.right + 1) {
            const container = within === element ? '' : ` inside ${describeElement(within).split('>')[0]}>`;
            found.push(`${describeElement(part)} spans ${Math.round(box.left - bounds.left)}..${Math.round(box.right - bounds.left)} of 0..${Math.round(bounds.width)}${container}`);
        }
    }
    return found;
}

/** Everything that keeps the element from fitting its width cleanly: parts sticking out or cut off, and text running into text. */
export function layoutProblems(element: Element): string[] {
    return [...overflowing(element), ...overlappingText(element)];
}

/** Parts of the element that lie outside the browser window, such as a panel or dialog it opened. */
export function outsideViewport(element: Element): string[] {
    const box = element.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    if (box.left < -1 || box.top < -1 || box.right > width + 1 || box.bottom > height + 1) {
        return [`${describeElement(element)} spans ${Math.round(box.left)},${Math.round(box.top)}..${Math.round(box.right)},${Math.round(box.bottom)} of a ${String(width)}x${String(height)} window`];
    }
    return [];
}

/** The size SVG text is shown at on screen, after the drawing is scaled to fit. */
export function shownTextSize(text: SVGTextElement): number {
    const matrix = text.getScreenCTM();
    // The length of a turned unit vector, so turned text is measured at its size, not its width.
    const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
    return parseFloat(getComputedStyle(text).fontSize) * scale;
}

/** Visible SVG text in the element that is shown smaller than the smallest allowed size. */
export function tooSmallText(element: Element): string[] {
    return [...element.querySelectorAll('text')]
        .filter((text) => text.checkVisibility() && text.textContent !== '')
        .filter((text) => shownTextSize(text) < smallestText)
        .map((text) => `"${text.textContent ?? ''}" is ${shownTextSize(text).toFixed(1)}px`);
}

function* textNodes(root: Element | ShadowRoot): Generator<Text> {
    for (const node of root.childNodes) {
        if (node instanceof Text && node.data.trim() !== '') {
            yield node;
        } else if (node instanceof Element) {
            if (node.classList.contains('visually-hidden') || !node.checkVisibility({ visibilityProperty: true })) {
                continue;
            }
            yield* textNodes(node);
            if (node.shadowRoot) {
                yield* textNodes(node.shadowRoot);
            }
        }
    }
    // Text the page slots into a shadow root is reached through the light DOM above.
}

/** Visible pieces of text in the element, shadow roots included, whose lines overlap each other on screen. */
export function overlappingText(element: Element): string[] {
    const nodes = element.shadowRoot ? [...textNodes(element), ...textNodes(element.shadowRoot)] : [...textNodes(element)];
    const pieces = nodes.map((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return { text: node.data.trim(), boxes: [...range.getClientRects()].filter((box) => box.width > 0 && box.height > 0) };
    });
    const found: string[] = [];
    pieces.forEach((first, index) => {
        for (const second of pieces.slice(index + 1)) {
            const touches = first.boxes.some((a) => second.boxes.some((b) =>
                a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 2 && b.top < a.bottom - 2));
            if (touches) {
                found.push(`"${first.text}" overlaps "${second.text}"`);
            }
        }
    });
    return found;
}

type Point = { x: number; y: number };

/** The element's outline on screen; for SVG, its own box turned and scaled as drawn, so rotated text is its real shape. */
function outline(element: Element): Point[] {
    if (element instanceof SVGGraphicsElement) {
        const box = element.getBBox();
        const matrix = element.getScreenCTM() ?? new DOMMatrix();
        return [[box.x, box.y], [box.x + box.width, box.y], [box.x + box.width, box.y + box.height], [box.x, box.y + box.height]]
            .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
    }
    const box = element.getBoundingClientRect();
    return [{ x: box.left, y: box.top }, { x: box.right, y: box.top }, { x: box.right, y: box.bottom }, { x: box.left, y: box.bottom }];
}

// Two convex outlines are apart when some edge direction separates them (a touch of up to a pixel counts as apart).
function apart(a: Point[], b: Point[]): boolean {
    for (const shape of [a, b]) {
        for (let i = 0; i < shape.length; i++) {
            const next = shape[(i + 1) % shape.length];
            const normal = { x: next.y - shape[i].y, y: shape[i].x - next.x };
            const length = Math.hypot(normal.x, normal.y) || 1;
            const project = (points: Point[]): number[] => points.map((point) => (point.x * normal.x + point.y * normal.y) / length);
            const first = project(a);
            const second = project(b);
            if (Math.max(...first) <= Math.min(...second) + 1 || Math.max(...second) <= Math.min(...first) + 1) {
                return true;
            }
        }
    }
    return false;
}

/** Pairs of the given elements that overlap on screen, described for an assertion message. */
export function overlapping(elements: Iterable<Element>): string[] {
    const shown = [...elements].filter((element) => element.checkVisibility());
    const outlines = shown.map(outline);
    const found: string[] = [];
    shown.forEach((first, index) => {
        shown.slice(index + 1).forEach((second, offset) => {
            if (!apart(outlines[index], outlines[index + 1 + offset])) {
                found.push(`"${first.textContent ?? ''}" overlaps "${second.textContent ?? ''}"`);
            }
        });
    });
    return found;
}
