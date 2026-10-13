import type { TreeNode } from './Treeview';

/** Reads the nodes from a `<template name="data">` child holding JSON, or `undefined` when there are none or they are invalid. */
export function parseInlineNodes<T>(host: Element): TreeNode<T>[] | undefined {
    const template = host.querySelector<HTMLTemplateElement>(':scope > template[name="data"]');
    const json = template?.content.textContent?.trim();
    if (!json) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(json);
        if (!Array.isArray(parsed) || parsed.some((node) => typeof node?.label !== 'string')) {
            throw new Error('expected a list of nodes with labels');
        }
        return parsed as TreeNode<T>[];
    } catch (error) {
        console.error(`r-treeview: the data template is not valid JSON: ${(error as Error).message}`);
        return undefined;
    }
}
