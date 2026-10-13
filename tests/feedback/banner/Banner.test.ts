import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../src/feedback/banner/Banner';
import type { Banner } from '../../../src/feedback/banner/Banner';

function bannerWith(html: string): Banner {
    document.body.innerHTML = html;
    return document.querySelector('r-banner')!;
}

describe('r-banner', () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it('the_message_children_stay_as_the_page_wrote_them_including_markup', () => {
        const banner = bannerWith('<r-banner tone="info">See <a id="l" href="/x">status</a> now</r-banner>');
        const link = banner.querySelector('#l')!;
        expect(link.parentElement).toBe(banner);
        expect(banner.textContent).toBe('See status now');
    });

    it('moving_the_banner_never_adds_a_second_icon', () => {
        const banner = bannerWith('<div id="a"><r-banner tone="ok">Hi</r-banner></div><div id="b"></div>');
        document.getElementById('b')!.append(banner);
        expect(banner.querySelectorAll('r-icon').length).toBe(1);
    });

    it('the_banner_takes_panel_variables_tone_colours_and_casts_no_shadow', () => {
        bannerWith('<r-banner></r-banner>');
        const css = document.head.querySelector('style[data-r-styles="r-banner"]')!.textContent!;
        expect(css).toContain('var(--panel-padding)');
        expect(css).toContain('var(--tone-soft)');
        expect(css).toContain('var(--tone)');
        expect(css).toContain('box-shadow: none');
    });

    it('the_banner_carries_its_tone_and_shows_the_tone_icon_first', () => {
        const banner = bannerWith('<r-banner tone="danger">Down</r-banner>');
        expect(banner.dataset.tone).toBe('danger');
        expect(banner.firstElementChild!.localName).toBe('r-icon');
        expect(banner.firstElementChild!.getAttribute('name')).toBe('x-circle');
    });

    it('changing_tone_updates_data_tone_icon_and_role_in_place', () => {
        const banner = bannerWith('<r-banner tone="ok">Fine</r-banner>');
        banner.setAttribute('tone', 'warn');
        expect(banner.dataset.tone).toBe('warn');
        expect(banner.querySelectorAll('r-icon').length).toBe(1);
        expect(banner.querySelector('r-icon')!.getAttribute('name')).toBe('minus-circle');
        expect(banner.getAttribute('role')).toBe('alert');
    });

    it('a_banner_without_tone_is_muted', () => {
        const banner = bannerWith('<r-banner>Hi</r-banner>');
        expect(banner.dataset.tone).toBe('muted');
    });

    it('an_unknown_tone_logs_an_error_and_is_muted', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const banner = bannerWith('<r-banner tone="loud">Hi</r-banner>');
        expect(error).toHaveBeenCalled();
        expect(banner.dataset.tone).toBe('muted');
    });

    it('a_direct_action_child_moves_to_the_end_while_a_deeper_one_stays', () => {
        const banner = bannerWith(
            '<r-banner><a slot="action" id="act" href="/">Go</a><p id="p"><b slot="action" id="deep"></b></p>Text</r-banner>',
        );
        expect(banner.lastElementChild!.id).toBe('act');
        expect(banner.querySelector('#deep')!.parentElement!.id).toBe('p');
    });

    it('only_a_dismissible_banner_shows_a_close_button_named_from_the_namespace', () => {
        expect(bannerWith('<r-banner>Hi</r-banner>').querySelector('button')).toBeNull();
        const banner = bannerWith('<r-banner dismissible>Hi</r-banner>');
        expect(banner.querySelector('button')!.getAttribute('aria-label')).toBe('Close');
    });

    it('activating_close_hides_the_banner_and_fires_r_banner_dismiss', () => {
        const banner = bannerWith('<r-banner dismissible>Hi</r-banner>');
        const heard = vi.fn();
        banner.addEventListener('r-banner-dismiss', heard);
        banner.querySelector('button')!.click();
        expect(banner.hidden).toBe(true);
        expect(heard).toHaveBeenCalledTimes(1);
    });

    it('a_dismissal_is_not_remembered_so_a_new_page_load_shows_the_banner_again', () => {
        bannerWith('<r-banner dismissible>Hi</r-banner>').querySelector('button')!.click();
        const again = bannerWith('<r-banner dismissible>Hi</r-banner>');
        expect(again.hidden).toBe(false);
    });

    it('warn_and_danger_are_alerts_and_other_tones_are_status', () => {
        for (const [tone, role] of [
            ['warn', 'alert'],
            ['danger', 'alert'],
            ['ok', 'status'],
            ['info', 'status'],
            ['muted', 'status'],
        ]) {
            const banner = bannerWith(`<r-banner tone="${tone}">x</r-banner>`);
            expect(banner.getAttribute('role')).toBe(role);
        }
    });
});
