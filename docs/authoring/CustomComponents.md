# Custom Components

## Creating Custom Components

Use the `r-` prefix for custom components:

```typescript
class MyCustomList extends HTMLElement {
    static formAssociated = true;

    connectedCallback() {
        // Setup
    }

    get value() { return this._value; }
    set value(v) { this._value = v; }

    getData() { return this._data; }
    setData(data) { this._data = data; }
}

customElements.define('r-custom-list', MyCustomList);
```

## Tones

A component that shows a tone reads it with the shared helpers rather than parsing the attribute itself:

```typescript
type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'muted';
function readTone(el: Element, fallback: Tone): Tone;
const toneIcon: Record<Tone, string>;
```

`readTone` reads the `tone` attribute and returns the fallback when it is missing. An unknown value reports an error and returns the fallback too. `toneIcon` names each tone's default [icon](../manual/Icon.md). What the tones mean is in [Design Language](DesignLanguage.md#tones).

## Form Components

For form components, see [Creating Form Components](https://github.com/relax-js/core/blob/main/lib/forms/creating-form-components.md).
