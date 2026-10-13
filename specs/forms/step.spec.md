---
feature: Step
status: verified
---

# Step

## Goal
A developer builds a multi-step flow, such as onboarding, out of steps that each hold one self-contained form and say when they are done, so the flow only decides what comes next.

## Completing a step
- **Own form**: the step holds its own form and checks it with the browser's native validation (docs/authoring/DesignLanguage.md#Native First)
- **Done event**: submitting a valid form fires an event saying the step is done, carrying the form's values
  - **Invalid form**: submitting an invalid form fires nothing and shows the validation messages
- **Prefilled values**: the page can give the step values to start from, such as when the user goes back to it

## Open questions
- **The flow itself**: whether the library also provides the flow around the steps, with progress and going back, or the page wires the steps together.
