---
feature: Dialog
status: verified
authored: planned
---

# Dialog

## Goal
A developer asks the user for attention, a confirmation or a form, in a modal dialog whose content is created when it opens and gone when it closes, so a page carries no hidden forms. The same dialog serves a page that opens it from code, a quick confirmation that needs no markup, and a route that opens as a dialog, so every modal in an app looks and closes the same way.

## Opening a dialog
- **Native modal**: the dialog opens as a native modal dialog (docs/authoring/DesignLanguage.md#Native First)
- **Content on demand**: the content of the template inside the dialog is copied in when it opens and removed from the page when it closes
  - **Opened twice**: opening a dialog that is already open throws an error naming the component (docs/authoring/ComponentContract.md#Failing Loudly)
  - **Moved while open**: moving an open dialog in the page never copies its content a second time (docs/authoring/ComponentContract.md#Drawing Once)
- **Open state reflected**: an open dialog carries the `open` attribute, and a closed one does not (docs/authoring/ComponentContract.md#State in the DOM)
- **Title and close button**: the dialog shows its `heading` and a close button labelled with the `r-components` close text, and the heading is its accessible name
  - **Missing heading**: a dialog without a `heading` reports an error naming the component and still opens
- **Focus returns**: on open the focus moves into the dialog, and on close it returns to the element that had it
- **Dialog tier look**: the dialog takes its radius, padding, gaps and shadow from the dialog tier's role variables (docs/authoring/DesignLanguage.md#Component Tiers)
- **Inside the window**: the dialog, padding and border included, is never wider or taller than the window less a gap on each side, and content that does not fit scrolls within it
- **Dimmed backdrop**: the page behind an open dialog is dimmed with `--overlay-dim` (docs/authoring/DesignLanguage.md#Dimming)
- **Opening motion**: the dialog fades in with the theme's motion variables, and appears at once when the user prefers reduced motion (docs/authoring/DesignLanguage.md#Motion)

## Closing with a result
- **Result to opener**: opening the dialog from code returns a promise that resolves, when it closes, with the result its content closed it with, or with no value when it was dismissed, and never rejects
- **Content closes with a result**: the content closes the dialog with a result by calling the dialog's close method with that result
- **Form closes with its value**: submitting a form inside the dialog that uses the native dialog method closes it with the submitting button's value as the result
- **Close event**: every close fires `r-dialog-close` carrying the result, or no value when dismissed (docs/authoring/ComponentContract.md#Data In, Events Out)
- **Escape closes**: Escape dismisses the dialog the same way the close button does
- **Backdrop click**: a click outside the dialog leaves it open (docs/manual/PopoverPattern.md#When to Use Popover vs Dialog)
- **Guarding unsaved changes**: a dismissal by Escape or the close button first fires a cancellable `r-dialog-closing`, and the dialog stays open when it is cancelled
  - **Explicit close goes through**: a close with a result from the content never fires `r-dialog-closing` and cannot be stopped

## Asking for confirmation
- **Ready-made confirmation**: a confirmation call given a heading, a message and a tone opens a dialog with that message and confirm and cancel buttons, and resolves true on confirm and false on cancel or dismissal
  - **Message with markup**: the message is shown as text exactly as given, never as markup (docs/authoring/TextAndValues.md#Data Is Shown as Given)
- **Confirmation tone**: the tone is shown by its icon beside the message as well as by colour (docs/authoring/DesignLanguage.md#Tones)
  - **Unknown tone**: a confirmation call with a tone that is not one of the five throws an error naming the component (docs/authoring/ComponentContract.md#Failing Loudly)
- **Confirmation words**: the confirm and cancel buttons say the `r-components` confirm and cancel texts unless the call gives its own (docs/authoring/TextAndValues.md#Words)

## Opening a route in a dialog
- **Route in a dialog**: a route opened into a dialog target shows in this dialog, its content created on navigation and removed on close, and closes by the close button and Escape like any dialog

## Open questions
- **Routed dialog heading**: where a dialog opened by a route takes its heading from.
- **Closing a routed dialog**: whether closing a dialog opened by a route also navigates back to the address it was opened from.
