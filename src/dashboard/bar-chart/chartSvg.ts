const svgNamespace = 'http://www.w3.org/2000/svg';
export const width = 640;
export const height = 230;
export const pad = { left: 72, right: 12, top: 12, bottom: 28 };

export function element<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>): SVGElementTagNameMap[K] {
    const created = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attributes)) {
        created.setAttribute(key, String(value));
    }
    return created;
}
