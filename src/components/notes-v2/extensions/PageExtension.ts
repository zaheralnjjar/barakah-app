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
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PageNodeView);
    },

    addStorage() {
        return {
            ruling: false,
            background: null,
            backgroundColor: '#ffffff',
            pageBgColor: '#ffffff',
            zoom: 100,
            orientation: 'portrait',
            margin: 20,
            border: 'none',
            borderColor: '#6b7280',
            borderWidth: 2,
            cornerRadius: 0,
        };
    },
});
