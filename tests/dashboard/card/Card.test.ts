import { captureProblems } from '../../captureProblems';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/dashboard/card/Card';
import type { Card } from '../../../src/dashboard/card/Card';

function cardWith(html: string): Card {
    document.body.innerHTML = html;
    return document.querySelector('r-card')!;
}

const full =
    '<r-card heading="Invoices" lead="Three are late." icon="file" link-text="All" href="/invoices">' +
    '<select slot="action"></select><ul id="body"><li slot="action" id="deep"></li></ul></r-card>';

describe('r-card', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('the_card_takes_its_tier_variables_and_casts_no_shadow_nor_hover_background', () => {
        cardWith(full);
        const css = document.head.querySelector('style[data-r-styles="r-card"]')!.textContent!;
        expect(css).toContain('var(--card-radius)');
        expect(css).toContain('var(--card-padding)');
        expect(css).toContain('var(--card-gap)');
        expect(css).toContain('var(--card-border)');
        expect(css).toContain('box-shadow: none');
        expect(css).not.toContain(':hover');
    });

    it('the_heading_row_comes_first_with_icon_hgroup_action_and_link_in_order', () => {
        const card = cardWith(full);
        const head = card.firstElementChild!;
        expect(head.className).toBe('card-head');
        expect([...head.children].map((c) => c.localName)).toEqual(['r-icon', 'hgroup', 'select', 'a']);
        expect(card.querySelector('#body')).not.toBeNull();
        expect(card.children[1]).toBe(card.querySelector('#body'));
    });

    it('heading_lead_and_link_text_are_shown_as_text_and_every_icon_is_an_r_icon', () => {
        const card = cardWith(
            '<r-card heading="<b>x</b>" lead="<i>y</i>" icon="file" link-text="<u>z</u>" href="/a"></r-card>',
        );
        const head = card.querySelector('.card-head')!;
        expect(head.querySelector('h2')!.textContent).toBe('<b>x</b>');
        expect(head.querySelector('hgroup p')!.textContent).toBe('<i>y</i>');
        expect(head.querySelector('a')!.textContent).toBe('<u>z</u>');
        expect(head.querySelector('b, i, u')).toBeNull();
        expect(head.querySelector('r-icon[name="file"]')).not.toBeNull();
        expect(head.querySelector('a r-icon[name="arrow-right"]')).not.toBeNull();
    });

    it('a_missing_heading_reports_and_leaves_out_the_heading_row_while_the_body_stays', () => {
        const reported = captureProblems();
        const card = cardWith('<r-card heading=""><p id="body">x</p></r-card>');
        expect(reported.messages()).toContainEqual('r-card: heading is missing');
        expect(card.querySelector('.card-head')).toBeNull();
        expect(card.querySelector('#body')).not.toBeNull();
    });

    it('an_empty_lead_icon_and_link_text_leave_those_parts_out', () => {
        const card = cardWith('<r-card heading="H" lead="" icon="" link-text=""></r-card>');
        expect(card.querySelector('p')).toBeNull();
        expect(card.querySelector('r-icon')).toBeNull();
        expect(card.querySelector('a')).toBeNull();
    });

    it('a_link_text_without_href_reports_an_error_naming_r_card_and_leaves_the_link_out', () => {
        const reported = captureProblems();
        const card = cardWith('<r-card heading="H" link-text="All"></r-card>');
        expect(reported.messages()[0]).toContain('r-card');
        expect(card.querySelector('a')).toBeNull();
    });

    it('only_a_direct_child_action_moves_into_the_heading_row', () => {
        const card = cardWith(full);
        expect(card.querySelector('.card-head > select')).not.toBeNull();
        expect(card.querySelector('.card-head #deep')).toBeNull();
        expect(card.querySelector('#body > #deep')).not.toBeNull();
    });

    it('moving_the_card_keeps_one_heading_row_and_its_one_action', () => {
        const card = cardWith(full);
        const other = document.createElement('div');
        document.body.append(other);
        other.append(card);
        expect(card.querySelectorAll('.card-head').length).toBe(1);
        expect(card.querySelectorAll('select').length).toBe(1);
        expect(card.querySelectorAll('.card-head > select').length).toBe(1);
    });

    it('the_tone_is_reflected_as_data_tone', () => {
        const card = cardWith('<r-card heading="H" tone="warn"></r-card>');
        expect(card.dataset.tone).toBe('warn');
    });

    it('a_card_without_tone_has_no_data_tone', () => {
        const card = cardWith('<r-card heading="H"></r-card>');
        expect(card.hasAttribute('data-tone')).toBe(false);
        expect(card.querySelector('r-icon')).toBeNull();
    });

    it('an_unknown_tone_reports_an_error_and_leaves_no_data_tone', () => {
        const reported = captureProblems();
        const card = cardWith('<r-card heading="H" tone="loud"></r-card>');
        expect(reported.messages()).not.toEqual([]);
        expect(card.hasAttribute('data-tone')).toBe(false);
        expect(card.querySelector('r-icon')).toBeNull();
    });

    it('a_tone_without_icon_shows_the_tone_icon_in_the_heading_row', () => {
        const card = cardWith('<r-card heading="H" tone="danger"></r-card>');
        expect(card.querySelector('.card-head > r-icon')!.getAttribute('name')).toBe('x-circle');
    });

    it('an_own_icon_wins_over_the_tone_icon', () => {
        const card = cardWith('<r-card heading="H" tone="danger" icon="file"></r-card>');
        const icons = card.querySelectorAll('.card-head r-icon');
        expect(icons.length).toBe(1);
        expect(icons[0].getAttribute('name')).toBe('file');
    });

    it('every_direct_child_action_moves_into_the_heading_row_in_order', () => {
        const card = cardWith(
            '<r-card heading="H"><r-badge slot="action" id="count">3</r-badge><button slot="action" id="add"></button><p></p></r-card>',
        );
        const head = card.querySelector('.card-head')!;
        expect([...head.children].map((c) => c.id).slice(-2)).toEqual(['count', 'add']);
    });

    it('a_heading_slot_child_becomes_the_heading_so_it_can_hold_markup', () => {
        const card = cardWith('<r-card><span slot="heading" id="rich">Invoices <r-badge>3</r-badge></span><p id="body"></p></r-card>');
        const title = card.querySelector('.card-head hgroup > h2')!;
        expect(title.firstElementChild).toBe(card.querySelector('#rich'));
        expect(card.children[1]).toBe(card.querySelector('#body'));
    });

    it('a_heading_slot_wins_over_the_heading_attribute_and_needs_no_attribute', () => {
        const reported = captureProblems();
        const card = cardWith('<r-card heading="Plain"><span slot="heading">Rich</span></r-card>');
        expect(card.querySelector('h2')!.textContent).toBe('Rich');

        card.removeAttribute('heading');
        expect(card.querySelector('h2')!.textContent).toBe('Rich');
        expect(reported.messages()).toEqual([]);
    });

    it('moving_the_card_keeps_its_one_heading_slot', () => {
        const card = cardWith('<r-card><span slot="heading">Rich</span></r-card>');
        const other = document.createElement('div');
        document.body.append(other);
        other.append(card);
        expect(card.querySelectorAll('[slot="heading"]').length).toBe(1);
        expect(card.querySelector('h2 > [slot="heading"]')).not.toBeNull();
    });

    it('level_sets_the_heading_element_so_the_page_outline_stays_intact', () => {
        const card = cardWith('<r-card heading="H" level="3"></r-card>');
        expect(card.querySelector('hgroup > h3')!.textContent).toBe('H');
        expect(card.querySelector('h2')).toBeNull();

        card.setAttribute('level', '4');
        expect(card.querySelector('hgroup > h4')).not.toBeNull();
    });

    it('a_level_outside_1_to_6_reports_and_falls_back_to_h2', () => {
        const reported = captureProblems();
        const card = cardWith('<r-card heading="H" level="7"></r-card>');
        expect(reported.messages()).toContainEqual('r-card: level "7" must be a whole number from 1 to 6');
        expect(card.querySelector('hgroup > h2')).not.toBeNull();
    });

    it('the_heading_size_comes_from_a_card_tier_variable_whatever_the_level', () => {
        cardWith('<r-card heading="H" level="4"></r-card>');
        const css = document.head.querySelector('style[data-r-styles="r-card"]')!.textContent!;
        expect(css).toContain('font-size: var(--card-heading-size)');
    });

    it('changing_attributes_updates_the_heading_row_without_building_a_second_one', () => {
        const card = cardWith(full);
        card.setAttribute('heading', 'Bills');
        card.setAttribute('lead', 'Two.');
        card.setAttribute('icon', 'info');
        card.setAttribute('link-text', 'More');
        card.setAttribute('href', '/bills');
        card.setAttribute('tone', 'warn');
        expect(card.querySelectorAll('.card-head').length).toBe(1);
        expect(card.querySelector('h2')!.textContent).toBe('Bills');
        expect(card.querySelector('p')!.textContent).toBe('Two.');
        expect(card.querySelector('r-icon')!.getAttribute('name')).toBe('info');
        expect(card.querySelector('a')!.textContent).toBe('More');
        expect(card.querySelector('a')!.getAttribute('href')).toBe('/bills');
        expect(card.querySelectorAll('select').length).toBe(1);
    });
});
