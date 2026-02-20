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
                default: 400,
            },
            baseWidth: {
                default: 400,
            },
            height: {
                default: 560,
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
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="text-box"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'text-box' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TextBoxNodeView);
    },

    addCommands() {
        return {
            insertTextBox: (options: InsertTextBoxOptions = {}) => ({ commands, editor }) => {
                const { content, ...attributes } = options;

                let parsedContent = content;
                if (typeof content === 'string') {
                    const element = document.createElement('div');
                    element.innerHTML = content;
                    parsedContent = DOMParser.fromSchema(editor.schema).parse(element).toJSON().content;
                }

                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        x: attributes.x ?? 50,
                        y: attributes.y ?? 150,
                        width: attributes.width ?? 400,
                        height: attributes.height ?? 560,
                        baseWidth: attributes.width ?? 400,
                        ...attributes,
                    },
                    content: parsedContent || [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'اكتب هنا...' }]
                        }
                    ]
                });
            },
        };
    },
});
