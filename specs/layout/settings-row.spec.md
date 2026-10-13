---
feature: Settings row
status: verified
authored: planned
---

# Settings row

## Goal
A user scans a list of settings, each with its current state, and changes one in a dialog without leaving the page, seeing the row update once the change is saved. The page supplies the form and the save, and the row handles opening the form, saving it and showing the outcome, so every setting in an app is changed the same way.

## Seeing a setting
- **Name and state**: the row shows the setting's name and the text describing its current state, given as attributes, and changing either attribute updates the row (docs/authoring/ComponentContract.md#Data In, Events Out)
  - **Missing name**: a row without a name reports an error naming its tag and renders empty (docs/authoring/ComponentContract.md#Failing Loudly)
- **Change button**: the row has a button that opens the setting's form, and its accessible name is one `r-components` message with the setting's name as a placeholder, such as "Change Email notifications" (docs/authoring/TextAndValues.md#Messages with Values)
  - **No form**: a row without a form template reports an error naming its tag and shows its name and state without the button
- **Rows in a list**: rows are dense items, separated from each other by a `1px` `--bd-muted` line (docs/authoring/DesignLanguage.md#Component Tiers)
  - **Row stays still**: hovering the row outside its button changes nothing, and only the button responds (docs/authoring/DesignLanguage.md#Hover)

## Changing a setting
- **Form in a dialog**: the button opens a Dialog titled with the setting's name, holding a fresh copy of the form template inside the row (specs/layout/dialog.spec.md#Opening and closing a dialog)
- **Form filled**: the form opens with each field of the row's `value` property in the input of the same name (docs/authoring/ComponentContract.md#Data In, Events Out)
  - **Input without a value**: an input the value has no field for keeps what the template gives it
- **Save function**: submitting the form calls the page's save function with the form's values and an abort signal (docs/authoring/ComponentContract.md#Data In, Events Out)
  - **Invalid form**: a form that fails the browser's validation calls nothing and shows the validation messages (docs/authoring/DesignLanguage.md#Native First)
  - **No save function**: submitting when the page has set no save function reports an error naming the tag and keeps the dialog open
- **Saved**: when the save function resolves with the new state text, the dialog closes, the row shows that text, and `value` holds the saved values
  - **Closed without saving**: closing the dialog by its close button or Escape calls nothing, fires nothing and leaves the row as it was
- **Saved event**: after a save the row fires `r-setting-saved`, a typed event carrying the new state text and the saved values (docs/authoring/ComponentContract.md#Naming)

## Saving takes time or fails
- **Saving**: while the save function runs, the dialog is marked `aria-busy` and the form cannot be submitted again (docs/authoring/DesignLanguage.md#Accessibility)
  - **Closed while saving**: closing the dialog during a save aborts the save's signal, and its outcome changes nothing and fires nothing
- **Save fails**: when the save function rejects, the dialog stays open with the user's entries kept and shows a failure message from the `r-components` namespace (docs/authoring/ComponentContract.md#Text and Numbers)
