import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/amount/Amount';
import '../../../src/dashboard/status-grid/StatusGrid';
import '../../../src/dashboard/status-mark/StatusMark';
import { formatAmount } from '../../../src/dashboard/amount/Amount';
import type { StatusGrid, StatusGridState } from '../../../src/dashboard/status-grid/StatusGrid';
import { toneIcon, type Tone } from '../../../src/foundations/tone/tone';

const theme = readFileSync('src/theme.css', 'utf8');
const paid: StatusGridState = { id: 'paid', label: 'Paid', tone: 'ok' };
const open: StatusGridState = { id: 'open', label: 'Open' };

function tiles(grid: StatusGrid): HTMLElement[] {
    return Array.from(grid.querySelectorAll<HTMLElement>('.tile'));
}

function installedStyles(): string[] {
    return Array.from(document.head.querySelectorAll('style[data-r-styles]')).map((style) => style.textContent ?? '');
}

describe('putting a component on a page', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('components_render_into_the_light_dom_so_the_pages_css_reaches_their_markup', () => {
        const grid = document.createElement('r-status-grid');
        document.body.append(grid);
        grid.states = [paid];
        grid.items = [{ label: 'Jan', state: 'paid' }];

        expect(grid.shadowRoot).toBeNull();
        expect(document.querySelector('r-status-grid .tile')).not.toBeNull();
    });

    it('setting_structured_data_on_a_connected_element_redraws_it', () => {
        const grid = document.createElement('r-status-grid');
        document.body.append(grid);
        grid.states = [paid, open];
        grid.items = [{ label: 'Jan', state: 'paid' }];
        grid.items = [{ label: 'Jan', state: 'paid' }, { label: 'Feb', state: 'open' }];

        expect(tiles(grid)).toHaveLength(2);
    });

    it('data_set_before_connecting_is_drawn_when_the_element_connects', () => {
        const grid = document.createElement('r-status-grid');
        grid.states = [paid];
        grid.items = [{ label: 'Jan', state: 'paid' }];
        expect(grid.childElementCount).toBe(0);

        document.body.append(grid);

        expect(tiles(grid)).toHaveLength(1);
    });

    it('data_set_while_detached_is_drawn_when_the_element_is_put_back', () => {
        const grid = document.createElement('r-status-grid');
        document.body.append(grid);
        grid.states = [paid, open];
        grid.items = [{ label: 'Jan', state: 'paid' }];
        grid.remove();
        grid.items = [{ label: 'Jan', state: 'paid' }, { label: 'Feb', state: 'open' }];

        document.body.append(grid);

        expect(tiles(grid)).toHaveLength(2);
    });

    it('moving_an_element_does_not_build_or_duplicate_its_markup_again', () => {
        const grid = document.createElement('r-status-grid');
        const target = document.createElement('div');
        document.body.append(grid, target);
        grid.states = [paid];
        grid.items = [{ label: 'Jan', state: 'paid' }];

        target.append(grid);

        expect(tiles(grid)).toHaveLength(1);
        expect(grid.querySelectorAll('.legend > li')).toHaveLength(1);
        expect(document.head.querySelectorAll('style[data-r-styles="r-status-grid"]')).toHaveLength(1);
    });

    it('a_missing_or_invalid_attribute_logs_the_tag_and_the_problem_and_renders_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const amount = document.createElement('r-amount');
        document.body.append(amount);

        expect(error.mock.calls[0][0]).toMatch(/^r-amount: .+/);
        expect(amount.textContent).toBe('');
    });

    it('data_the_component_cannot_draw_is_reported_and_rendered_empty', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const grid = document.createElement('r-status-grid');
        document.body.append(grid);

        grid.items = 'not a list' as never;

        expect(error.mock.calls[0][0]).toMatch(/^r-status-grid: .+/);
        expect(grid.childElementCount).toBe(0);
    });

    it('once_the_input_is_valid_again_the_element_draws_normally', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const amount = document.createElement('r-amount');
        document.body.append(amount);
        amount.setAttribute('value', 'abc');
        expect(amount.textContent).toBe('');

        amount.setAttribute('value', '1285400');

        expect(amount.textContent).toContain('1');
        expect(amount.textContent).not.toBe('');

        const grid = document.createElement('r-status-grid');
        document.body.append(grid);
        grid.states = [paid];
        grid.items = 'bad' as never;
        grid.items = [{ label: 'Jan', state: 'paid' }];
        expect(tiles(grid)).toHaveLength(1);
    });

    it('a_localized_number_in_an_attribute_is_bad_input_and_a_javascript_literal_is_read', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const amount = document.createElement('r-amount');
        amount.setAttribute('value', '1 285 400');
        document.body.append(amount);

        expect(error.mock.calls[0][0]).toMatch(/^r-amount: /);
        expect(amount.textContent).toBe('');

        amount.setAttribute('value', '1.5e3');
        expect(amount.textContent).not.toBe('');
    });

    it('a_function_called_with_arguments_it_cannot_act_on_throws_naming_the_component', () => {
        expect(() => formatAmount(Number.NaN)).toThrow(/^r-amount: /);
        expect(() => formatAmount(1, { decimals: 1 as 0 })).toThrow(/^r-amount: .*decimals/);
    });

    it('anything_shown_with_a_tone_also_shows_an_icon_and_text_saying_the_same', () => {
        const grid = document.createElement('r-status-grid');
        document.body.append(grid);
        const tones = Object.keys(toneIcon) as Tone[];
        grid.states = tones.map((tone) => ({ id: tone, label: `State ${tone}`, tone }));
        grid.items = tones.map((tone) => ({ label: 'Item', state: tone }));

        for (const tile of tiles(grid)) {
            expect(tile.querySelector('r-icon')).not.toBeNull();
            expect(tile.getAttribute('aria-label')).toContain('State ');
        }
        for (const tone of tones) {
            const mark = document.createElement('r-status-mark');
            mark.setAttribute('tone', tone);
            mark.textContent = 'Text';
            document.body.append(mark);
            expect(mark.querySelector('r-icon')).not.toBeNull();
            expect(mark.textContent).toContain('Text');
        }
    });

    it('component_stylesheets_hold_no_colour_value_and_use_only_variables_the_theme_defines', () => {
        document.body.append(
            document.createElement('r-amount'),
            document.createElement('r-status-grid'),
            document.createElement('r-status-mark')
        );
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const styles = installedStyles();
        expect(styles.length).toBeGreaterThan(0);
        for (const css of styles) {
            expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb|light-dark)\(/);
            expect(css).not.toMatch(/:\s*(red|green|blue|black|white|gray|grey|orange|yellow|purple|pink)\b/i);
            for (const [, name] of css.matchAll(/var\((--[\w-]+)/g)) {
                expect(theme).toContain(`${name}:`);
            }
        }
    });

    it('tone_colouring_uses_only_the_tone_pair_the_theme_gives_by_data_tone', () => {
        const expected: Record<string, string> = {
            ok: 'status-ok',
            info: 'status-info',
            warn: 'status-warning',
            danger: 'status-danger',
            muted: 'status-muted',
        };
        for (const [tone, status] of Object.entries(expected)) {
            const rule = theme.match(new RegExp(`\\[data-tone="${tone}"\\]\\s*\\{([^}]*)\\}`))![1];
            expect(rule).toContain(`--tone: var(--${status});`);
            expect(rule).toContain(`--tone-soft: var(--${status}-soft);`);
        }
        document.body.append(document.createElement('r-status-grid'), document.createElement('r-status-mark'));
        for (const css of installedStyles()) {
            expect(css).not.toMatch(/--status-/);
        }
    });
});
