import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flush } from '@relax.js/core/testing';
import { resetFormatting } from '../../../src/foundations/formatting/formatting';
import { restoreWords, rewordEnglish } from '../../foundations/text/words';
import '../../../src/data-display/table/Table';
import type { Table, TablePageRequest, TableRow } from '../../../src/data-display/table/Table';

const people: TableRow[] = [
    { id: 1, name: 'Cecilia', age: 41 },
    { id: 2, name: 'Adam', age: 29 },
    { id: 3, name: 'Bertil', age: null },
];

function mountTable(markup: string): Table {
    document.body.innerHTML = markup;
    return document.querySelector('r-table')!;
}

const declared = `
    <r-table>
        <r-column field="name" sortable>Name</r-column>
        <r-column field="age" width="80px">Age</r-column>
    </r-table>`;

function cells(table: Table): string[][] {
    return Array.from(table.querySelectorAll('tbody tr')).map((row) =>
        Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent ?? '')
    );
}

function headerTexts(table: Table): string[] {
    return Array.from(table.querySelectorAll('th')).map((th) => th.textContent ?? '');
}

function sortButton(table: Table, field: string): HTMLButtonElement {
    return table.querySelector<HTMLButtonElement>(`th[data-field="${field}"] button`)!;
}

function pageButtons(table: Table): HTMLButtonElement[] {
    return Array.from(table.querySelectorAll<HTMLButtonElement>('.pager button'));
}

describe('r-table', () => {
    afterEach(async () => {
        document.body.replaceChildren();
        resetFormatting();
        await restoreWords();
        vi.restoreAllMocks();
    });

    describe('columns', () => {
        it('declared_columns_become_header_cells_of_a_native_table', () => {
            const table = mountTable(declared);

            expect(table.querySelector('table')).not.toBeNull();
            expect(headerTexts(table)).toEqual(['Name', 'Age']);
        });

        it('a_column_width_sizes_its_col', () => {
            const table = mountTable(declared);

            expect(table.querySelectorAll('col')[1].style.width).toBe('80px');
        });

        it('columns_set_from_code_replace_the_declared_ones', async () => {
            const table = mountTable(declared);
            table.rows = people;

            table.columns = [{ field: 'id', title: 'Id' }];
            await flush();

            expect(headerTexts(table)).toEqual(['Id']);
            expect(cells(table)).toEqual([['1'], ['2'], ['3']]);
        });

        it('a_declared_column_without_field_reports_an_error_and_renders_empty', () => {
            const reported = captureProblems();
            const table = mountTable('<r-table><r-column>Name</r-column></r-table>');

            expect(table.querySelector('table')).toBeNull();
            expect(reported.messages()).toContainEqual(expect.stringMatching(/^r-table: <r-column> "Name" has no field/));
        });

        it('a_column_from_code_without_field_throws', () => {
            const table = mountTable(declared);

            expect(() => (table.columns = [{ field: '', title: 'Broken' }])).toThrow(/r-table: column 'Broken' has no field/);
        });

        it('a_column_declared_with_a_sort_shows_rows_sorted_on_first_load', async () => {
            const table = mountTable(declared.replace('field="name" sortable', 'field="name" sortable sort="desc"'));
            table.rows = people;
            await flush();

            expect(cells(table).map((row) => row[0])).toEqual(['Cecilia', 'Bertil', 'Adam']);
            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('descending');
        });
    });

    describe('column definitions', () => {
        it('an_unrecognised_sort_reports_an_error_and_renders_empty', () => {
            const reported = captureProblems();
            const table = mountTable(declared.replace('field="name" sortable', 'field="name" sort="up"'));

            expect(table.querySelector('table')).toBeNull();
            expect(reported.messages()).toContainEqual(expect.stringMatching(/sort="up"/));
        });

        it('several_columns_with_a_sort_are_sorted_by_the_first_without_an_error', async () => {
            const reported = captureProblems();
            const table = mountTable(
                declared.replace('field="name" sortable', 'field="name" sort="desc"').replace('width="80px"', 'sort="asc"')
            );
            table.rows = people;
            await flush();

            expect(reported.messages()).toEqual([]);
            expect(cells(table).map((row) => row[0])).toEqual(['Cecilia', 'Bertil', 'Adam']);
        });

        it('column_markup_is_read_once_when_the_table_first_draws', async () => {
            const table = mountTable(declared);
            table.querySelector('r-column')!.setAttribute('field', 'age');
            table.rows = people;
            await flush();

            expect(table.querySelector('th')!.dataset.field).toBe('name');
        });

        it('a_table_moved_elsewhere_keeps_the_columns_it_read', async () => {
            const table = mountTable(declared);
            const elsewhere = document.createElement('section');
            document.body.append(elsewhere);
            elsewhere.append(table);
            table.rows = people;
            await flush();

            expect(headerTexts(table)).toEqual(['Name', 'Age']);
        });

        it('a_column_added_after_the_first_draw_throws_an_error_naming_the_table', async () => {
            const table = mountTable(declared);
            const thrown: string[] = [];
            const listen = (event: ErrorEvent) => {
                thrown.push(event.message);
                event.preventDefault();
            };
            window.addEventListener('error', listen);

            table.append(document.createElement('r-column'));
            await flush();
            await new Promise((resolve) => setTimeout(resolve, 0));
            window.removeEventListener('error', listen);

            expect(thrown.join()).toMatch(/r-table: <r-column> was added after/);
        });
    });

    describe('rows', () => {
        it('each_record_becomes_a_row_with_one_cell_per_column', async () => {
            const table = mountTable(declared);
            table.rows = people;
            await flush();

            expect(cells(table)).toEqual([
                ['Cecilia', '41'],
                ['Adam', '29'],
                ['Bertil', ''],
            ]);
        });

        it('setting_rows_again_replaces_them', async () => {
            const table = mountTable(declared);
            table.rows = people;
            await flush();

            table.rows = [{ name: 'Doris', age: 7 }];
            await flush();

            expect(cells(table)).toEqual([['Doris', '7']]);
        });

        it('rows_set_before_connecting_are_drawn_on_connect', async () => {
            const table = document.createElement('r-table');
            table.innerHTML = '<r-column field="name">Name</r-column>';
            table.rows = people;

            document.body.append(table);
            await flush();

            expect(cells(table)).toHaveLength(3);
        });

        it('no_rows_shows_the_configured_no_data_text', async () => {
            await rewordEnglish({ noData: 'Inga rader' });
            const table = mountTable(declared);
            table.rows = [];
            await flush();

            expect(cells(table)).toEqual([['Inga rader']]);
        });

        it('moving_the_table_in_the_dom_does_not_draw_it_again', async () => {
            const table = mountTable(declared);
            table.rows = people;
            await flush();

            const elsewhere = document.createElement('section');
            document.body.append(elsewhere);
            elsewhere.append(table);
            await flush();

            expect(table.querySelectorAll('table')).toHaveLength(1);
            expect(cells(table)).toHaveLength(3);
        });
    });

    describe('showing data', () => {
        const sortableAges = `
            <r-table>
                <r-column field="name" sortable>Name</r-column>
            </r-table>`;

        it('setting_rows_shows_the_first_page_sorted_by_the_table_itself', async () => {
            const table = mountTable(`<r-table page-size="2"><r-column field="n" sort="asc">N</r-column></r-table>`);
            table.rows = [{ n: 'c' }, { n: 'a' }, { n: 'b' }];
            await flush();

            expect(cells(table)).toEqual([['a'], ['b']]);
        });

        it('setting_rows_again_keeps_the_chosen_sort_and_shows_the_first_page', async () => {
            const table = mountTable(sortableAges.replace('<r-column', '<r-column').replace('<r-table>', '<r-table page-size="2">'));
            table.rows = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
            await flush();
            sortButton(table, 'name').click();
            sortButton(table, 'name').click();
            await flush();
            pageButtons(table).find((b) => b.textContent === '2')!.click();
            await flush();

            table.rows = [{ name: 'x' }, { name: 'z' }, { name: 'y' }];
            await flush();

            expect(cells(table)).toEqual([['z'], ['y']]);
        });

        it('cells_show_numbers_grouped_dates_short_and_empty_for_null_and_undefined', async () => {
            const { configureFormatting } = await import('../../../src/foundations/formatting/formatting');
            configureFormatting({ locale: 'en-US' });
            const table = mountTable(
                `<r-table><r-column field="a">A</r-column><r-column field="b">B</r-column><r-column field="c">C</r-column><r-column field="d">D</r-column></r-table>`
            );
            table.rows = [{ a: 1234567, b: new Date(2024, 2, 5), c: null, d: undefined }];
            await flush();

            expect(cells(table)).toEqual([['1,234,567', '3/5/2024', '', '']]);
        });

        it('after_the_locale_changes_cells_and_the_no_data_text_are_drawn_in_the_new_locale', async () => {
            const { configureFormatting } = await import('../../../src/foundations/formatting/formatting');
            const { setLocale } = await import('@relax.js/core/i18n');
            configureFormatting({ locale: 'en-US' });
            const table = mountTable(`<r-table><r-column field="a">A</r-column></r-table>`);
            table.rows = [{ a: 1234.5 }];
            await flush();
            expect(cells(table)).toEqual([['1,234.5']]);

            configureFormatting({ locale: 'de-DE' });
            await setLocale('sv');
            await flush();
            expect(cells(table)).toEqual([['1.234,5']]);

            table.rows = [];
            await flush();
            const svenska = cells(table)[0][0];
            await setLocale('en');
            await flush();
            expect(cells(table)[0][0]).not.toBe(svenska);
        });

        it('a_value_with_markup_is_shown_as_literal_text', async () => {
            const table = mountTable(`<r-table><r-column field="a">A</r-column></r-table>`);
            table.rows = [{ a: '<b>noData</b>' }];
            await flush();

            expect(cells(table)).toEqual([['<b>noData</b>']]);
            expect(table.querySelector('tbody b')).toBeNull();
        });

        it('a_date_written_as_a_string_is_shown_as_given', async () => {
            const table = mountTable(`<r-table><r-column field="a">A</r-column></r-table>`);
            table.rows = [{ a: '2024-03-05' }];
            await flush();

            expect(cells(table)).toEqual([['2024-03-05']]);
        });

        it('before_anything_is_set_the_table_shows_headers_and_an_empty_body', async () => {
            const table = mountTable(declared);
            await flush();

            expect(headerTexts(table)).toEqual(['Name', 'Age']);
            expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
        });

        it('the_table_styles_sit_in_the_relax_components_cascade_layer', () => {
            mountTable(declared);

            const style = document.head.querySelector('style[data-r-styles="r-table"]')!;
            expect(style.textContent).toMatch(/^@layer relax-components \{/);
        });
    });

    describe('sorting', () => {
        it('clicking_a_sortable_header_cycles_ascending_descending_and_unsorted', async () => {
            const table = mountTable(declared);
            table.rows = people;
            await flush();

            sortButton(table, 'name').click();
            await flush();
            expect(cells(table).map((row) => row[0])).toEqual(['Adam', 'Bertil', 'Cecilia']);
            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('ascending');

            sortButton(table, 'name').click();
            await flush();
            expect(cells(table).map((row) => row[0])).toEqual(['Cecilia', 'Bertil', 'Adam']);

            sortButton(table, 'name').click();
            await flush();
            expect(cells(table).map((row) => row[0])).toEqual(['Cecilia', 'Adam', 'Bertil']);
            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('none');
        });

        it('a_column_that_is_not_sortable_has_no_sort_button', () => {
            const table = mountTable(declared);

            expect(sortButton(table, 'age')).toBeNull();
        });

        it('empty_values_sort_last', async () => {
            const table = mountTable(declared.replace('field="age" width="80px"', 'field="age" sortable'));
            table.rows = people;
            await flush();

            sortButton(table, 'age').click();
            await flush();

            expect(cells(table).map((row) => row[1])).toEqual(['29', '41', '']);
        });
    });

    describe('sorting rules', () => {
        const sortable = `
            <r-table>
                <r-column field="name" sortable>Name</r-column>
                <r-column field="age" sortable>Age</r-column>
                <r-column field="born" sortable>Born</r-column>
                <r-column field="note">Note</r-column>
            </r-table>`;
        const names = (table: Table) => cells(table).map((row) => row[0]);

        it('clicking_a_not_sortable_header_changes_nothing_and_it_has_no_aria_sort', async () => {
            const table = mountTable(sortable);
            table.rows = people;
            await flush();

            table.querySelector<HTMLElement>('th[data-field="note"]')!.click();
            await flush();

            expect(names(table)).toEqual(['Cecilia', 'Adam', 'Bertil']);
            expect(table.querySelector('th[data-field="note"]')!.hasAttribute('aria-sort')).toBe(false);
        });

        it('sorting_by_another_column_replaces_the_sort_by_the_first', async () => {
            const table = mountTable(sortable);
            table.rows = people;
            await flush();

            sortButton(table, 'name').click();
            await flush();
            sortButton(table, 'age').click();
            await flush();

            expect(names(table)).toEqual(['Adam', 'Cecilia', 'Bertil']);
            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('none');
            expect(table.querySelector('th[data-field="age"]')!.getAttribute('aria-sort')).toBe('ascending');
        });

        it('text_sorts_with_digit_runs_by_value_and_numbers_and_dates_by_value', async () => {
            const table = mountTable(sortable);
            table.rows = [
                { name: 'item10', age: 9, born: new Date(2000, 1, 1) },
                { name: 'item2', age: 10, born: new Date(2010, 1, 1) },
                { name: 'item1', age: 100, born: new Date(1990, 1, 1) },
            ];
            await flush();

            sortButton(table, 'name').click();
            await flush();
            expect(names(table)).toEqual(['item1', 'item2', 'item10']);

            sortButton(table, 'age').click();
            await flush();
            expect(names(table)).toEqual(['item10', 'item2', 'item1']);

            sortButton(table, 'born').click();
            await flush();
            expect(names(table)).toEqual(['item1', 'item10', 'item2']);
        });

        it('empty_values_sort_after_every_value_in_both_directions', async () => {
            const table = mountTable(sortable);
            table.rows = people;
            await flush();

            sortButton(table, 'age').click();
            await flush();
            sortButton(table, 'age').click();
            await flush();

            expect(cells(table).map((row) => row[1])).toEqual(['41', '29', '']);
        });

        it('every_sortable_header_is_announced_with_aria_sort_none_until_sorted', async () => {
            const table = mountTable(sortable);
            await flush();

            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('none');
            expect(table.querySelector('th[data-field="born"]')!.getAttribute('aria-sort')).toBe('none');

            sortButton(table, 'name').click();
            await flush();
            sortButton(table, 'name').click();
            await flush();
            expect(table.querySelector('th[data-field="name"]')!.getAttribute('aria-sort')).toBe('descending');
        });
    });

    describe('paging', () => {
        const manyPeople = Array.from({ length: 7 }, (_, index) => ({ name: `Person ${index + 1}`, age: index }));

        it('rows_are_split_into_pages_of_page_size', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="3">'));
            table.rows = manyPeople;
            await flush();

            expect(cells(table)).toHaveLength(3);
            expect(pageButtons(table).map((button) => button.textContent)).toEqual(['Previous', '1', '2', '3', 'Next']);
        });

        it('choosing_a_page_shows_its_rows', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="3">'));
            table.rows = manyPeople;
            await flush();

            pageButtons(table).find((button) => button.textContent === '3')!.click();
            await flush();

            expect(cells(table).map((row) => row[0])).toEqual(['Person 7']);
            expect(table.querySelector('.pager [aria-current="page"]')!.textContent).toBe('3');
        });

        it('the_pager_is_hidden_when_one_page_holds_every_row', async () => {
            const table = mountTable(declared);
            table.rows = people;
            await flush();

            expect(table.querySelector<HTMLElement>('.pager')!.hidden).toBe(true);
        });

        it('an_invalid_page_size_reports_an_error_and_renders_empty', () => {
            const reported = captureProblems();
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="many">'));

            expect(table.querySelector('table')).toBeNull();
            expect(reported.messages()).toContainEqual('r-table: page-size="many" is not a whole number above zero');
        });

        it('page_size_is_25_when_the_attribute_is_absent', async () => {
            const table = mountTable(declared);
            table.rows = Array.from({ length: 30 }, (_, index) => ({ name: `P${index}`, age: index }));
            await flush();

            expect(cells(table)).toHaveLength(25);
            expect(pageButtons(table).map((button) => button.textContent)).toEqual(['Previous', '1', '2', 'Next']);
        });

        it('the_pager_is_a_nav_named_by_the_pages_text_and_marks_the_current_page', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="3">'));
            table.rows = manyPeople;
            await flush();

            const nav = table.querySelector('nav.pager')!;
            expect(nav.getAttribute('aria-label')).toBeTruthy();
            expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('1');
        });

        it('with_more_than_seven_pages_the_pager_shows_first_last_and_two_neighbours_with_gaps_marked', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="1">'));
            table.rows = Array.from({ length: 20 }, (_, index) => ({ name: `P${index}`, age: index }));
            await flush();
            for (const target of ['3', '5', '7', '9', '10']) {
                pageButtons(table).find((button) => button.textContent === target)!.click();
                await flush();
            }

            expect(pageButtons(table).map((button) => button.textContent)).toEqual([
                'Previous', '1', '8', '9', '10', '11', '12', '20', 'Next',
            ]);
            expect(table.querySelectorAll('.pager .gap')).toHaveLength(2);
        });

        it('with_seven_pages_every_page_is_shown_without_gaps', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="1">'));
            table.rows = Array.from({ length: 7 }, (_, index) => ({ name: `P${index}`, age: index }));
            await flush();

            expect(pageButtons(table)).toHaveLength(9);
            expect(table.querySelectorAll('.pager .gap')).toHaveLength(0);
        });

        it('changing_page_size_after_loading_neither_redraws_nor_returns_to_the_first_page', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="3">'));
            table.rows = manyPeople;
            await flush();
            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();

            table.setAttribute('page-size', '5');
            await flush();

            expect(table.querySelector('.pager [aria-current="page"]')!.textContent).toBe('2');
            expect(cells(table)).toHaveLength(3);
        });

        it('sorting_returns_to_the_first_page', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="3">'));
            table.rows = manyPeople;
            await flush();
            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();

            sortButton(table, 'name').click();
            await flush();

            expect(table.querySelector('.pager [aria-current="page"]')!.textContent).toBe('1');
        });
    });

    describe('provider', () => {
        it('the_provider_is_asked_for_the_page_page_size_and_sort', async () => {
            const table = mountTable(declared.replace('<r-table>', '<r-table page-size="10">'));
            const requests: TablePageRequest[] = [];
            table.provider = async (request) => {
                requests.push(request);
                return { rows: [{ name: 'Server', age: 1 }], totalCount: 1 };
            };
            await flush();
            sortButton(table, 'name').click();
            await flush();

            expect(requests.map(({ page, pageSize, sort }) => ({ page, pageSize, sort }))).toEqual([
                { page: 1, pageSize: 10, sort: [] },
                { page: 1, pageSize: 10, sort: [{ column: 'name', direction: 'asc' }] },
            ]);
            expect(cells(table)).toEqual([['Server', '1']]);
        });

        it('a_load_no_longer_needed_is_aborted_and_never_drawn', async () => {
            const table = mountTable(declared);
            let finishSlowLoad!: () => void;
            const signals: AbortSignal[] = [];
            table.provider = (request) => {
                signals.push(request.signal);
                return new Promise((resolve) => {
                    finishSlowLoad = () => resolve({ rows: [{ name: 'Stale', age: 0 }], totalCount: 1 });
                });
            };
            const slowLoadFinished = finishSlowLoad;

            table.rows = people;
            await flush();
            slowLoadFinished();
            await flush();

            expect(signals[0].aborted).toBe(true);
            expect(cells(table).map((row) => row[0])).toEqual(['Cecilia', 'Adam', 'Bertil']);
        });

        it('the_table_is_marked_loading_while_a_page_loads', async () => {
            const table = mountTable(declared);
            let finish!: () => void;
            table.provider = () =>
                new Promise((resolve) => {
                    finish = () => resolve({ rows: [], totalCount: 0 });
                });

            expect(table.hasAttribute('loading')).toBe(true);
            expect(table.getAttribute('aria-busy')).toBe('true');

            finish();
            await flush();

            expect(table.hasAttribute('loading')).toBe(false);
            expect(table.getAttribute('aria-busy')).toBe('false');
        });

        it('a_failing_provider_is_reported_by_refresh', async () => {
            captureProblems();
            const table = mountTable(declared);
            const failure = new Error('server down');
            let fail = false;
            table.provider = async () => {
                if (fail) {
                    throw failure;
                }
                return { rows: [], totalCount: 0 };
            };
            await flush();
            fail = true;

            await expect(table.refresh()).rejects.toBe(failure);
        });

        const paged = declared.replace('<r-table>', '<r-table page-size="2">');
        const serverPage = (name: string, totalCount = 6) => ({ rows: [{ name, age: 1 }], totalCount });

        it('a_provider_set_before_connecting_is_first_called_when_it_connects', async () => {
            const table = document.createElement('r-table');
            table.innerHTML = '<r-column field="name">Name</r-column>';
            const provider = vi.fn(async () => serverPage('Early'));
            table.provider = provider;
            expect(provider).not.toHaveBeenCalled();

            document.body.append(table);
            await flush();

            expect(provider).toHaveBeenCalledTimes(1);
            expect(cells(table)).toEqual([['Early']]);
        });

        it('setting_rows_replaces_the_provider_and_setting_provider_replaces_the_rows', async () => {
            const table = mountTable(declared);
            table.provider = async () => serverPage('Server');
            await flush();
            table.rows = people;
            await flush();
            expect(cells(table)).toHaveLength(3);

            table.provider = async () => serverPage('Again');
            await flush();
            expect(table.rows).toBeUndefined();
            expect(cells(table)).toEqual([['Again', '1']]);
        });

        it('the_rows_on_screen_are_dimmed_and_cannot_be_used_while_a_page_loads', () => {
            mountTable(declared);

            const css = document.head.querySelector('style[data-r-styles="r-table"]')!.textContent!;
            const rule = css.slice(css.indexOf('&[loading] tbody'));
            expect(rule).toMatch(/opacity:\s*0\.3/);
            expect(rule.slice(0, rule.indexOf('}'))).toContain('pointer-events: none');
        });

        it('refresh_loads_the_shown_page_again_and_resolves_once_it_is_drawn', async () => {
            const table = mountTable(paged);
            let version = 'first';
            const requests: number[] = [];
            table.provider = async (request) => {
                requests.push(request.page);
                return serverPage(version);
            };
            await flush();
            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();
            version = 'second';

            await table.refresh();

            expect(requests).toEqual([1, 2, 2]);
            expect(cells(table)).toEqual([['second', '1']]);
        });

        it('a_refresh_overtaken_by_the_user_resolves_when_the_picked_page_is_drawn', async () => {
            const table = mountTable(paged);
            const pending: { request: TablePageRequest; finish: () => void }[] = [];
            let slow = false;
            table.provider = (request) =>
                slow
                    ? new Promise((resolve) =>
                          pending.push({ request, finish: () => resolve(serverPage(`Page ${request.page}`)) })
                      )
                    : Promise.resolve(serverPage('Page 1'));
            await flush();
            slow = true;

            let resolved = false;
            const refreshed = table.refresh().then(() => (resolved = true));
            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();
            expect(pending[0].request.signal.aborted).toBe(true);
            pending[0].finish();
            await flush();
            expect(resolved).toBe(false);

            pending[1].finish();
            await refreshed;
            expect(cells(table)).toEqual([['Page 2', '1']]);
        });

        it('a_refresh_overtaken_by_a_failing_load_rejects_with_that_error', async () => {
            captureProblems();
            const table = mountTable(paged);
            const failure = new Error('page 2 down');
            let fail = false;
            table.provider = async (request) => {
                if (fail && request.page === 2) {
                    throw failure;
                }
                return serverPage('Page 1');
            };
            await flush();
            fail = true;

            const refreshed = table.refresh();
            pageButtons(table).find((button) => button.textContent === '2')!.click();

            await expect(refreshed).rejects.toBe(failure);
        });

        it('refresh_with_rows_in_memory_redraws_the_shown_page_and_resolves', async () => {
            const table = mountTable(paged);
            const records = Array.from({ length: 5 }, (_, index) => ({ name: `P${index}`, age: index }));
            table.rows = records;
            await flush();
            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();
            records[2].name = 'Changed';

            await table.refresh();

            expect(cells(table).map((row) => row[0])).toEqual(['Changed', 'P3']);
        });

        it('when_the_total_no_longer_reaches_the_shown_page_it_is_drawn_as_no_data_beyond_the_last_page', async () => {
            const table = mountTable(paged);
            let totalCount = 6;
            table.provider = async (request) =>
                request.page * 2 > totalCount + 1 ? { rows: [], totalCount } : serverPage('Row', totalCount);
            await flush();
            pageButtons(table).find((button) => button.textContent === '3')!.click();
            await flush();
            totalCount = 4;

            await table.refresh();

            expect(table.querySelector('tbody tr')!.classList.contains('empty')).toBe(true);
            expect(table.querySelector('.pager [aria-current="page"]')).toBeNull();
            expect(pageButtons(table).at(-1)!.disabled).toBe(true);
        });

        it('a_provider_failing_while_paging_reports_the_error_keeps_the_rows_and_the_pager_page', async () => {
            const reported = captureProblems();
            const table = mountTable(paged);
            const failure = new Error('server down');
            table.provider = async (request) => {
                if (request.page === 2) {
                    throw failure;
                }
                return serverPage('Page 1');
            };
            await flush();

            pageButtons(table).find((button) => button.textContent === '2')!.click();
            await flush();

            expect(reported.errors).toContainEqual(expect.objectContaining({ message: 'r-table: the provider failed to load page', context: expect.objectContaining({ error: failure }) }));
            expect(cells(table)).toEqual([['Page 1', '1']]);
            expect(table.querySelector('.pager [aria-current="page"]')!.textContent).toBe('1');
        });

        it('a_first_load_failing_reports_the_error_and_leaves_the_body_blank', async () => {
            const reported = captureProblems();
            const table = mountTable(declared);
            const failure = new Error('server down');

            const unhandled = new Promise((resolve) => process.once('unhandledRejection', resolve));
            table.provider = async () => {
                throw failure;
            };

            expect(await unhandled).toBe(failure);
            expect(reported.errors).toContainEqual(expect.objectContaining({ message: 'r-table: the provider failed to load page', context: expect.objectContaining({ error: failure }) }));
            expect(table.querySelectorAll('tbody tr')).toHaveLength(0);
        });
    });
});
