import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DOMParser } from '@tiptap/pm/model';
import { TextBoxNodeView } from './TextBoxNodeView';

interface InsertTextBoxOptions {
    content?: any;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textBox: {
            insertTextBox: (options?: InsertTextBoxOptions) => ReturnType;
        };
    }
}

export const TextBoxExtension = Node.create({
    name: 'textBox',
    group: 'block',
    atom: false,
    content: 'block+',
    draggable: false,
    // If we use React Draggable, we might want Tiptap to IGNORE its own drag logic for this node 
    // or we use a drag handle distinct from Tiptap's.

    addAttributes() {
        return {
            x: {
                default: 0,
            },
            y: {
                default: 0,
            },
            width: {
                default: 150,
            },
            baseWidth: {
                default: 150,
            },
            height: {
                default: 50,
            },
            backgroundColor: {
                default: '#ffffff',
            },
            borderColor: {
                default: '#e2e8f0',
            },
            borderWidth: {
                default: 1,
            },
            borderStyle: {
                default: 'solid',
            },
            opacity: {
                default: 1,
            },
            zIndex: {
                default: 10,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="text-box"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        x: parseInt(element.getAttribute('data-x') || '0', 10),
                        y: parseInt(element.getAttribute('data-y') || '0', 10),
                        width: parseInt(element.getAttribute('data-width') || '150', 10),
                        height: parseInt(element.getAttribute('data-height') || '50', 10),
                        baseWidth: parseInt(element.getAttribute('data-base-width') || '150', 10),
                        backgroundColor: element.getAttribute('data-bg-color') || '#ffffff',
                        borderColor: element.getAttribute('data-border-color') || '#e2e8f0',
                        borderWidth: parseFloat(element.getAttribute('data-border-width') || '1'),
                        borderStyle: element.getAttribute('data-border-style') || 'solid',
                        opacity: parseFloat(element.getAttribute('data-opacity') || '1'),
                        zIndex: parseInt(element.getAttribute('data-z-index') || '10', 10),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'text-box',
            'data-x': HTMLAttributes.x,
            'data-y': HTMLAttributes.y,
            'data-width': HTMLAttributes.width,
            'data-height': HTMLAttributes.height,
            'data-base-width': HTMLAttributes.baseWidth,
            'data-bg-color': HTMLAttributes.backgroundColor,
            'data-border-color': HTMLAttributes.borderColor,
            'data-border-width': HTMLAttributes.borderWidth,
            'data-border-style': HTMLAttributes.borderStyle,
            'data-opacity': HTMLAttributes.opacity,
            'data-z-index': HTMLAttributes.zIndex,
        }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TextBoxNodeView);
    },

    addCommands() {
        return {
            insertTextBox: (options: InsertTextBoxOptions = {}) => ({ commands, editor, chain }) => {
                const { content, ...attributes } = options;

                let parsedContent = content;
                if (typeof content === 'string') {
                    const element = document.createElement('div');
                    element.innerHTML = content;
                    parsedContent = DOMParser.fromSchema(editor.schema).parse(element).toJSON().content;
                }

                const { doc, selection } = editor.state;
                const cursorPos = selection.$anchor.pos;

                let isInsidePage = false;
                doc.descendants((node, pos) => {
                    if (node.type.name === 'page') {
                        const endPos = pos + node.nodeSize;
                        if (cursorPos >= pos && cursorPos <= endPos) {
                            isInsidePage = true;
                        }
                    }
                    return true;
                });

                let insertPos = cursorPos;

                if (!isInsidePage) {
                    let lastPagePos = -1;
                    let lastPageNode: any = null;
                    doc.descendants((node, pos) => {
                        if (node.type.name === 'page') {
                            lastPagePos = pos;
                            lastPageNode = node;
                        }
                        return true;
                    });
                    insertPos = (lastPagePos >= 0 && lastPageNode)
                        ? lastPagePos + lastPageNode.nodeSize - 1
                        : doc.content.size;
                }

                return chain()
                    .focus()
                    .insertContentAt(insertPos, [
                        {
                            type: this.name,
                            attrs: {
                                x: attributes.x ?? 50,
                                y: attributes.y ?? 50,
                                width: attributes.width ?? 200,
                                height: attributes.height ?? 60,
                                baseWidth: attributes.width ?? 200,
                                ...attributes,
                            },
                            content: parsedContent || [
                                {
                                    type: 'paragraph',
                                }
                            ]
                        },
                    ])
                    .run();
            },
        };
    },
});
