import { installStyles } from '../../foundations/styles';
import { text, whenLanguageChanges, type TextKey } from '../../foundations/text/text';
import { parseTone, toneIcon, type Tone } from '../../foundations/tone/tone';
import type { StatusGridState } from '../status-grid/StatusGrid';
import '../../foundations/icon/Icon';

/** One period of the year: the month as the page wrote it and the id of the state it is in. */
export interface Period {
    month: string;
    state: string;
}

interface PeriodState {
    id: string;
    textKey: TextKey;
    tone: Tone;
    icon: string;
}

/** Accounting states from not started to closed; `open` and `coming` show their tone's icon. */
const defaultStates: PeriodState[] = [
    { id: 'closed', textKey: 'periodClosed', tone: 'ok', icon: 'check' },
    { id: 'locked', textKey: 'periodLocked', tone: 'ok', icon: 'lock' },
    { id: 'open', textKey: 'periodOpen', tone: 'info', icon: toneIcon.info },
    { id: 'coming', textKey: 'periodComing', tone: 'muted', icon: toneIcon.muted },
];

const styles = /* css */ `
    r-period-grid {
        display: block;

        ol, ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            gap: var(--control-gap);
        }

        .months li {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: var(--control-gap);
        }

        .tile {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--control-padding);
            border-radius: var(--control-radius);
            color: var(--tone);
            background: var(--tone-soft);
        }

        .key {
            margin-block-start: var(--control-gap);
            color: var(--text-muted);

            li {
                display: inline-flex;
                align-items: center;
                gap: var(--control-gap);
            }
        }
    }
`;

/**
 * A year's accounting periods side by side and how far each has come. Every state is told by
 * icon and text as well as colour, and a key under the grid lists the states.
 *
 * @example
 * ```html
 * <r-period-grid year="2026"></r-period-grid>
 * ```
 *
 * @attr {number} year - The year the periods belong to; shown above them
 * @prop {Period[]} periods - The periods in order; setting it on a connected grid redraws it
 * @prop {StatusGridState[]} states - The page's own states; they replace the default ones whole
 */
export class PeriodGrid extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['year'];
    }

    private periodList: Period[] = [];
    private stateList: StatusGridState[] = [];
    private statesAreSet = false;
    private stopListening?: () => void;
    private readonly redraw = () => this.draw();

    connectedCallback(): void {
        installStyles(this, 'r-period-grid', styles);
        this.stopListening = whenLanguageChanges(this.redraw);
        this.draw();
    }

    disconnectedCallback(): void {
        this.stopListening?.();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) {
            this.draw();
        }
    }

    /** The periods in order. */
    get periods(): Period[] {
        return this.periodList;
    }

    set periods(value: Period[]) {
        this.periodList = value;
        this.draw();
    }

    /** The states a period can be in; the accounting defaults until the page sets its own, which replace them whole. */
    get states(): StatusGridState[] {
        return this.statesAreSet ? this.stateList : defaultStates.map((state) => ({ id: state.id, label: text(state.textKey), tone: state.tone, icon: state.icon }));
    }

    set states(value: StatusGridState[]) {
        this.stateList = value;
        this.statesAreSet = true;
        this.draw();
    }

    private draw(): void {
        if (!this.isConnected) {
            return;
        }
        const raw = this.getAttribute('year');
        if (raw !== null && raw.includes('{{')) {
            return;
        }
        const states = this.resolveStates(raw);
        if (states === null) {
            this.replaceChildren();
            return;
        }
        const yearText = (raw ?? '').trim();

        const year = document.createElement('div');
        year.className = 'year';
        year.textContent = yearText;

        this.replaceChildren(year, this.drawMonths(states, yearText), this.drawKey(states));
    }

    /** Validates the inputs and returns the states by id, or null (after logging) when the grid cannot be drawn. */
    private resolveStates(raw: string | null): Map<string, PeriodState & { label: string }> | null {
        if (raw === null || raw.trim() === '' || !Number.isFinite(Number(raw))) {
            console.error(`r-period-grid: year "${raw ?? ''}" is not a number`);
            return null;
        }
        if (!Array.isArray(this.periodList)) {
            console.error('r-period-grid: periods must be an array');
            return null;
        }
        if (!Array.isArray(this.stateList)) {
            console.error('r-period-grid: states must be an array');
            return null;
        }
        const states = new Map<string, PeriodState & { label: string }>();
        if (this.stateList.length === 0 && !this.statesAreSet) {
            for (const state of defaultStates) {
                states.set(state.id, { ...state, label: text(state.textKey) });
            }
        } else {
            for (const state of this.stateList) {
                const tone = parseTone(state.tone, 'muted', 'r-period-grid');
                states.set(state.id, { id: state.id, tone, icon: state.icon ?? toneIcon[tone], label: state.label, textKey: 'periodClosed' });
            }
        }
        for (const period of this.periodList) {
            if (!states.has(period.state)) {
                console.error(`r-period-grid: period "${period.month}" is in state "${period.state}", which is not defined`);
                return null;
            }
        }
        return states;
    }

    private drawMonths(states: Map<string, PeriodState & { label: string }>, yearText: string): HTMLElement {
        const months = document.createElement('ol');
        months.className = 'months';
        for (const period of this.periodList) {
            const state = states.get(period.state)!;
            const title = `${period.month} ${yearText}: ${state.label}`;

            const tile = document.createElement('span');
            tile.className = 'tile';
            tile.dataset.tone = state.tone;
            tile.title = title;
            tile.setAttribute('role', 'img');
            tile.setAttribute('aria-label', title);
            tile.append(this.drawIcon(state.icon));

            const month = document.createElement('span');
            month.className = 'month';
            month.textContent = period.month;

            const entry = document.createElement('li');
            entry.className = state.id;
            entry.append(month, tile);
            months.append(entry);
        }
        return months;
    }

    private drawKey(states: Map<string, PeriodState & { label: string }>): HTMLElement {
        const key = document.createElement('ul');
        key.className = 'key';
        for (const state of states.values()) {
            const entry = document.createElement('li');
            entry.dataset.tone = state.tone;
            entry.append(this.drawIcon(state.icon), state.label);
            key.append(entry);
        }
        return key;
    }

    private drawIcon(name: string): HTMLElement {
        const icon = document.createElement('r-icon');
        icon.setAttribute('name', name);
        return icon;
    }
}

if (!customElements.get('r-period-grid')) {
    customElements.define('r-period-grid', PeriodGrid);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-period-grid': PeriodGrid;
    }
}
