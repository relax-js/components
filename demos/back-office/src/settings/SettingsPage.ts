import { get, put } from '@relax.js/core/http';
import type { Routable } from '@relax.js/core/routing';
import type { SettingRow } from '@relax.js/components';

interface Setting {
    key: string;
    name: string;
    /** The form field, named `value`. */
    field: string;
    /** The state line the row shows for a value. */
    describe: (value: string) => string;
}

const sections: Record<string, Setting[]> = {
    company: [
        { key: 'companyName', name: 'Company name', field: '<input name="value" required maxlength="80">', describe: (v) => v },
        { key: 'orgNumber', name: 'Organisation number', field: '<input name="value" required pattern="\\d{6}-\\d{4}" title="Six digits, a dash and four digits">', describe: (v) => v },
        { key: 'invoiceDays', name: 'Payment terms', field: '<input name="value" type="number" min="0" max="90" required>', describe: (v) => `${v} days net` },
    ],
    notifications: [
        { key: 'notifyEmail', name: 'Order notifications', field: '<input name="value" type="email" required>', describe: (v) => `Sent to ${v}` },
        { key: 'lowStockLevel', name: 'Low stock warning', field: '<input name="value" type="number" min="0" required>', describe: (v) => `Below ${v} in stock` },
    ],
};

/** Company and notification settings, each changed in its own small form. */
class SettingsPage extends HTMLElement implements Routable<{ section: string }> {
    routeData?: { section: string };

    connectedCallback(): void {
        const section = this.routeData?.section ?? 'company';
        this.innerHTML = /* html */ `
            <h2 class="page-heading">Settings</h2>
            <r-section-nav label="Settings">
                <a href="/settings/company">Company</a>
                <a href="/settings/notifications">Notifications</a>
            </r-section-nav>
            <div class="setting-list"></div>
        `;
        void this.load(sections[section] ?? sections.company);
    }

    private async load(settings: Setting[]): Promise<void> {
        const response = await get('/api/settings');
        if (!response.success) {
            throw new Error(`Loading settings failed with ${response.statusCode}`);
        }
        const values = response.as<Record<string, string>>();
        const list = this.querySelector('.setting-list')!;
        list.replaceChildren(...settings.map((setting) => this.row(setting, values[setting.key])));
    }

    private row(setting: Setting, value: string): SettingRow {
        const row = document.createElement('r-setting-row');
        row.setAttribute('name', setting.name);
        row.setAttribute('state', setting.describe(value));
        row.innerHTML = `<template><form class="form">${setting.field}<div class="form-actions"><button class="primary">Save</button></div></form></template>`;
        row.value = { value };
        row.save = async (values, signal) => {
            const saved = await put(`/api/settings/${setting.key}`, JSON.stringify({ value: values.value }), { signal });
            if (!saved.success) {
                throw new Error(`Saving ${setting.name} failed with ${saved.statusCode}`);
            }
            return setting.describe(values.value);
        };
        return row;
    }
}

customElements.define('settings-page', SettingsPage);
