---
title: I designed a UI library so coding agents get it right the first time
published: false
description: Agents write UI code from habit, not from your docs. So design the library so the wrong habit fails to compile, or tells you exactly what went wrong.
tags: ai, webcomponents, typescript, webdev
series: Business UI with plain Web Components
---

Coding agents write UI code from habit. They put JSON in attributes, read `event.detail`, and when a component renders empty, they guess. I designed `@relax.js/components` so that each of those habits either fails to compile or tells you, in one line, what went wrong.

None of it is specific to agents. A new developer on your team has the same habits and the same need for a clear answer. Agents just make the cost visible, because they repeat a mistake fifty times before lunch.

## The habit: "the agent just needs better docs"

When an agent gets your library wrong, the reflex is to write more docs. Docs matter. Every component in this library has one doc in the same shape, and the docs ship inside the npm package.

But an agent does not read your docs before it writes code. It writes what it has seen most often, and most web components it has seen dispatch a `CustomEvent` with a `detail` and accept lists as JSON attributes. Docs help after it has failed. Design helps before.

So the question is not "how do I explain this better?". It is "what happens the moment someone gets it wrong?".

## Rule 1: every name is literal

Here is a pattern you find in many component libraries:

```ts
const prefix = 'r-';
this.dispatchEvent(new CustomEvent(`${prefix}change`, { detail: { index } }));
```

Search the code for `r-change` and you find nothing. Neither does the agent. The listener and the dispatcher cannot be connected without running the code.

Here is how this library does it instead. Each event is a class with its name spelled out, registered in TypeScript's event map:

```ts
export class MenuSelectedEvent extends Event {
    static readonly type = 'r-menu-selected';

    constructor(public readonly item: MenuItem) {
        super(MenuSelectedEvent.type, { bubbles: true, composed: true });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'r-top-menu': TopMenu;
    }

    interface HTMLElementEventMap {
        [MenuSelectedEvent.type]: MenuSelectedEvent;
    }
}
```

Now one search for `r-menu-selected` finds the event, its class and every listener. And the compiler knows what the listener receives:

```ts
menu.addEventListener('r-menu-selected', (event) => {
    console.log(event.item.name);   // typed
    console.log(event.detail);      // compile error: no 'detail' on MenuSelectedEvent
});
```

The habit fails at compile time, with a message that names the event class. An agent reads the error, opens the class and fixes it in one step.

The same names are listed in `custom-elements.json` in the package: every tag, attribute, property and `r-` event. Tools that read the manifest, and agents, get the full API without parsing a line of source.

## Rule 2: lists go in properties

This is the habit the compiler cannot catch:

```html
<r-table rows='[{"name": "Ann"}, {"name": "Bo"}]'></r-table>
```

The table does not read it, and stays empty. Lists, series and records are properties set from code: `table.rows = records`. Attributes are for scalars: a number, a name, a flag.

Why not just parse the JSON? Because then there are two ways to set the same thing, and they get out of sync. Set the attribute, then the property, and which one wins? Each extra path is one more thing for an agent, and you, to get wrong.

Hence the rule is in the skill that ships with the package (more on that below). It's the one rule that docs have to carry.

## Rule 3: bad input is reported, never thrown or guessed

Give a meter a limit of zero:

```html
<r-meter label="CPU" value="42" max="0"></r-meter>
```

What should happen? There are three options.

**Throw.** But that value usually comes from data or a template binding. Nobody can wrap a template binding in a `try`, so a throw breaks the whole page instead of one meter.

**Guess.** Show the meter full, or empty. That hides the bug. A full meter on a dashboard is a lie someone will act on.

**Report.** The meter renders empty and reports `r-meter: max (0) must be larger than zero` through the app's error channel.

The library always reports. The message starts with the tag and says what is wrong, in words an agent can act on without opening the source. It reaches three places:

- `window.relaxErrors` in the browser. An agent that drives a browser reads it with one `evaluate` call.
- Your app's `onError()` handler, next to the rest of your errors.
- `captureRelaxErrors()` in a test:

```ts
import { captureRelaxErrors } from '@relax.js/core/testing';
import '@relax.js/components';

it('reports_a_meter_without_a_limit', () => {
    const captured = captureRelaxErrors();
    const meter = document.createElement('r-meter');
    meter.setAttribute('label', 'CPU');
    meter.setAttribute('value', '42');
    meter.setAttribute('max', '0');

    document.body.append(meter);

    expect(captured.messages()).toEqual(['r-meter: max (0) must be larger than zero']);
    captured.restore();
});
```

Does it work? While writing the first article in this series, I put a sortable table in a plain HTML file. The console said an error had been reported and nothing was listening. `window.relaxErrors` held the same line three times: `r-icon: the name attribute is missing or empty`. Three sortable columns, three sort arrows put on the page before they got their names. (Yes, in my own table.) It took one glance to know which component and why. No debugger, no guessing.

Do note that this rule is about input. A mistake in code throws: two menu items with the same name, a column without a field. Those are bugs you fix once, and a stack trace is the fastest way to find them. The above is a guideline and not a law: if it can come from data, report it; if it can only come from code, throw.

## Rule 4: nothing hidden

No base class, no reactivity, no store. Each component is a plain custom element with the lifecycle documented on MDN. It redraws when you change its attributes, properties or content, or switch language, and at no other time.

That sounds like a limitation. For an agent it's the opposite. There is no framework model it has to get right, only the browser's model, which it has seen a million times. When the screen is wrong, the last thing set is wrong.

## Rule 5: ship the habits with the package

The package ships a skill: a short file listing the mistakes agents make from habit, and the right way for each. Lists in properties. Events as classes. An empty component reported why. Formatting configured once.

Copy it into your agent's skills folder:

```bash
cp -r node_modules/@relax.js/components/skills/relaxjs-components .claude/skills/
```

Or point your instruction file at its `SKILL.md`. It's half a page, because the design carries the rest.

## Where it does not fit

- **Compile checks need TypeScript.** In plain JavaScript, `event.detail` is `undefined` at runtime, and nothing tells you.
- **The skill must be loaded.** An agent without it will try JSON attributes, and the table stays empty without reporting anything. That one mistake is caught only by the skill and the docs.
- **I have no benchmark.** I can't give you a percentage. What I can say is that each mistake above now has an address: a compile error, a reported line, or a rule in the skill.

## The takeaway

Don't write more docs to fix agent mistakes. Design so the common mistake fails to compile or reports itself, in one line that names the tag and the problem. Then put the few rules the compiler can't check in a skill that ships with the package.

That is the last article in this series. The code is at [relax-js/components](https://github.com/relax-js/components), with three demo apps you can run in a minute.
