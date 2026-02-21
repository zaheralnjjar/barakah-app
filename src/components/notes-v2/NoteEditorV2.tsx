
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { ResizableBox } from 'react-resizable';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import TiptapHighlight from '@tiptap/extension-highlight';
import { EditorToolbar } from './EditorToolbar';
import { TemplatesGallery } from './TemplatesGallery';
import { Bookmark } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateGenericWord } from '@/utils/wordGenerator';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

import { TrackerEmbed } from './extensions/TrackerEmbed';
import { TextBoxExtension } from './extensions/TextBoxExtension';
import { TrackerSelectionDialog } from './TrackerSelectionDialog';

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
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, '').replace('px', ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}px !important`,
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
    backgroundColor?: string;
    // New Props for Layout Integration
    onBackgroundColorChange?: (color: string) => void;
    folderId?: string | null;
    onFolderChange?: (id: string | null) => void;
    folders?: any[];
    // Voice Recording Integration
    isRecording?: boolean;
    onRecordingClick?: () => void;
    voiceTranscript?: string;
    toolbarPosition?: 'top' | 'bottom';
    isMobile?: boolean;
}

export const NoteEditorV2: React.FC<NoteEditorV2Props> = ({
    initialContent,
    onUpdate,
    editable = true,
    autoInsertSeparator = true,
    isBookmarked = false,
    onToggleBookmark,
    backgroundColor = '#ffffff',
    onBackgroundColorChange,
    folderId,
    onFolderChange,
    folders,
    isRecording,
    onRecordingClick,
    voiceTranscript,
    toolbarPosition = 'top',
    isMobile = false
}) => {
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [editorWidth, setEditorWidth] = useState<number | string>('100%');
    const [zoom, setZoom] = useState(100); // Zoom percentage (50-130)
    const [pageRuling, setPageRuling] = useState(false);
    const [pageBackground, setPageBackground] = useState<string | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [editorHeight, setEditorHeight] = useState(600);

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
            TrackerEmbed,
            TextBoxExtension,
        ],
        content: initialContent || '',
        editable,
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-4 md:px-8 md:py-6 text-gray-700 leading-relaxed dir-rtl',
                dir: 'auto'
            },
        },
    });

    // Sync zoom to extension storage
    useEffect(() => {
        if (editor && (editor.storage as any).textBox) {
            (editor.storage as any).textBox.zoom = zoom;
        }
    }, [zoom, editor]);

    // Helper to calculate position for new text boxes (Bottom-Up Stacking)
    const calculateNextTextBoxPosition = () => {
        if (!editor) return { x: 50, y: 150 };

        const nodes: any[] = [];
        editor.state.doc.descendants((node) => {
            if (node.type.name === 'textBox') {
                nodes.push(node.attrs);
            }
            return true;
        });

        // Current editor height (estimation or fixed limit)
        const EDITOR_HEIGHT = 800; // Standard view area
        const ROW_HEIGHT = 300;
        const BOX_WIDTH = 400;
        const MARGIN = 40;

        if (nodes.length === 0) {
            return { x: MARGIN, y: EDITOR_HEIGHT - ROW_HEIGHT - MARGIN };
        }

        // Sort by Y (descending) then X (ascending)
        nodes.sort((a, b) => b.y - a.y || a.x - b.x);

        const lastNode = nodes[0];
        let nextX = lastNode.x + lastNode.width + MARGIN;
        let nextY = lastNode.y;

        // If it exceeds width, move up a row
        if (nextX + BOX_WIDTH > 1000) { // Assume 1000px max width for stacking
            nextX = MARGIN;
            nextY = lastNode.y - ROW_HEIGHT - MARGIN;
        }

        return { x: nextX, y: Math.max(0, nextY) };
    };

    const handleZoomChange = (newZoom: number) => {
        setZoom(Math.max(50, Math.min(130, newZoom)));
    };

    // Handle trackpad pinch (ctrl + wheel)
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY;
            handleZoomChange(zoom - delta * 0.5);
        }
    };

    // Update width on isMobile change
    useEffect(() => {
        if (isMobile) {
            setEditorWidth(window.innerWidth - 32);
        } else {
            setEditorWidth('70%'); // Keep it as a percentage for desktop
        }
    }, [isMobile]);



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
        if (editor && initialContent && initialContent !== editor.getHTML()) {
            // Only update if content is actually different to avoid cursor jumps
            // Check if both are empty to avoid loops
            if (initialContent === '<p></p>' && editor.isEmpty) return;

            // Compare text content to avoid HTML attribute shuffle loops if possible, 
            // but for now just exact match check is improved by checking isEmpty
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    // Insert voice transcript at current position
    useEffect(() => {
        if (editor && voiceTranscript) {
            // Check if we should insert into a text box if we want EVERYTHING in text boxes?
            // The user only specified heart/templates/trackers.
            editor.commands.insertContent(voiceTranscript + ' ');
        }
    }, [voiceTranscript, editor]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (zoom / 100);
        const y = (e.clientY - rect.top) / (zoom / 100);

        const data = e.dataTransfer.getData('application/x-barakah-item');
        if (data && editor) {
            const item = JSON.parse(data);
            if (item.type === 'template') {
                handleSelectTemplate(item.content, 'text', { x, y });
            } else if (item.type === 'tracker') {
                handleTrackerSelect(item.trackers, { x, y });
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleSelectTemplate = (content: string, type: 'text' | 'background' = 'text', coords?: { x: number; y: number }) => {
        if (!editor) return;
        if (type === 'background') {
            setPageBackground(content);
            setPageRuling(false);
        } else {
            // Auto-wrap template in a text box
            const { x, y } = coords || calculateNextTextBoxPosition();
            (editor as any).chain().focus().insertTextBox({
                content,
                x,
                y,
                width: 400,
                height: 560 // A4 vertical aspect (roughly 1:1.4)
            }).run();
        }
    };

    const [showTrackerDialog, setShowTrackerDialog] = useState(false);

    const handleInsertTracker = () => {
        setShowTrackerDialog(true);
    };

    const handleTrackerSelect = (trackers: { id: string; label: string; type: string; color?: string; icon?: string }[], coords?: { x: number; y: number }) => {
        if (!editor || trackers.length === 0) return;

        // Auto-wrap tracker in a text box
        const { x, y } = coords || calculateNextTextBoxPosition();
        (editor as any).chain().focus().insertTextBox({
            x,
            y,
            width: 400,
            height: 560, // A4 vertical aspect
            content: [
                {
                    type: 'trackerEmbed',
                    attrs: {
                        trackers: trackers
                    }
                }
            ]
        }).run();
    };



    const handleExport = async (type: 'image' | 'pdf' | 'word' | 'text') => {
        if (!editor) return;

        try {
            if (type === 'text') {
                const text = editor.getText();
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Note-${Date.now()}.txt`;
                link.click();
                URL.revokeObjectURL(url);
                toast({ title: 'تم تصدير الملف النصي' });
            } else if (type === 'word') {
                const json = editor.getJSON();
                // ... (word logic)
            } else if (type === 'pdf' || type === 'image') {
                const element = editorRef.current;
                if (element) {
                    // Use actual background color for export
                    // Use pageBackground (image) if set, otherwise prop backgroundColor
                    let exportBg = backgroundColor;
                    if (pageBackground && !pageBackground.startsWith('{')) {
                        // If it's a simple color string in pageBackground? 
                        // Actually pageBackground usually stores image URL/gradient.
                        // If pageBackground is set, html2canvas should capture the background image/style naturally from the element style.
                        // But we also need to tell html2canvas the 'backgroundColor' option.
                        // If transparent, it defaults to black in some versions or white.
                        // If we pass null, it uses transparent.
                        exportBg = '#ffffff'; // Default to white if complex background to verify
                    }

                    // @ts-ignore
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        backgroundColor: pageBackground ? null : backgroundColor, // Use transparent if bg image exists, else color
                        useCORS: true
                    } as any);

                    if (type === 'image') {
                        const link = document.createElement('a');
                        link.download = `Note-${Date.now()}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                        toast({ title: 'تم تصدير الصورة' });
                    } else {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        pdf.save(`Note-${Date.now()}.pdf`);
                        toast({ title: 'تم تصدير ملف PDF' });
                    }
                }
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'حدث خطأ أثناء التصدير', variant: 'destructive' });
        }
    };

    return (
        <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-500",
            isFocusMode
                ? "fixed inset-0 z-[100] h-[100dvh] w-[100dvw] rounded-none bg-white p-4 md:p-8"
                : "h-full rounded-2xl bg-white/90 border border-indigo-50/50 shadow-sm",
            !isMobile && !isFocusMode && "mx-auto" // Center on Desktop when not in focus
        )}
            style={{ width: isFocusMode ? '100%' : (isMobile ? '100%' : `${editorWidth}`) }}
        >
            {/* Removed Focus Mode Background */}
            {/* Toolbar Section - Top Position */}
            {toolbarPosition === 'top' && (
                <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-white/80 to-transparent flex items-start gap-2 shrink-0 z-10">
                    <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                        <EditorToolbar
                            editor={editor}
                            onExport={handleExport}
                            onOpenTemplates={() => setShowTemplates(true)}
                            folderId={folderId}
                            onFolderChange={onFolderChange}
                            folders={folders}
                            backgroundColor={backgroundColor}
                            onBackgroundColorChange={onBackgroundColorChange}
                            isRecording={isRecording}
                            onRecordingClick={onRecordingClick}
                            isFocusMode={isFocusMode}
                            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                            onInsertTracker={handleInsertTracker}
                            zoom={zoom}
                            onZoomChange={handleZoomChange}
                        />
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div
                ref={editorRef}
                className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 flex flex-col items-center py-8 gap-8"
                onWheel={handleWheel}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={(e) => {
                    if (e.target === e.currentTarget && editor) {
                        editor.chain().focus('end').run();
                    }
                }}
            >
                {/* Pages container */}
                <div className="w-full flex justify-center">
                    <div
                        className={cn(
                            "bg-white shadow-md border border-gray-200 transition-all duration-300 origin-top flex flex-col",
                            pageRuling ? 'ruled-paper' : '',
                            // A4 Aspect Ratio styling
                            "w-[210mm] min-h-[297mm] max-w-[calc(100vw-2rem)]",
                            isFocusMode ? "ring-1 ring-black/5" : ""
                        )}
                        style={(() => {
                            const baseStyle: React.CSSProperties = {
                                transform: `scale(${zoom / 100})`,
                                padding: '20mm', // standard A4 margins
                            };

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
                                }

                                return {
                                    ...baseStyle,
                                    backgroundImage: bgImage,
                                    backgroundSize: bgSize,
                                    backgroundAttachment: 'local',
                                    backgroundRepeat: bgRepeat,
                                };
                            } else if (pageRuling) {
                                return {
                                    ...baseStyle,
                                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                                    backgroundAttachment: 'local',
                                    lineHeight: '32px',
                                    paddingTop: '4px',
                                };
                            }
                            // Default: Use backgroundColor prop if no specific page background/ruling
                            return {
                                ...baseStyle,
                                backgroundColor: backgroundColor,
                            };
                        })()}
                    >
                        <EditorContent
                            editor={editor}
                            className="flex-grow [&_.ProseMirror]:min-h-full [&_.ProseMirror]:relative [&_.ProseMirror]:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar Section - Bottom Position (Sticky) */}
            {toolbarPosition === 'bottom' && (
                <div className="px-2 py-2 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0 z-20 sticky bottom-0 safe-area-bottom">
                    <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar">
                        <EditorToolbar
                            editor={editor}
                            onExport={handleExport}
                            onOpenTemplates={() => setShowTemplates(true)}
                            folderId={folderId}
                            onFolderChange={onFolderChange}
                            folders={folders}
                            backgroundColor={backgroundColor}
                            onBackgroundColorChange={onBackgroundColorChange}
                            isRecording={isRecording}
                            onRecordingClick={onRecordingClick}
                            onInsertTracker={handleInsertTracker}
                        />
                    </div>
                </div>
            )}

            <TemplatesGallery
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelectTemplate={handleSelectTemplate}
            />



            <TrackerSelectionDialog
                isOpen={showTrackerDialog}
                onClose={() => setShowTrackerDialog(false)}
                onSelect={handleTrackerSelect}
            />
        </div>
    );
};
