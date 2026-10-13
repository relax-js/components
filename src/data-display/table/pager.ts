import { formatValue } from '../../foundations/formatting/formatting';
import { text } from '../../foundations/text/text';

export interface PagerState {
    /** 1-based page shown now. */
    page: number;
    pageCount: number;
    onSelect(page: number): void;
}

/**
 * Draws Previous, the page numbers around the current page with the first and last always
 * reachable, and Next. Hidden when everything fits on one page.
 */
export function drawPager(container: HTMLElement, state: PagerState): void {
    const { page, pageCount, onSelect } = state;
    container.hidden = pageCount <= 1;
    container.setAttribute('aria-label', text('pages'));

    const button = (label: string, target: number, disabled = false): HTMLButtonElement => {
        const element = document.createElement('button');
        element.type = 'button';
        element.textContent = label;
        element.disabled = disabled;
        element.addEventListener('click', () => onSelect(target));
        return element;
    };

    const parts: HTMLElement[] = [button(text('previousPage'), page - 1, page <= 1)];
    let previous = 0;
    for (const number of visiblePages(page, pageCount)) {
        if (number > previous + 1) {
            const gap = document.createElement('span');
            gap.className = 'gap';
            gap.textContent = '…';
            parts.push(gap);
        }
        const pageButton = button(formatValue(number), number);
        if (number === page) {
            pageButton.setAttribute('aria-current', 'page');
        }
        parts.push(pageButton);
        previous = number;
    }
    parts.push(button(text('nextPage'), page + 1, page >= pageCount));
    container.replaceChildren(...parts);
}

function visiblePages(page: number, pageCount: number): number[] {
    if (pageCount <= 7) {
        return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    const pages = new Set([1, pageCount]);
    for (let number = page - 2; number <= page + 2; number++) {
        if (number >= 1 && number <= pageCount) {
            pages.add(number);
        }
    }
    return [...pages].sort((a, b) => a - b);
}
