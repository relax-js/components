import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flush, mount } from '@relax.js/core/testing';
import { Icon, registerIcons } from '../../../src/foundations/icon/Icon';

function iconNamed(name: string): Icon {
    const icon = document.createElement('r-icon');
    icon.setAttribute('name', name);
    return icon;
}

describe('r-icon', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('draws_the_named_shape_as_stroked_svg_on_a_24_unit_grid', () => {
        const { element } = mount(iconNamed('check'));

        const svg = element.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svg.getAttribute('stroke')).toBe('currentColor');
        expect(svg.getAttribute('fill')).toBe('none');
        expect(svg.innerHTML).toContain('polyline');
    });

    it('is_hidden_from_assistive_technology', () => {
        const { element } = mount(iconNamed('check'));

        expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    it('changing_the_name_on_a_connected_icon_draws_the_new_shape', () => {
        const { element } = mount(iconNamed('check'));
        element.setAttribute('name', 'lock');

        expect(element.querySelector('rect')).not.toBeNull();
    });

    it('a_name_changed_while_disconnected_is_drawn_on_connect', () => {
        const icon = iconNamed('check');
        icon.setAttribute('name', 'lock');
        expect(icon.querySelector('svg')).toBeNull();

        mount(icon);

        expect(icon.querySelector('rect')).not.toBeNull();
    });

    it('an_unbound_template_placeholder_never_draws_or_reports', () => {
        const reported = captureProblems();
        const { element } = mount(iconNamed('{{icon}}'));

        expect(element.childElementCount).toBe(0);
        expect(reported.messages()).toEqual([]);
    });

    it('an_unknown_name_reports_an_error_and_draws_nothing', () => {
        const reported = captureProblems();
        const { element } = mount(iconNamed('no-such-icon'));

        expect(element.childElementCount).toBe(0);
        expect(reported.messages()).toContainEqual('r-icon: no icon is registered as "no-such-icon"');
    });

    it('the_icon_is_one_em_square_in_the_text_colour_with_round_thin_strokes', () => {
        const { element } = mount(iconNamed('check'));

        const svg = element.querySelector('svg')!;
        expect(svg.getAttribute('width')).toBe('1em');
        expect(svg.getAttribute('height')).toBe('1em');
        expect(svg.getAttribute('stroke-width')).toBe('1.75');
        expect(svg.getAttribute('stroke-linecap')).toBe('round');
        expect(svg.getAttribute('stroke-linejoin')).toBe('round');
    });

    it('moving_the_icon_never_adds_a_second_shape', () => {
        const { element } = mount(iconNamed('check'));
        const other = document.createElement('div');
        document.body.append(other);

        other.append(element);

        expect(element.querySelectorAll('svg').length).toBe(1);
    });

    it('changing_a_drawn_icon_to_an_unknown_name_removes_its_shape', () => {
        captureProblems();
        const { element } = mount(iconNamed('check'));

        element.setAttribute('name', 'no-such-icon');

        expect(element.childElementCount).toBe(0);
    });

    it('a_missing_or_empty_name_reports_an_error_and_draws_nothing', () => {
        const reported = captureProblems();
        const missing = mount(document.createElement('r-icon')).element;
        const empty = mount(iconNamed('')).element;

        expect(missing.childElementCount).toBe(0);
        expect(empty.childElementCount).toBe(0);
        expect(reported.messages()).toHaveLength(2);
        expect(reported.messages()[0]).toMatch(/^r-icon:/);
    });

    it('registering_an_existing_name_replaces_its_shape', () => {
        registerIcons({ swap: '<circle cx="1" cy="1" r="1"/>' });
        registerIcons({ swap: '<rect x="1" y="1" width="2" height="2"/>' });
        const { element } = mount(iconNamed('swap'));

        expect(element.querySelector('circle')).toBeNull();
        expect(element.querySelector('rect')).not.toBeNull();
    });

    it('registering_a_name_redraws_connected_icons_that_showed_no_shape_or_the_replaced_one', () => {
        captureProblems();
        const empty = mount(iconNamed('late')).element;
        registerIcons({ again: '<circle cx="1" cy="1" r="1"/>' });
        const replaced = mount(iconNamed('again')).element;

        registerIcons({ late: '<rect x="1" y="1" width="2" height="2"/>' });
        registerIcons({ again: '<line x1="0" y1="0" x2="1" y2="1"/>' });

        expect(empty.querySelector('rect')).not.toBeNull();
        expect(replaced.querySelector('circle')).toBeNull();
        expect(replaced.querySelector('line')).not.toBeNull();
    });

    it('the_default_set_and_tone_icons_draw_without_registering', () => {
        for (const name of ['check-circle', 'clock', 'minus-circle', 'x-circle', 'info', 'check', 'lock']) {
            const { element } = mount(iconNamed(name));
            expect(element.querySelector('svg')).not.toBeNull();
        }
    });

    it('registered_shapes_are_drawn_by_name', async () => {
        registerIcons({ dot: '<circle cx="12" cy="12" r="2"/>' });
        const { element } = mount(iconNamed('dot'));
        await flush();

        expect(element.querySelector('circle')).not.toBeNull();
    });
});
