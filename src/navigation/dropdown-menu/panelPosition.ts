const gap = 4;

/**
 * Positions a panel below its anchor at the anchor's start edge. Where that would leave the
 * viewport, it goes above the anchor and/or to the anchor's other edge instead.
 */
export function panelPosition(anchor: DOMRect, size: DOMRect, rtl: boolean): { top: number; left: number } {
    let top = anchor.bottom + gap;
    if (top + size.height > window.innerHeight && anchor.top - gap - size.height >= 0) {
        top = anchor.top - gap - size.height;
    }

    let left = rtl ? anchor.right - size.width : anchor.left;
    if (left + size.width > window.innerWidth || left < 0) {
        const other = rtl ? anchor.left : anchor.right - size.width;
        if (other >= 0 && other + size.width <= window.innerWidth) {
            left = other;
        }
    }

    return { top, left };
}
