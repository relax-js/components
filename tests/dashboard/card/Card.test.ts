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

    it('a_missing_heading_logs_and_leaves_out_the_heading_row_while_the_body_stays', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const card = cardWith('<r-card heading=""><p id="body">x</p></r-card>');
        expect(error).toHaveBeenCalledWith('r-card: heading is missing');
        expect(card.querySelector('.card-head')).toBeNull();
        expect(card.querySelector('#body')).not.toBeNull();
    });

    it('an_empty_lead_icon_and_link_text_leave_those_parts_out', () => {
        const card = cardWith('<r-card heading="H" lead="" icon="" link-text=""></r-card>');
        expect(card.querySelector('p')).toBeNull();
        expect(card.querySelector('r-icon')).toBeNull();
        expect(card.querySelector('a')).toBeNull();
    });

    it('a_link_text_without_href_logs_an_error_naming_r_card_and_leaves_the_link_out', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const card = cardWith('<r-card heading="H" link-text="All"></r-card>');
        expect(error.mock.calls[0][0]).toContain('r-card');
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

    it('an_unknown_tone_logs_an_error_and_leaves_no_data_tone', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const card = cardWith('<r-card heading="H" tone="loud"></r-card>');
        expect(error).toHaveBeenCalled();
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
