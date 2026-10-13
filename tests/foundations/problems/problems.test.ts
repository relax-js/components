import { describe, expect, it } from 'vitest';
import { captureProblems } from '../../captureProblems';
import { reportProblem } from '../../../src/foundations/problems/problems';

describe('reportProblem', () => {
    it('a_problem_reaches_the_relaxjs_error_channel_naming_the_component_in_message_and_context', () => {
        const reported = captureProblems();
        const failure = new Error('server down');

        reportProblem('r-table', 'the provider failed to load page', { error: failure });

        expect(reported.errors).toHaveLength(1);
        expect(reported.errors[0].message).toBe('r-table: the provider failed to load page');
        expect(reported.errors[0].context).toEqual({ component: 'r-table', error: failure });
    });

    it('a_problem_is_never_thrown_even_when_no_handler_suppresses_it', () => {
        expect(() => reportProblem('r-icon', 'no icon is registered as "x"')).not.toThrow();
    });
});
