# Step

One step of a multi-step flow, such as a wizard. It holds its own form, checks it with the browser's native validation, and says when it is done. The page wires the steps together: it shows one at a time and moves on when a step is done.

## Screenshots

<!-- screenshots: r-step -->
<!-- /screenshots -->

## Usage

```html
<r-step class="customer">
    <form>
        <input name="email" type="email" required>
        <button>Next</button>
    </form>
</r-step>
<r-step class="review" hidden>…</r-step>
```

```typescript
import type { Step } from '@relax.js/components';

const customer = document.querySelector<Step>('r-step.customer')!;
customer.addEventListener('r-step-done', (event) => {
    saveCustomer(event.values);
    customer.hidden = true;
    document.querySelector<Step>('r-step.review')!.hidden = false;
});

// Going back: the form opens with what the user entered before.
customer.value = { email: 'ada@example.com' };
```

Submitting an invalid form dispatches nothing and shows the browser's validation messages.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Record<string, string>` | The values the form starts from, by field name. An input the values have no field for keeps what the markup gives it. |

## Events

### r-step-done

Dispatched as `StepDoneEvent` when the step's form is submitted valid. Bubbles.

| Property | Type | Description |
|----------|------|-------------|
| `values` | `Record<string, string>` | The form's values by field name; file fields are left out |

## Parts

The step renders nothing of its own: its form is the page's markup, styled with the page's CSS.
