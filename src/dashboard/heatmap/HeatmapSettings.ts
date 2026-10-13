import { reportProblem } from '../../foundations/problems/problems';
const tag = 'r-heatmap';

export type Scale = 'sequential' | 'diverging';

export interface Settings {
    scale: Scale;
    midpoint: number;
    min: number | undefined;
    max: number | undefined;
    showValues: boolean;
}

export interface ScaleRange {
    low: number;
    high: number;
}

export function readSettings(element: HTMLElement): Settings | undefined {
    const scale = element.getAttribute('scale') ?? 'sequential';
    if (scale !== 'sequential' && scale !== 'diverging') {
        reportProblem(tag, `scale must be "sequential" or "diverging", not "${scale}"`);
        return undefined;
    }
    const midpoint = readNumber(element, 'midpoint');
    const min = readNumber(element, 'min');
    const max = readNumber(element, 'max');
    if (midpoint === null || min === null || max === null) {
        return undefined;
    }
    return {
        scale,
        midpoint: midpoint ?? 0,
        min,
        max,
        showValues: element.hasAttribute('show-values'),
    };
}

/** The attribute as a number, undefined when absent, null after reporting one that is not a number. */
function readNumber(element: HTMLElement, name: string): number | undefined | null {
    const raw = element.getAttribute(name);
    if (raw === null || raw.trim() === '') {
        return undefined;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
        reportProblem(tag, `${name} must be a number, not "${raw}"`);
        return null;
    }
    return value;
}

/** The fixed ends where the page gave them, the data's own otherwise. Undefined after reporting a bad range. */
export function scaleRange(settings: Settings, data: number[]): ScaleRange | undefined {
    if (settings.min !== undefined && settings.max !== undefined && settings.min >= settings.max) {
        reportProblem(tag, `min (${settings.min}) must be below max (${settings.max})`);
        return undefined;
    }
    const low = settings.min ?? (data.length > 0 ? Math.min(...data) : 0);
    const high = settings.max ?? (data.length > 0 ? Math.max(...data) : 0);
    return { low, high };
}
