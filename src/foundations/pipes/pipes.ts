import { createPipeRegistry, type PipeFunction, type PipeRegistry } from '@relax.js/core';
import { formatAmount, type AmountOptions } from '../../dashboard/amount/Amount';

/** Writes an amount in a template: `{{change | amount:2:signed:EUR}}`. Arguments come in any order. */
export const amountPipe: PipeFunction = (value: unknown, ...args: unknown[]): string => {
    const options = readAmountArguments(args);
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        console.error(`amount: ${String(value)} is not a number`);
        return '';
    }
    return formatAmount(value, options);
};

function readAmountArguments(args: unknown[]): AmountOptions {
    const options: AmountOptions = {};
    for (const argument of args) {
        const text = String(argument).trim();
        if (text === '0' || text === '2') {
            options.decimals = Number(text) as 0 | 2;
        } else if (text === 'signed') {
            options.signed = true;
        } else if (text === 'nounit') {
            options.withUnit = false;
        } else if (/^[A-Za-z]{3}$/.test(text)) {
            options.currency = text.toUpperCase();
        } else {
            throw new RangeError(`amount: unknown argument "${text}"`);
        }
    }
    return options;
}

/** The pipes of this package next to the Relaxjs built-ins. Pass it to `compileTemplate` as `pipeRegistry`. */
export function createComponentPipeRegistry(): PipeRegistry {
    const builtIn = createPipeRegistry();
    const own = new Map<string, PipeFunction>([['amount', amountPipe]]);
    return {
        lookup: (name) => own.get(name) ?? builtIn.lookup(name),
        get: (name) => own.get(name) ?? builtIn.get(name),
        has: (name) => own.has(name) || builtIn.has(name),
    };
}
