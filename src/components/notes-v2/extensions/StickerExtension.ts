import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { StickerNodeView } from './StickerNodeView';

export const StickerExtension = Node.create({
    name: 'sticker',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: '',
            },
            x: {
                default: 100,
            },
            y: {
                default: 100,
            },
            size: {
                default: 80,
            },
            rotation: {
                default: 0,
            },
            zIndex: {
                default: 50,
            }
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="sticker"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sticker' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(StickerNodeView);
    },
});
