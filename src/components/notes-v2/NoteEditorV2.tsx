
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import TiptapHighlight from '@tiptap/extension-highlight';
import { EditorToolbar } from './EditorToolbar';
import { TemplatesGallery } from './TemplatesGallery';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlignJustify, Bookmark } from 'lucide-react';

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace('px', ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}px`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
    addKeyboardShortcuts() {
        return {
            'Mod-=': () => {
                const currentSize = parseInt(this.editor.getAttributes('textStyle').fontSize || '16');
                return this.editor.commands.setFontSize(`${currentSize + 2}`);
            },
            'Mod--': () => {
                const currentSize = parseInt(this.editor.getAttributes('textStyle').fontSize || '16');
                return this.editor.commands.setFontSize(`${Math.max(10, currentSize - 2)}`);
            },
            'Mod-0': () => this.editor.commands.setFontSize('16'),
        };
    },
});

interface NoteEditorV2Props {
    initialContent: string;
    onUpdate: (content: string) => void;
    editable?: boolean;
    autoInsertSeparator?: boolean;
    isBookmarked?: boolean;
    onToggleBookmark?: () => void;
}

export const NoteEditorV2: React.FC<NoteEditorV2Props> = ({
    initialContent,
    onUpdate,
    editable = true,
    autoInsertSeparator = true,
    isBookmarked = false,
    onToggleBookmark
}) => {
    const [showTemplates, setShowTemplates] = useState(false);
    const [pageRuling, setPageRuling] = useState(false);
    const [pageBackground, setPageBackground] = useState<string | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            FontSize,
            Color,
            FontFamily,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TiptapHighlight.configure({
                multicolor: true,
            }),
            Image,
        ],
        content: initialContent || '',
        editable,
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-4 md:px-8 md:py-6 text-gray-700 leading-relaxed dir-rtl',
                dir: 'auto',
                style: 'min-height: 100%;' // Help click-anywhere behavior
            },
        },
    });

    // ... (effects and handlers same as before)
    // Auto-insert separator logic
    useEffect(() => {
        if (editor && initialContent && autoInsertSeparator) {
            const isNewNote = !initialContent || initialContent === '<p></p>';
            if (!isNewNote) {
                // Logic to insert separator if needed
            }
        }
    }, [editor, initialContent, autoInsertSeparator]);

    // Sync external content changes
    useEffect(() => {
        if (editor && initialContent !== editor.getHTML()) {
            // editor.commands.setContent(initialContent); // Optional sync
        }
    }, [initialContent, editor]);



    const handleSelectTemplate = (content: string, type: 'text' | 'background' = 'text') => {
        if (type === 'background') {
            setPageBackground(content);
            setPageRuling(false);
        } else {
            editor?.chain().focus().insertContent(content).run();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl overflow-hidden border border-white shadow-xl">
            {/* Toolbar Section */}
            <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-white/80 to-transparent flex items-start gap-2">
                <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                    <EditorToolbar
                        editor={editor}

                        onOpenTemplates={() => setShowTemplates(true)}
                    />
                </div>

                {/* Bookmark Removed */}

                {/* Page Ruling Toggle */}
                <button
                    onClick={() => {
                        setPageRuling(!pageRuling);
                        setPageBackground(null);
                    }}
                    className={`p-2.5 mt-2 rounded-xl transition-all shadow-sm border ${pageRuling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white text-gray-400 border-white hover:bg-gray-50'}`}
                    title="تسطير الصفحة"
                >
                    <AlignJustify className="w-5 h-5 rotate-90" />
                </button>
            </div>

            {/* Editor Area */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-6 cursor-text pb-6"
                onClick={(e) => {
                    // Click Anywhere logic
                    if (e.target === e.currentTarget && editor) {
                        editor.chain().focus('end').run();
                    }
                }}
            >
                <div
                    className={`bg-white min-h-full rounded-2xl shadow-sm border border-gray-100 p-0 transition-all duration-300 ${pageRuling ? 'ruled-paper' : ''}`}
                    style={(() => {
                        if (pageBackground) {
                            let bgImage = pageBackground;
                            let bgSize = 'cover';
                            let bgRepeat = 'no-repeat';

                            try {
                                if (pageBackground.startsWith('{')) {
                                    const parsed = JSON.parse(pageBackground);
                                    bgImage = parsed.image;
                                    bgSize = parsed.size || 'cover';
                                    bgRepeat = parsed.repeat || 'no-repeat';
                                }
                            } catch (e) {
                                // Not JSON, assume simple string
                            }

                            return {
                                backgroundImage: bgImage,
                                backgroundSize: bgSize,
                                backgroundAttachment: 'local',
                                backgroundRepeat: bgRepeat,
                                minHeight: '1000px'
                            };
                        } else if (pageRuling) {
                            return {
                                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                                backgroundAttachment: 'local',
                                lineHeight: '32px',
                                paddingTop: '4px'
                            };
                        }
                        return {};
                    })()}
                >
                    <EditorContent editor={editor} className="min-h-full [&_.ProseMirror]:min-h-[400px]" />
                </div>
            </div>



            <TemplatesGallery
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </div>
    );
};
