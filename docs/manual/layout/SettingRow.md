# Setting Row

One setting in a list: its name, the text describing its current state, and a button that opens the setting's form in a dialog. A settings page is a list of these.

## Screenshots

<!-- screenshots: r-setting-row -->
<!-- /screenshots -->

## Usage

```html
<r-setting-row id="language" name="Language" state="English">
    <template>
        <form>
            <select name="language">
                <option value="en">English</option>
                <option value="sv">Svenska</option>
            </select>
            <button>Save</button>
        </form>
    </template>
</r-setting-row>
```

```typescript
import type { SettingRow } from '@relax.js/components';

const row = document.querySelector<SettingRow>('#language')!;
row.value = { language: 'en' };
row.save = async (values, signal) => {
    await fetch('/api/settings/language', { method: 'PUT', body: JSON.stringify(values), signal });
    return values.language === 'sv' ? 'Svenska' : 'English';
};
row.addEventListener('r-setting-saved', (event) => console.log(event.state, event.values));
```

- The button opens a dialog titled with the setting's name, holding a fresh copy of the form template, filled from `value`.
- Submitting a valid form calls `save` with the form's values and an abort signal. When it resolves with the new state text, the dialog closes, the row shows that text, `value` holds the saved values and `r-setting-saved` is dispatched.
- While `save` runs the dialog carries `aria-busy` and the form cannot be submitted again. Closing the dialog during a save aborts the signal, and its outcome changes nothing.
- When `save` rejects, the dialog stays open with the user's entries kept, shows the `saveFailed` text, and the error is reported.
- Closing the dialog without saving calls nothing and dispatches nothing.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | `string` | The setting's name. A row without one reports an error and renders empty. |
| `state` | `string` | Text describing the current state |

A row without a form template reports an error and shows its name and state without the button.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Record<string, string>` | The setting's current values by field name; the form opens filled with them |
| `save` | `(values: Record<string, string>, signal: AbortSignal) => Promise<string>` | Saves the values and resolves with the new state text. Submitting without one reports an error and keeps the dialog open. |

## Events

### r-setting-saved

Dispatched as `SettingSavedEvent` after a change was saved. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `state` | `string` | The new state text |
| `values` | `Record<string, string>` | The saved values by field name |

## Parts

| Selector | What it is |
|----------|------------|
| `.setting-name`, `.setting-state` | The name and the state text, inside `.setting-text` |
| `r-setting-row > button` | The change button, worded with the `change` text and named "Change {name}" from the [`r-components` namespace](../Formatting.md#words) |
| `.setting-dialog` | The dialog holding the form |
| `.setting-failure` | The failure message after a save failed |

## Variables

Rows are dense items: `--item-padding`, with a `1px` `--bd-muted` line between rows. Only the button responds to the pointer. See [Theming](../../authoring/Theming.md#variables).
