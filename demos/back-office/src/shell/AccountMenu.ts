import { Dialog, type DropdownMenu } from '@relax.js/components';

/** The signed-in user's menu in the header. */
class AccountMenu extends HTMLElement {
    connectedCallback(): void {
        const menu: DropdownMenu = document.createElement('r-dropdown-menu');
        menu.setAttribute('label', 'Linnea Berg');
        menu.items = [
            { name: 'profile', title: 'Profile', href: '/settings/notifications' },
            { name: 'sign-out', title: 'Sign out' },
        ];
        menu.addEventListener('r-menu-selected', (event) => {
            if (event.item.name === 'sign-out') {
                void this.signOut();
            }
        });
        this.replaceChildren(menu);
    }

    private async signOut(): Promise<void> {
        const leave = await Dialog.confirm({
            heading: 'Sign out?',
            message: 'Unsaved changes in an open form are lost.',
            tone: 'info',
            confirmText: 'Sign out',
        });
        if (leave) {
            const notice = document.createElement('r-banner');
            notice.setAttribute('tone', 'info');
            notice.textContent = 'You have signed out. Reload the page to sign in again.';
            document.body.replaceChildren(notice);
        }
    }
}

customElements.define('account-menu', AccountMenu);
