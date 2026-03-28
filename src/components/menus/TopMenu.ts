import { MenuEvent, MenuItem } from './MenuItem';

export class TopMenu extends HTMLElement {
    private menuItems: MenuItem[] = [];
    private menu: HTMLElement;
    private submenu: HTMLElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    --menu-bg-color: radial-gradient(ellipse at top left, #161616, #1f1f2c, #16161f);
                    --menu-text-color: #fff;
                    --submenu-bg-color: linear-gradient(13deg, rgba(26,26,26,1) 0%, rgba(30,30,32,1) 100%);
                    --chevron-size: 16px;
                    --menu-shadow: 0 4px 10px rgba(0, 0, 0, 0.8);
                    --menu-glow: 0px 0px 15px rgba(255, 255, 255, 0.5);
                    display: block;
                }

                @keyframes kenburns-top-normal {
                    0% { transform: scale(1) translateY(0); transform-origin: 50% 16%; }
                    100% { transform: scale(1.10) translateY(-3px); transform-origin: top; }
                }

                .container {
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    height: 2rem;
                    background: var(--menu-bg-color);
                    box-shadow: var(--menu-shadow);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: var(--menu-text-color);
                }

                .menu,
                .submenu {
                    display: flex;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    position: absolute;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    align-items: center;
                    transition: transform 0.5s ease-in-out;

                    &.align-left { justify-content: flex-start; }
                    &.align-center { justify-content: center; }
                    &.align-right { justify-content: flex-end; }
                }

                .menu {
                    transform: translateX(0);
                }

                .submenu {
                    transform: translateX(100%);
                    background: var(--submenu-bg-color);
                }

                li {
                    cursor: pointer;
                    padding: 0.1rem 0.3rem;
                    border-radius: 5px;
                    transition: background 0.3s, box-shadow 0.3s;

                    &:hover {
                        background: rgba(255, 255, 255, 0.1);
                        box-shadow: var(--menu-glow);
                        animation: kenburns-top-normal 0.2s ease 0s 1 normal none;
                    }
                }

                .chevron {
                    font-size: var(--chevron-size);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    transition: background 0.3s;

                    &:hover {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 5px;
                        box-shadow: var(--menu-glow);
                    }
                }
            </style>
            <div class="container">
                <ul class="menu"></ul>
                <ul class="submenu"></ul>
            </div>
        `;
        this.shadowRoot?.appendChild(template.content.cloneNode(true));

        // Lookup menu and submenu once
        this.menu = this.shadowRoot?.querySelector('.menu')!;
        this.submenu = this.shadowRoot?.querySelector('.submenu')!;
    }

    static get observedAttributes() {
        return ['align'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'align') {
            this.updateAlignment(newValue);
        }
    }

    connectedCallback() {
        // Apply default alignment if not set
        const alignment = this.getAttribute('align') || 'center';
        this.updateAlignment(alignment);
    }

    private updateAlignment(alignment: string): void {
        const alignClass = `align-${alignment}`;
        ['align-left', 'align-center', 'align-right'].forEach((cls) => {
            this.menu.classList.remove(cls);
            this.submenu.classList.remove(cls);
        });
        this.menu.classList.add(alignClass);
        this.submenu.classList.add(alignClass);
    }

    setItems(menuItems: MenuItem[]): void {
        this.menuItems = menuItems;
        console.log('assiugned items');
        this.renderMenu();
    }

    private renderMenu(): void {
        this.menu.innerHTML = '';

        this.menuItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item.title;
            if (item.submenu && item.submenu.length > 0) {
                li.addEventListener('click', () => this.navigate(item));
            } else {
                li.addEventListener('click', () => this.showSubmenu(item));
            }

            this.menu.appendChild(li);
        });
    }

    private showSubmenu(parentMenu: MenuItem): void {
        this.submenu.innerHTML = '';

        const backChevron = document.createElement('li');
        backChevron.className = 'chevron';
        backChevron.textContent = '⬅ Back';
        backChevron.addEventListener('click', () => this.resetMenu());
        this.submenu.appendChild(backChevron);

        parentMenu.submenu!.forEach((subItem) => {
            const li = document.createElement('li');
            li.textContent = subItem.title;
            li.addEventListener('click', () => {
                this.navigate(subItem);
            });
            this.submenu.appendChild(li);
        });

        // Trigger the animation
        this.menu.style.transform = 'translateX(-100%)';
        this.submenu.style.transform = 'translateX(0)';
    }

    public resetMenu(): void {
        this.menu.style.transform = 'translateX(0)';
        this.submenu.style.transform = 'translateX(100%)';
    }

    navigate(item: MenuItem) {
        this.dispatchEvent(
            new MenuEvent(MenuEvent.SELECTED_EVENT, item, {
                bubbles: true,
                composed: true
            })
        );
    }
}
// Guard against duplicate registration during HMR, which re-executes module-level code
if (!customElements.get('r-top-menu')) {
    customElements.define('r-top-menu', TopMenu);
}
