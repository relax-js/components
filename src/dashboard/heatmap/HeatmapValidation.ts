import { reportProblem } from '../../foundations/problems/problems';
const tag = 'r-heatmap';

export function dataIsValid(rowLabels: unknown, columnLabels: unknown, cellValues: unknown): boolean {
    if (!Array.isArray(rowLabels) || !Array.isArray(columnLabels) || !Array.isArray(cellValues)) {
        reportProblem(tag, 'rows, columns and values must each be an array');
        return false;
    }
    for (const [rowIndex, row] of cellValues.entries()) {
        if (!Array.isArray(row) || row.length !== columnLabels.length) {
            const label = rowLabels[rowIndex] ?? String(rowIndex);
            reportProblem(tag, `row "${label}" has ${Array.isArray(row) ? row.length : 'no'} values for ${columnLabels.length} columns`);
            return false;
        }
        for (const value of row) {
            const missing = value === null || value === undefined;
            if (!missing && (typeof value !== 'number' || Number.isNaN(value))) {
                reportProblem(tag, `cell value "${String(value)}" in row "${rowLabels[rowIndex] ?? rowIndex}" is not a number`);
                return false;
            }
        }
    }
    return true;
}
