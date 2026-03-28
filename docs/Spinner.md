# Spinner

A loader overlay component that dims wrapped content and displays a centered spinner.

## Usage

### Basic Loading Overlay

```html
<r-spinner loading>
    <div>Content is dimmed while loading</div>
</r-spinner>
```

Toggle the `loading` attribute to show/hide the overlay:

```typescript
const spinner = document.querySelector('r-spinner');

// Show overlay
spinner.loading = true;

// Hide overlay
spinner.loading = false;
```

### Custom Spinner Image

Replace the default CSS ring with your own spinner using the `spinner` slot:

```html
<r-spinner loading>
    <img slot="spinner" src="spinner.gif" alt="" />
    <div>Content</div>
</r-spinner>
```

The default spinner is automatically hidden when a custom spinner is slotted in.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--loader-overlay-color` | `rgba(0, 0, 0, 0.5)` | Overlay background color |
| `--loader-spinner-size` | `48px` | Spinner width and height |
| `--loader-spinner-color` | `#3b82f6` | Spinner ring color |
| `--loader-spinner-width` | `4px` | Spinner ring thickness |
| `--loader-spin-duration` | `800ms` | Rotation animation speed |
| `--loader-transition-duration` | `300ms` | Fade in/out duration |

### Theming Example

```css
r-spinner {
    --loader-overlay-color: rgba(255, 255, 255, 0.8);
    --loader-spinner-size: 64px;
    --loader-spinner-color: #e11d48;
    --loader-spinner-width: 6px;
    --loader-spin-duration: 600ms;
    --loader-transition-duration: 200ms;
}
```

## CSS Parts

Style internal elements using `::part()`:

| Part | Description |
|------|-------------|
| `overlay` | The dimming overlay element |
| `spinner-container` | Wrapper around the spinner |
| `default-spinner` | The default CSS ring spinner |

```css
r-spinner::part(overlay) {
    background: rgba(0, 0, 0, 0.7);
}

r-spinner::part(default-spinner) {
    border-top-color: red;
}
```

## Slots

| Slot | Description |
|------|-------------|
| *(default)* | Content to be wrapped by the overlay |
| `spinner` | Optional custom spinner element (replaces default ring) |

## Accessibility

The component sets `aria-busy` on itself based on the loading state, so assistive technologies know when content is loading.

## Complete Example

```html
<style>
    r-spinner {
        --loader-overlay-color: rgba(255, 255, 255, 0.9);
        --loader-spinner-color: var(--accent-primary);
    }
</style>

<r-spinner id="data-loader">
    <table>
        <thead><tr><th>Name</th><th>Email</th></tr></thead>
        <tbody id="user-rows"></tbody>
    </table>
</r-spinner>
```

```typescript
const loader = document.querySelector('#data-loader') as HTMLElement;

async function loadUsers() {
    loader.setAttribute('loading', '');

    try {
        const response = await get('/users');
        const users = response.as<User[]>();
        renderUsers(users);
    } finally {
        loader.removeAttribute('loading');
    }
}
```
