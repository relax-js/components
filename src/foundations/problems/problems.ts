import { reportError } from '@relax.js/core/utils';

/**
 * Reports something a component cannot act on, such as a bad attribute value or a failed load,
 * through the Relaxjs error channel, so it reaches the app's `onError()` handler, `window.relaxErrors`
 * and `captureRelaxErrors()` in tests.
 *
 * Never throws, even when no handler suppresses the error: the value usually comes from data or a
 * template binding that nobody can wrap in a `try`, so a throw would break the page instead of one element.
 */
export function reportProblem(component: string, problem: string, context: Record<string, unknown> = {}): void {
    reportError(`${component}: ${problem}`, { component, ...context });
}
