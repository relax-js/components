// tabs-container.ts
export class TabsContainer extends HTMLElement {
    private _selectedTab: number = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    private render() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }
            menu {
                display: flex;
                flex-direction: row;
                padding: 0;
                list-style: none;
                border-bottom: 1px solid var(--bd-muted);
            }
            ::slotted(r-tab) {
                display: none;
            }
            ::slotted(r-tab[selected]) {
                display: block;
            }
        `;

        const menu = document.createElement('menu');
        const content = document.createElement('div');
        content.innerHTML = '<slot></slot>';

        this.shadowRoot!.appendChild(style);
        this.shadowRoot!.appendChild(menu);
        this.shadowRoot!.appendChild(content);

        this.updateTabs();
    }

    private setupEventListeners() {
        this.shadowRoot!.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'li') {
                const index = Array.from(target.parentElement!.children).indexOf(target);
                this.selectTab(index);
            }
        });
    }

    private updateTabs() {
        const tabs = Array.from(this.children) as HTMLElement[];
        const menu = this.shadowRoot!.querySelector('menu')!;

        menu.innerHTML = '';
        tabs.forEach((tab, index) => {
            const li = document.createElement('li');
            li.textContent = tab.getAttribute('label') || `Tab ${index + 1}`;
            li.className = index === this._selectedTab ? 'selected' : '';
            menu.appendChild(li);
        });

        this.selectTab(this._selectedTab);
    }

    private selectTab(index: number) {
        const tabs = Array.from(this.children) as HTMLElement[];
        const menuItems = this.shadowRoot!.querySelectorAll('menu li');

        tabs.forEach((tab, i) => {
            if (i === index) {
                tab.setAttribute('selected', '');
                menuItems[i].classList.add('selected');
            } else {
                tab.removeAttribute('selected');
                menuItems[i].classList.remove('selected');
            }
        });

        this._selectedTab = index;
        this.dispatchEvent(new CustomEvent('tab-change', {
            detail: { selectedIndex: index }
        }));
    }

    static get observedAttributes() {
        return ['selected'];
    }

    attributeChangedCallback(name: string, _: string, newValue: string) {
        if (name === 'selected') {
            this.selectTab(parseInt(newValue) || 0);
        }
    }
}

// r-tab.ts
export class TabItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                padding: 1rem;
            }
        `;

        const content = document.createElement('div');
        content.innerHTML = '<slot></slot>';

        this.shadowRoot!.appendChild(style);
        this.shadowRoot!.appendChild(content);
    }
}

// Register components
customElements.define('r-tabs', TabsContainer);
customElements.define('r-tab', TabItem);
