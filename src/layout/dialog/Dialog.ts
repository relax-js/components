import { registerRouteTarget, unregisterRouteTarget, type NavigateRouteEvent } from '@relax.js/core';
import { installStyles } from '../../foundations/styles';
import '../../foundations/icon/Icon';
import { text, whenLanguageChanges } from '../../foundations/text/text';
import { isTone, toneIcon, type Tone } from '../../foundations/tone/tone';

/** What a confirmation asks; the buttons say confirm and cancel unless given their own words. */
export interface ConfirmOptions {
    heading: string;
    message: string;
    tone: Tone;
    confirmText?: string;
    cancelText?: string;
}

const styles = /* css */ `
r-dialog {
    display: contents;

    & dialog {
        display: flex;
        flex-direction: column;
        gap: var(--dialog-gap);
        padding: var(--dialog-padding);
        border: 1px solid var(--bd-muted);
        border-radius: var(--dialog-radius);
        box-shadow: var(--dialog-shadow);
        background: var(--surface-raised);
        color: var(--text-primary);
        animation: r-dialog-in var(--motion-base) ease;

        &::backdrop {
            background: var(--overlay-dim);
            animation: r-dialog-in var(--motion-base) ease;
        }
    }

    & .dialog-title {
        margin: 0;
    }

    & .dialog-message {
        margin: 0;
        color: var(--tone, var(--text-primary));
    }

    & .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--dialog-gap);
    }

    & .dialog-close,
    & .dialog-cancel,
    & .dialog-confirm {
        align-self: flex-end;
        font: inherit;
        color: var(--text-primary);
        background: none;
        border: 1px solid var(--bd-muted);
        border-radius: var(--control-radius);
        padding: var(--control-padding);
        cursor: pointer;

        &:hover {
            background: var(--surface-hover);
        }

        &:focus-visible {
            outline: 2px solid var(--focus-ring);
            outline-offset: 2px;
        }
    }
}

@keyframes r-dialog-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    r-dialog dialog,
    r-dialog dialog::backdrop {
        animation: none;
    }
}
`;

let nextId = 0;

/**
 * A modal dialog whose content is created when it opens and gone when it closes. The content is
 * a `<template>` child.
 *
 * @example
 * ```html
 * <r-dialog heading="Rename"><template><form>...</form></template></r-dialog>
 * ```
 *
 * @attr {string} heading - The dialog's title, also its accessible name
 * @attr {boolean} open - Present while the dialog is open; set by the dialog
 */
export class Dialog extends HTMLElement {
    private dialog?: HTMLDialogElement;
    private opener?: Element | null;
    private explicit?: { result: unknown };
    private stopListening?: () => void;
    private routeName?: string;
    private page?: Element;
    private resolveClosed?: (result: unknown) => void;
    private readonly redraw = () => {
        const label = this.dialog?.querySelector('.dialog-close');
        if (label) {
            label.textContent = text('close');
        }
    };

    connectedCallback(): void {
        installStyles(this, 'r-dialog', styles);
        this.stopListening = whenLanguageChanges(this.redraw);
        this.routeName = this.getAttribute('name') ?? undefined;
        if (this.routeName) {
            registerRouteTarget(this.routeName, (event) => this.showRoute(event));
        }
    }

    disconnectedCallback(): void {
        this.stopListening?.();
        if (this.routeName) {
            unregisterRouteTarget(this.routeName);
            this.routeName = undefined;
        }
    }

    // A route sent to this dialog's name shows in it: the page is created now, not kept hidden.
    private showRoute(event: NavigateRouteEvent): void {
        const { route, routeData } = event;
        const page = route.componentTagName
            ? document.createElement(route.componentTagName)
            : route.component
              ? new route.component()
              : undefined;
        if (!page) {
            console.error('r-dialog: the route names no component');
            return;
        }
        if (routeData) {
            (page as { routeData?: unknown }).routeData = routeData;
        }
        this.page = page;
        if (this.dialog) {
            // already open: the new page replaces the old one
            this.dialog.querySelector(':scope > .dialog-page')?.remove();
            this.dialog.append(this.wrapPage(page));
        } else {
            void this.open();
        }
    }

    private wrapPage(page: Element): HTMLElement {
        const holder = document.createElement('div');
        holder.className = 'dialog-page';
        holder.append(page);
        return holder;
    }

    /** Asks for confirmation in a dialog of its own; resolves true on confirm, false on cancel or dismissal. */
    static async confirm(options: ConfirmOptions): Promise<boolean> {
        if (!isTone(options.tone)) {
            throw new Error(`r-dialog: tone "${options.tone}" is not one of ok, info, warn, danger, muted`);
        }
        const element = document.createElement('r-dialog');
        element.setAttribute('heading', options.heading);

        const body = document.createElement('p');
        body.className = 'dialog-message';
        body.dataset.tone = options.tone;
        const icon = document.createElement('r-icon');
        icon.setAttribute('name', toneIcon[options.tone]);
        const message = document.createElement('span');
        // textContent: the message is text, never markup
        message.textContent = options.message;
        body.append(icon, ' ', message);

        const actions = document.createElement('div');
        actions.className = 'dialog-actions';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'dialog-cancel';
        cancel.textContent = options.cancelText ?? text('cancel');
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'dialog-confirm';
        confirm.textContent = options.confirmText ?? text('confirm');
        actions.append(cancel, confirm);
        // the template content is cloned on open, which drops listeners: listen on the dialog instead
        element.addEventListener('click', (event) => {
            const target = event.target as Element;
            if (target.closest('.dialog-confirm')) {
                element.close(true);
            } else if (target.closest('.dialog-cancel')) {
                element.close(false);
            }
        });

        const template = document.createElement('template');
        template.content.append(body, actions);
        element.append(template);
        document.body.append(element);
        try {
            return (await element.open()) === true;
        } finally {
            element.remove();
        }
    }

    /** Opens the dialog; resolves when it closes. */
    open(): Promise<unknown> {
        if (this.dialog) {
            throw new Error('r-dialog: the dialog is already open');
        }
        const heading = this.getAttribute('heading') ?? '';
        if (heading === '') {
            console.error('r-dialog: the heading attribute is missing');
        }

        const dialog = document.createElement('dialog');
        const title = document.createElement('h2');
        title.className = 'dialog-title';
        if (heading !== '') {
            title.id = `r-dialog-title-${++nextId}`;
            title.textContent = heading;
            dialog.setAttribute('aria-labelledby', title.id);
            dialog.append(title);
        }
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'dialog-close';
        close.textContent = text('close');
        close.addEventListener('click', () => this.dismiss(dialog));
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            this.dismiss(dialog);
        });
        dialog.append(close);
        const template = this.querySelector(':scope > template');
        if (this.page) {
            dialog.append(this.wrapPage(this.page));
        } else if (template) {
            dialog.append((template as HTMLTemplateElement).content.cloneNode(true));
        }
        dialog.addEventListener('close', () => this.finish(dialog));

        this.opener = document.activeElement;
        this.dialog = dialog;
        this.append(dialog);
        dialog.showModal();
        this.setAttribute('open', '');
        if (!dialog.contains(document.activeElement)) {
            (dialog.querySelector<HTMLElement>('input, select, textarea, a[href], button') ?? dialog).focus();
        }
        return new Promise((resolve) => {
            this.resolveClosed = resolve;
        });
    }

    /** Closes the open dialog with a result for the opener; never asks to be stopped. */
    close(result?: unknown): void {
        if (!this.dialog) {
            return;
        }
        this.explicit = { result };
        this.dialog.close();
    }

    // Escape and the close button dismiss; the page may veto that, e.g. for unsaved changes.
    private dismiss(dialog: HTMLDialogElement): void {
        const closing = new CustomEvent('r-dialog-closing', { bubbles: true, cancelable: true });
        this.dispatchEvent(closing);
        if (!closing.defaultPrevented) {
            dialog.close();
        }
    }

    private finish(dialog: HTMLDialogElement): void {
        // A native form submission leaves the submitter's value as the return value.
        const result = this.explicit
            ? this.explicit.result
            : dialog.returnValue !== undefined && dialog.returnValue !== ''
              ? dialog.returnValue
              : undefined;
        this.explicit = undefined;
        dialog.remove();
        this.dialog = undefined;
        this.page = undefined;
        this.removeAttribute('open');
        const opener = this.opener;
        this.opener = undefined;
        if (opener instanceof HTMLElement && opener.isConnected) {
            opener.focus();
        }
        this.dispatchEvent(new CustomEvent('r-dialog-close', { bubbles: true, detail: result }));
        this.resolveClosed?.(result);
        this.resolveClosed = undefined;
    }
}

if (!customElements.get('r-dialog')) {
    customElements.define('r-dialog', Dialog);
}

declare global {
    interface HTMLElementTagNameMap {
        'r-dialog': Dialog;
    }
}
