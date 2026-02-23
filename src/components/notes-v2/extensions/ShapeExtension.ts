import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ShapeNodeView } from './ShapeNodeView.tsx';

export const ShapeExtension = Node.create({
    name: 'shape',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            type: {
                default: 'rectangle',
            },
            x: {
                default: 100,
            },
            y: {
                default: 100,
            },
            width: {
                default: 150,
            },
            height: {
                default: 150,
            },
            fill: {
                default: '#43a047',
            },
            stroke: {
                default: '#1b5e20',
            },
            strokeWidth: {
                default: 2,
            },
            rotation: {
                default: 0,
            },
            zIndex: {
                default: 70,
            },
            opacity: {
                default: 1,
            },
            borderRadius: {
                default: 0,
            },
            text: {
                default: '',
            },
            textColor: {
                default: '#ffffff',
            },
            fontSize: {
                default: 16,
            },
            fontFamily: {
                default: 'Cairo',
            },
            textAlign: {
                default: 'center',
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="shape"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        type: element.getAttribute('data-shape-type') || 'rectangle',
                        x: parseInt(element.getAttribute('data-x') || '100', 10),
                        y: parseInt(element.getAttribute('data-y') || '100', 10),
                        width: parseInt(element.getAttribute('data-width') || '150', 10),
                        height: parseInt(element.getAttribute('data-height') || '150', 10),
                        fill: element.getAttribute('data-fill') || '#43a047',
                        stroke: element.getAttribute('data-stroke') || '#1b5e20',
                        strokeWidth: parseInt(element.getAttribute('data-stroke-width') || '2', 10),
                        rotation: parseInt(element.getAttribute('data-rotation') || '0', 10),
                        zIndex: parseInt(element.getAttribute('data-z-index') || '70', 10),
                        opacity: parseFloat(element.getAttribute('data-opacity') || '1'),
                        borderRadius: parseInt(element.getAttribute('data-border-radius') || '0', 10),
                        text: element.getAttribute('data-text') || '',
                        textColor: element.getAttribute('data-text-color') || '#ffffff',
                        fontSize: parseInt(element.getAttribute('data-font-size') || '16', 10),
                        fontFamily: element.getAttribute('data-font-family') || 'Cairo',
                        textAlign: element.getAttribute('data-text-align') || 'center',
                    };
                },
            }
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'shape',
            'data-shape-type': HTMLAttributes.type,
            'data-x': HTMLAttributes.x,
            'data-y': HTMLAttributes.y,
            'data-width': HTMLAttributes.width,
            'data-height': HTMLAttributes.height,
            'data-fill': HTMLAttributes.fill,
            'data-stroke': HTMLAttributes.stroke,
            'data-stroke-width': HTMLAttributes.strokeWidth,
            'data-rotation': HTMLAttributes.rotation,
            'data-z-index': HTMLAttributes.zIndex,
            'data-opacity': HTMLAttributes.opacity,
            'data-border-radius': HTMLAttributes.borderRadius,
            'data-text': HTMLAttributes.text,
            'data-text-color': HTMLAttributes.textColor,
            'data-font-size': HTMLAttributes.fontSize,
            'data-font-family': HTMLAttributes.fontFamily,
            'data-text-align': HTMLAttributes.textAlign,
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ShapeNodeView);
    },
});
