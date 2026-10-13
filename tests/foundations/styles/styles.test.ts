import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { captureProblems } from '../../captureProblems';
import '../../../src/dashboard/days-left/DaysLeft';
import '../../../src/dashboard/status-mark/StatusMark';
import { readTheme } from '../../theme';

const statusOf: Record<string, string> = {
    ok: 'status-ok',
    info: 'status-info',
    warn: 'status-warning',
    danger: 'status-danger',
    muted: 'status-muted',
};

function shadowRootWith(tag: string): ShadowRoot {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const element = document.createElement(tag);
    element.setAttribute('tone', 'warn');
    element.setAttribute('days', '3');
    element.textContent = 'Late';
    root.append(element);
    return root;
}

function toneRulesIn(root: Document | ShadowRoot): string {
    const container = root instanceof ShadowRoot ? root : root.head;
    return container.querySelector('style[data-r-styles="r-tones"]')?.textContent ?? '';
}

describe('installing component styles', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('tone_colours_reach_a_component_inside_a_shadow_root_where_page_rules_do_not', () => {
        const root = shadowRootWith('r-status-mark');

        expect(toneRulesIn(root)).toContain('[data-tone="warn"]');
    });

    it('tone_colours_reach_days_left_which_has_no_stylesheet_of_its_own', () => {
        const root = shadowRootWith('r-days-left');

        expect(toneRulesIn(root)).toContain('[data-tone="danger"]');
    });

    it('tone_rules_are_installed_once_per_root', () => {
        const root = shadowRootWith('r-status-mark');
        root.append(document.createElement('r-days-left'), document.createElement('r-status-mark'));

        expect(root.querySelectorAll('style[data-r-styles="r-tones"]').length).toBe(1);
    });

    it('every_element_styles_itself_only_with_variables_something_defines', async () => {
        await import('../../../src/index');
        captureProblems();
        const modules = Array.from(readFileSync('src/index.ts', 'utf8').matchAll(/from '\.\/(.+)'/g), ([, path]) => path);
        const tags = modules.flatMap((path) =>
            Array.from(readFileSync(`src/${path}.ts`, 'utf8').matchAll(/customElements\.define\('(r-[a-z-]+)'/g), ([, tag]) => tag),
        );
        // The file input has no stylesheet of its own, and jsdom lacks the form internals it needs to connect.
        for (const tag of tags.filter((name) => name !== 'r-file-input')) {
            document.body.append(document.createElement(tag));
        }
        const css = [
            ...Array.from(document.querySelectorAll('style')).map((style) => style.textContent ?? ''),
            ...Array.from(document.body.children).flatMap((element) =>
                Array.from(element.shadowRoot?.querySelectorAll('style') ?? []).map((style) => style.textContent ?? ''),
            ),
        ].join('\n');
        // Set inline by the component that draws them, and given by the tone rules.
        const setByComponents = ['--tone', '--tone-soft', '--fill', '--mark', '--columns', '--position'];
        const theme = readTheme();
        // A fallback keeps a component's own variable optional; a theme variable never needs one.
        const ownVariable = /var\((--[\w-]+)\s*,/g;
        const undefinedNames = [
            ...Array.from(css.matchAll(/var\((--[\w-]+)\s*\)/g), ([, name]) => name),
            ...Array.from(css.matchAll(ownVariable), ([, name]) => name).filter((name) => !tags.some((tag) => name.startsWith(`--${tag.slice(2)}-`))),
        ].filter(
            (name) => !theme.includes(`${name}:`) && !css.includes(`${name}:`) && !setByComponents.includes(name),
        );

        expect(tags.length).toBeGreaterThan(20);
        expect(Array.from(new Set(undefinedNames))).toEqual([]);
    });

    it('installed_tone_rules_give_the_same_pair_as_the_theme', () => {
        const root = shadowRootWith('r-status-mark');
        const installed = toneRulesIn(root);
        const theme = readTheme();
        for (const [tone, status] of Object.entries(statusOf)) {
            const pattern = new RegExp(`\\[data-tone="${tone}"\\]\\s*\\{([^}]*)\\}`);
            for (const css of [installed, theme]) {
                const rule = css.match(pattern)![1];
                expect(rule).toContain(`--tone: var(--${status});`);
                expect(rule).toContain(`--tone-soft: var(--${status}-soft);`);
            }
        }
    });
});
