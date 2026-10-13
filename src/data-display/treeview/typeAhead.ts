// Keys typed within this long of each other spell one prefix, as in a native list box.
const pauseMs = 500;

/** Finds the next item whose label starts with what the user has typed. */
export class TypeAhead {
    private typed = '';
    private typedAt = 0;

    /**
     * Adds `key` to the typed prefix and returns the first item after `current` (wrapping round)
     * whose label starts with it. A fresh prefix searches past `current`, a growing one from it.
     */
    next(key: string, items: HTMLElement[], current: HTMLElement, labelOf: (item: HTMLElement) => string): HTMLElement | undefined {
        const now = Date.now();
        this.typed = (now - this.typedAt < pauseMs ? this.typed : '') + key.toLocaleLowerCase();
        this.typedAt = now;
        const start = items.indexOf(current) + (this.typed.length === 1 ? 1 : 0);
        for (let offset = 0; offset < items.length; offset++) {
            const candidate = items[(start + offset) % items.length];
            if (labelOf(candidate).toLocaleLowerCase().startsWith(this.typed)) {
                return candidate;
            }
        }
        return undefined;
    }
}

/** Whether a key press is a printable character for type-ahead rather than a command. */
export function isTypedCharacter(event: KeyboardEvent): boolean {
    return event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
}
