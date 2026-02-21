import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { CommandsList } from './CommandsList' // We can reuse or create a specialized list

export const NoteLinkExtension = Extension.create({
    name: 'noteLink',

    addOptions() {
        return {
            suggestion: {
                char: '@',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                pluginKey: new PluginKey('noteLink'),
                ...this.options.suggestion,
            }),
        ]
    },
})

// We'll reuse the CommandsList for now but filter for notes
