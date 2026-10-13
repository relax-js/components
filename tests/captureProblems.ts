import { onTestFinished } from 'vitest';
import { captureRelaxErrors } from '@relax.js/core/testing';

/** Collects the problems components report during the running test, and puts the previous error handler back after it. */
export function captureProblems(): ReturnType<typeof captureRelaxErrors> {
    const captured = captureRelaxErrors();
    onTestFinished(() => captured.restore());
    return captured;
}
