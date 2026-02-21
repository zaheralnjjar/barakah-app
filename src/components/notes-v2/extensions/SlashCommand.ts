import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { CommandsList } from './CommandsList'
import React from 'react'

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addStorage() {
        return {
            onInsertTracker: null as (() => void) | null,
            onOpenTemplates: null as (() => void) | null,
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                pluginKey: new PluginKey('slashCommand'),
                ...this.options.suggestion,
            }),
        ]
    },
})

export const renderItems = () => {
    return {
        onStart: (props: any) => {
            props.renderer = new ReactRenderer(CommandsList, {
                props,
                editor: props.editor,
            })

            props.popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: props.renderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            })
        },
        onUpdate(props: any) {
            props.renderer.updateProps(props)

            props.popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            })
        },
        onKeyDown(props: any) {
            if (props.event.key === 'Escape') {
                props.popup[0].hide()
                return true
            }

            return props.renderer.ref?.onKeyDown(props)
        },
        onExit(props: any) {
            props.popup[0].destroy()
            props.renderer.destroy()
        },
    }
}
