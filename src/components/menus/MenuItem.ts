import { Route } from "relaxjs/routing";
export class MenuItem {
    constructor(
        public title: string,
        public actionName?: string,
        public submenu?: SubMenuItem[],
        public requiredClaims?: string[],
        public route?: Route
    ) {}
}

export class SubMenuItem {
    constructor(
        public title: string,
        public actionName?: string,
        public componentName?: string,
        public requiredClaims?: string[]
    ) {}
}

export class MenuEvent extends Event {
    public static readonly SELECTED_EVENT = 'rlx.menuSelected';
    public static readonly ADDED_EVENT = 'rlx.menuAdded';
    public static readonly REMOVED_EVENT = 'rlx.menuRemoved';

    public menuItem: MenuItem;

    constructor(
        type: string,
        menuItem: MenuItem,
        options?: EventInit
    ) {
        super(type, options);
        this.menuItem = menuItem;
    }
}

declare global {
  interface HTMLElementEventMap {
      'rlx.menuAdded': MenuEvent;
      'rlx.menuSelected': MenuEvent;
      'rlx.menuRemoved': MenuEvent;
  }
}
