import { Inject } from '@relax.js/core/di';
import type { MenuItem, TopMenu } from '@relax.js/components';
import { LanguageService, type Language } from '../language/LanguageService';

const languages: { language: Language; title: string }[] = [
    { language: 'en', title: 'English' },
    { language: 'sv', title: 'Svenska' },
];

/** The app's title and menu, with the language switch in a submenu. */
class AppHeader extends HTMLElement {
    @Inject(LanguageService)
    private language!: LanguageService;

    private readonly heading = document.createElement('h1');
    private readonly menu: TopMenu = document.createElement('r-top-menu');
    private stopWatching?: () => void;

    connectedCallback(): void {
        this.menu.setAttribute('align', 'right');
        this.menu.addEventListener('r-menu-selected', (event) => {
            const choice = languages.find((l) => `language-${l.language}` === event.item.name);
            if (choice) {
                void this.language.use(choice.language);
            }
        });
        this.draw();
        this.replaceChildren(this.heading, this.menu);
        this.stopWatching = this.language.watch(() => this.draw());
    }

    disconnectedCallback(): void {
        this.stopWatching?.();
    }

    private draw(): void {
        const { copy } = this.language;
        this.heading.textContent = copy.app.title;
        document.title = copy.app.title;
        const items: MenuItem[] = [
            { name: 'overview', title: copy.nav.overview, href: '/' },
            { name: 'budget', title: copy.nav.budget, href: '/budget' },
            { name: 'transactions', title: copy.nav.transactions, href: '/transactions' },
            {
                name: 'language',
                title: copy.app.language,
                children: languages.map((l) => ({ name: `language-${l.language}`, title: l.title })),
            },
        ];
        this.menu.items = items;
    }
}

customElements.define('app-header', AppHeader);
