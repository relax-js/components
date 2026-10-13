import { reportProblem } from '../../foundations/problems/problems';
import { installStyles } from '../../foundations/styles';
import { parseTone, toneIcon, type Tone } from '../../foundations/tone/tone';
import '../../foundations/icon/Icon';

/** One state an item can be in; the app names them. */
export interface StatusGridState {
    id: string;
    label: string;
    /** Registered icon name; the tone's default icon when absent. */
    icon?: string;
    /** `muted` when absent. */
    tone?: Tone;
}

/** One item of the grid, shown as a tile in the state it names. */
export interface StatusGridItem {
    label: string;
    /** The id of one of the grid's states. */
    state: string;
}

const styles = /* css */ `
    r-status-grid {
        display: block;

        ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            gap: var(--control-gap);
        }

        .item {
            display: inline-flex;
            align-items: center;
            gap: var(--control-gap);
            max-width: 100%;
        }

        /* A label longer than the whole grid is wide breaks rather than sticking out. */
        .item .label {
            min-width: 0;
            overflow-wrap: anywhere;
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

        .legend {
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
 * Shows a set of items side by side as tiles, each in the state the app gave it. A tile tells
 * its state by icon, by title and by accessible name, and a legend under the grid lists every
 * state, so colour is never the only clue. Tiles are read-only: they take no focus and send
 * no events.
 *
 * Each tile carries its state's tone as `data-tone` and its state id as `data-state`.
 *
 * @example
 * ```typescript
 * const grid = document.querySelector('r-status-grid')!;
 * grid.states = [{ id: 'paid', label: 'Paid', tone: 'ok' }, { id: 'open', label: 'Open' }];
 * grid.items = [{ label: 'January', state: 'paid' }, { label: 'February', state: 'open' }];
 * ```
 */
export class StatusGrid extends HTMLElement {
    private stateList: StatusGridState[] = [];
    private itemList: StatusGridItem[] = [];

    connectedCallback(): void {
        installStyles(this, 'r-status-grid', styles);
        this.draw();
    }

    /** The states an item can be in. */
    get states(): StatusGridState[] {
        return this.stateList;
    }

    set states(value: StatusGridState[]) {
        this.stateList = value;
        this.draw();
    }

    /** The items, in the order they are shown. */
    get items(): StatusGridItem[] {
        return this.itemList;
    }

    set items(value: StatusGridItem[]) {
        this.itemList = value;
        this.draw();
    }

    private draw(): void {
        if (!this.isConnected) {
            return;
        }
        if (!Array.isArray(this.stateList) || !Array.isArray(this.itemList)) {
            reportProblem('r-status-grid', 'states and items must each be an array');
            this.replaceChildren();
            return;
        }
        const states = this.resolveStates();
        if (states === undefined || !this.itemsHaveStates(states)) {
            this.replaceChildren();
            return;
        }

        const items = document.createElement('ul');
        items.className = 'items';
        for (const item of this.itemList) {
            items.append(this.drawItem(item, states.get(item.state)!));
        }

        const legend = document.createElement('ul');
        legend.className = 'legend';
        for (const state of states.values()) {
            const entry = document.createElement('li');
            entry.dataset.tone = state.tone;
            entry.append(this.drawIcon(state), state.label);
            legend.append(entry);
        }
        this.replaceChildren(items, legend);
    }

    /** The states by id with their tone settled, or undefined after reporting a duplicate id. */
    private resolveStates(): Map<string, ResolvedState> | undefined {
        const states = new Map<string, ResolvedState>();
        for (const state of this.stateList) {
            if (states.has(state.id)) {
                reportProblem('r-status-grid', `state id "${state.id}" is used more than once`);
                return undefined;
            }
            const tone = parseTone(state.tone, 'muted', 'r-status-grid');
            states.set(state.id, { ...state, tone, icon: state.icon ?? toneIcon[tone] });
        }
        return states;
    }

    private itemsHaveStates(states: Map<string, ResolvedState>): boolean {
        for (const item of this.itemList) {
            if (!states.has(item.state)) {
                reportProblem('r-status-grid', `item "${item.label}" is in state "${item.state}", which is not defined`);
                return false;
            }
        }
        return true;
    }

    private drawItem(item: StatusGridItem, state: ResolvedState): HTMLElement {
        const text = `${item.label}: ${state.label}`;
        const tile = document.createElement('span');
        tile.className = 'tile';
        tile.dataset.tone = state.tone;
        tile.dataset.state = state.id;
        tile.title = text;
        tile.setAttribute('role', 'img');
        tile.setAttribute('aria-label', text);
        tile.append(this.drawIcon(state));

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = item.label;

        const entry = document.createElement('li');
        entry.className = 'item';
        entry.append(tile, label);
        return entry;
    }

    private drawIcon(state: ResolvedState): HTMLElement {
        const icon = document.createElement('r-icon');
        icon.setAttribute('name', state.icon);
        return icon;
    }
}

type ResolvedState = StatusGridState & { tone: Tone; icon: string };

if (!customElements.get('r-status-grid')) {
    customElements.define('r-status-grid', StatusGrid);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-status-grid': StatusGrid;
    }
}
