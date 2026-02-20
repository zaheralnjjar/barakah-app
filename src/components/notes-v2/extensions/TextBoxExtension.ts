import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TextBoxNodeView } from './TextBoxNodeView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textBox: {
            insertTextBox: () => ReturnType;
        };
    }
}

export const TextBoxExtension = Node.create({
    name: 'textBox',
    group: 'block',
    atom: true, // It's an atom because it manages its own content rendering via NodeViewContent? No, if it has content it shouldn't be atom?
    // Actually, if we use NodeViewContent, it shouldn't be an atom in the strict sense of "no content", 
    // but drag/drop wrappers often behave like atoms in flow. 
    // However, draggable nodes with editable content usually are NOT atoms.
    // Let's try atom: false (default for block) but verify draggable behavior.

    content: 'block+', // Can contain other blocks
    draggable: true, // Tiptap draggable handler? We utilize react-draggable, so maybe set false to avoid conflict?
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
                default: 300,
            },
            height: {
                default: 200,
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
            insertTextBox: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        x: 0,
                        y: 0,
                    },
                    content: [
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
