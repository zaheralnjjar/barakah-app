
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { EditorToolbar } from './EditorToolbar';
import { DrawingCanvas } from './DrawingCanvas';
import { TemplatesGallery } from './TemplatesGallery';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlignJustify } from 'lucide-react';

interface NoteEditorV2Props {
    initialContent: string;
    onUpdate: (content: string) => void;
    editable?: boolean;
    autoInsertSeparator?: boolean;
}

export const NoteEditorV2: React.FC<NoteEditorV2Props> = ({
    initialContent,
    onUpdate,
    editable = true,
    autoInsertSeparator = true
}) => {
    const [showDrawing, setShowDrawing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [pageRuling, setPageRuling] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            FontFamily,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
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
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-8 py-6 text-gray-700 leading-relaxed dir-rtl',
                dir: 'auto',
                style: 'min-height: 100%;' // Help click-anywhere behavior
            },
        },
    });

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

    const handleInsertDrawing = (imageSrc: string) => {
        editor?.chain().focus().setImage({ src: imageSrc }).run();
        setShowDrawing(false);
    };

    const handleSelectTemplate = (html: string) => {
        editor?.chain().focus().insertContent(html).run();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl overflow-hidden border border-white shadow-xl">
            {/* Toolbar Section */}
            <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-white/80 to-transparent flex items-start gap-2">
                <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                    <EditorToolbar
                        editor={editor}
                        onOpenDrawing={() => setShowDrawing(true)}
                        onOpenTemplates={() => setShowTemplates(true)}
                    />
                </div>

                {/* Page Ruling Toggle */}
                <button
                    onClick={() => setPageRuling(!pageRuling)}
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
                    style={pageRuling ? {
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                        backgroundAttachment: 'local',
                        lineHeight: '32px',
                        paddingTop: '4px' // Align typical line height
                    } : {}}
                >
                    <EditorContent editor={editor} className="min-h-full [&_.ProseMirror]:min-h-[400px]" />
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={showDrawing} onOpenChange={setShowDrawing}>
                <DialogContent className="max-w-4xl h-[80vh] p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
                    <DrawingCanvas onSave={handleInsertDrawing} onCancel={() => setShowDrawing(false)} />
                </DialogContent>
            </Dialog>

            <TemplatesGallery
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </div>
    );
};
