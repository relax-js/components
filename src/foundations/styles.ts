/**
 * Installs a light-DOM component's stylesheet once in the root the element lives in: the
 * document head, or the shadow root of the component that contains it. Wrapped in a cascade
 * layer so any style the app writes wins without needing higher specificity.
 */
export function installStyles(element: Element, id: string, css: string): void {
    const root = element.getRootNode();
    const container = root instanceof ShadowRoot ? root : document.head;
    if (container.querySelector(`style[data-r-styles="${id}"]`)) {
        return;
    }
    const style = document.createElement('style');
    style.dataset.rStyles = id;
    style.textContent = `@layer relax-components {\n${css}\n}`;
    container.append(style);
}
