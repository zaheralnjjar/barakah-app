import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PageNodeView } from './PageNodeView';

export const PageExtension = Node.create({
    name: 'page',
    group: 'block',
    content: 'block+',
    draggable: false,

    addAttributes() {
        return {
            pageNumber: {
                default: 1,
            },
            header: {
                default: null,
            },
            footer: {
                default: null,
            },
            layout: {
                default: 'blank',
            },
            rulingSpacing: {
                default: 32,
            },
            pageBgColor: {
                default: '#ffffff',
            },
            orientation: {
                default: 'portrait',
            },
            margin: {
                default: 20,
            },
            border: {
                default: 'none',
            },
            borderColor: {
                default: '#6b7280',
            },
            borderWidth: {
                default: 2,
            },
            cornerRadius: {
                default: 0,
            },
            _settingsVersion: {
                default: 0,
                rendered: false,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="page"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        pageNumber: parseInt(element.getAttribute('data-page-number') || '1', 10),
                        header: element.getAttribute('data-header'),
                        footer: element.getAttribute('data-footer'),
                        layout: element.getAttribute('data-layout') || 'blank',
                        rulingSpacing: parseInt(element.getAttribute('data-ruling-spacing') || '32', 10),
                        pageBgColor: element.getAttribute('data-page-bg-color') || '#ffffff',
                        orientation: element.getAttribute('data-orientation') || 'portrait',
                        margin: parseInt(element.getAttribute('data-margin') || '20', 10),
                        border: element.getAttribute('data-border') || 'none',
                        borderColor: element.getAttribute('data-border-color') || '#6b7280',
                        borderWidth: parseFloat(element.getAttribute('data-border-width') || '2'),
                        cornerRadius: parseFloat(element.getAttribute('data-corner-radius') || '0'),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'page',
            'data-page-number': HTMLAttributes.pageNumber,
            'data-header': HTMLAttributes.header,
            'data-footer': HTMLAttributes.footer,
            'data-layout': HTMLAttributes.layout,
            'data-ruling-spacing': HTMLAttributes.rulingSpacing,
            'data-page-bg-color': HTMLAttributes.pageBgColor,
            'data-orientation': HTMLAttributes.orientation,
            'data-margin': HTMLAttributes.margin,
            'data-border': HTMLAttributes.border,
            'data-border-color': HTMLAttributes.borderColor,
            'data-border-width': HTMLAttributes.borderWidth,
            'data-corner-radius': HTMLAttributes.cornerRadius,
        }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PageNodeView);
    },

    addStorage() {
        return {
            zoom: 100,
        };
    },
});
