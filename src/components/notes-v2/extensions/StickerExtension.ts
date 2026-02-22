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
                default: undefined,
            },
            width: {
                default: 120, // default if size is undefined
            },
            height: {
                default: 120, // default if size is undefined
            },
            rotation: {
                default: 0,
            },
            zIndex: {
                default: 50,
            },
            opacity: {
                default: 1,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="sticker"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        src: element.getAttribute('data-src') || '',
                        x: parseInt(element.getAttribute('data-x') || '100', 10),
                        y: parseInt(element.getAttribute('data-y') || '100', 10),
                        size: element.hasAttribute('data-size') ? parseInt(element.getAttribute('data-size') || '120', 10) : undefined,
                        width: parseInt(element.getAttribute('data-width') || '120', 10),
                        height: parseInt(element.getAttribute('data-height') || '120', 10),
                        rotation: parseInt(element.getAttribute('data-rotation') || '0', 10),
                        zIndex: parseInt(element.getAttribute('data-z-index') || '50', 10),
                        opacity: parseFloat(element.getAttribute('data-opacity') || '1'),
                    };
                },
            }
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'sticker',
            'data-src': HTMLAttributes.src,
            'data-x': HTMLAttributes.x,
            'data-y': HTMLAttributes.y,
            'data-size': HTMLAttributes.size,
            'data-width': HTMLAttributes.width,
            'data-height': HTMLAttributes.height,
            'data-rotation': HTMLAttributes.rotation,
            'data-z-index': HTMLAttributes.zIndex,
            'data-opacity': HTMLAttributes.opacity,
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(StickerNodeView);
    },
});
