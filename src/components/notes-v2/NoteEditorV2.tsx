
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
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { EditorToolbar } from './EditorToolbar';
import { SlashCommand, renderItems } from './extensions/SlashCommand';
import { StickerExtension } from './extensions/StickerExtension';
import { NoteLinkExtension } from './extensions/NoteLinkExtension';
import { TemplatesGallery } from './TemplatesGallery';
import {
    Bookmark,
    Activity,
    Square,
    Maximize,
    Minimize,
    ZoomIn,
    ZoomOut,
    Search,
    FilePlus,
    ArrowRight,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    LayoutTemplate,
    Palette,
    FileText,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartTemplateNode } from './extensions/SmartTemplateNode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateGenericWord } from '@/utils/wordGenerator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

import { TrackerEmbed } from './extensions/TrackerEmbed';
import { TextBoxExtension } from './extensions/TextBoxExtension';
import { PageExtension } from './extensions/PageExtension';
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
    onClose?: () => void;
    onSearchClick?: () => void;
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
    isMobile = false,
    onClose,
    onSearchClick
}) => {
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [editorWidth, setEditorWidth] = useState<number | string>('100%');
    const [zoom, setZoom] = useState(100); // Zoom percentage (50-130)
    const [pageRuling, setPageRuling] = useState(false);
    const [pageBackground, setPageBackground] = useState<string | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(true); // Default to full screen
    const [editorHeight, setEditorHeight] = useState(600);
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const getSuggestionItems = ({ query }: { query: string }) => {
        return [
            {
                title: 'عنوان رئيسي',
                description: 'أكبر حجم للعنوان (H1)',
                icon: <Heading1 size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: 'عنوان فرعي',
                description: 'عنوان متوسط الحجم (H2)',
                icon: <Heading2 size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: 'قائمة مهام',
                description: 'مهمة قابلة للتحديد (الربط بالمهام)',
                icon: <CheckSquare size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
            },
            {
                title: 'قائمة نقطية',
                description: 'قائمة تعداد بسيطة',
                icon: <List size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'قائمة رقمية',
                description: 'قائمة مرقمة تصاعدياً',
                icon: <ListOrdered size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'مربع نص',
                description: 'نص عائم يمكن تحريكه (Textbox)',
                icon: <Square size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).insertTextBox().run();
                },
            },
            {
                title: 'متتبع (Tracker)',
                description: 'إدراج متتبع للنشاط اليومي',
                icon: <Activity size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    handleInsertTracker();
                },
            },
            {
                title: 'قالب جاهز',
                description: 'إدراج تخطيط جاهز للبركة',
                icon: <LayoutTemplate size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    setShowTemplates(true);
                },
            },
            {
                title: 'صفحة جديدة',
                description: 'إضافة صفحة A4 إضافية',
                icon: <FilePlus size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    const { selection, doc } = editor.state;
                    const currentPos = selection.$from.pos;
                    let insertPos = doc.content.size;

                    // Find the end of the current 'page' node
                    doc.descendants((node, pos) => {
                        if (node.type.name === 'page' && pos <= currentPos && pos + node.nodeSize > currentPos) {
                            insertPos = pos + node.nodeSize;
                            return false;
                        }
                        return true;
                    });

                    editor.chain()
                        .focus()
                        .insertContentAt(insertPos, { type: 'page', content: [] })
                        .run();
                },
            },
            {
                title: 'ملصق (Sticker)',
                description: 'ملصقات تحفيزية وإسلامية',
                icon: <Palette size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    // Insert a default sticker for demo
                    editor.commands.insertContent({
                        type: 'sticker',
                        attrs: {
                            src: 'https://cdn-icons-png.flaticon.com/512/4359/4359942.png',
                            x: 200, y: 200
                        }
                    });
                },
            }
        ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
    };

    const getNoteSuggestionItems = ({ query }: { query: string }) => {
        // Mock data for notes/files
        return [
            { title: 'ملاحظة: خطة رمضان', icon: <FileText size={16} />, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertContent('[[خطة رمضان]]').run() },
            { title: 'ملف: أذكار الصباح', icon: <Bookmark size={16} />, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertContent('[[أذكار الصباح]]').run() },
        ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
    };

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
            TextBoxExtension.configure({
                draggable: true,
            }),
            PageExtension,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            SlashCommand.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: renderItems,
                },
            }),
            NoteLinkExtension.configure({
                suggestion: {
                    char: '@',
                    items: getNoteSuggestionItems,
                    render: renderItems,
                }
            }),
            StickerExtension,
            SmartTemplateNode,
        ],
        content: initialContent || '<div data-type="page"></div>',
        editable,
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());

            // Basic Auto-Pagination logic: If content is getting very long and doesn't end with a page
            const { selection } = editor.state;
            const pos = selection.$to.pos;
            const docSize = editor.state.doc.content.size;

            if (pos > docSize - 10 && docSize > 2000) {
                // If we are near the end and doc is large, maybe suggest/auto-add a page if needed
                // But for now, we leave it manual via Slash Command to avoid flickering
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-4 md:px-8 md:py-6 text-gray-700 leading-relaxed dir-rtl',
                dir: 'auto'
            },
        },
    });

    // Sync zoom and ruling to extension storage
    useEffect(() => {
        if (editor) {
            if ((editor.storage as any).textBox) {
                (editor.storage as any).textBox.zoom = zoom;
            }
            if ((editor.storage as any).page) {
                (editor.storage as any).page.zoom = zoom;
                (editor.storage as any).page.ruling = pageRuling;
                (editor.storage as any).page.background = pageBackground;
                (editor.storage as any).page.backgroundColor = backgroundColor;
            }
        }
    }, [zoom, pageRuling, pageBackground, backgroundColor, editor]);

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
            if (initialContent === '<p></p>' && editor.isEmpty) return;

            // Ensure content has at least one page
            const finalContent = initialContent.includes('data-type="page"')
                ? initialContent
                : `<div data-type="page">${initialContent}</div>`;

            editor.commands.setContent(finalContent);
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
        // Adjust for zoom and scroll
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
            const { x, y } = coords || calculateNextTextBoxPosition();
            editor.chain().focus().insertContentAt(editor.state.doc.content.size, {
                type: 'smartTemplateNode',
                attrs: {
                    html: content,
                    left: x,
                    top: y,
                    isFloating: true
                }
            }).run();
        }
    };

    const [showTrackerDialog, setShowTrackerDialog] = useState(false);

    const handleInsertTracker = () => {
        setShowTrackerDialog(true);
    };

    const handleTrackerSelect = (trackers: { id: string; label: string; type: string; color?: string; icon?: string }[], coords?: { x: number; y: number }) => {
        if (!editor || trackers.length === 0) return;

        trackers.forEach((tracker, index) => {
            const { x, y } = coords || calculateNextTextBoxPosition();
            // Slightly offset each tracker if multiple are added at once
            const offsetX = coords ? x : x + (index * 20);
            const offsetY = coords ? y : y + (index * 20);

            editor.chain().focus().insertContentAt(editor.state.doc.content.size, {
                type: 'trackerEmbed',
                attrs: {
                    trackers: [tracker],
                    x: offsetX,
                    y: offsetY,
                    displayMode: 'chip'
                }
            }).run();
        });
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
            "flex flex-col overflow-hidden transition-all duration-300 w-full h-full",
            isFocusMode ? "fixed inset-0 z-[100] bg-white p-4 md:p-8" : "bg-white"
        )}
        >
            {/* Removed Focus Mode Background */}
            {/* Toolbar Section - Top Position */}
            {toolbarPosition === 'top' && (
                <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-white/80 to-transparent flex items-start gap-2 shrink-0 z-10">
                    <div className="flex-1 overflow-x-auto barakah-scrollbar pb-2">
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
                            onClose={onClose}
                            onSearchClick={() => setShowSearch(!showSearch)}
                        />
                    </div>
                </div>
            )}

            {/* Main Editor Area */}
            <div
                className={cn(
                    "flex-1 relative overflow-auto barakah-scrollbar bg-slate-50",
                    isFocusMode && "bg-white overflow-y-auto"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onWheel={handleWheel}
            >
                {/* Vertical Scroll for Pages */}
                <div className="flex flex-col items-center py-12 gap-12 relative min-h-full">
                    <EditorContent editor={editor} className="relative z-0" />
                </div>
            </div>

            {/* Search and Replace Bar */}
            {showSearch && (
                <div className="sticky top-[52px] left-0 right-0 z-[105] bg-white/95 backdrop-blur-sm border-b border-indigo-50 p-2 flex flex-wrap items-center gap-2 shadow-sm animate-in slide-in-from-top duration-300">
                    <div className="relative flex-grow max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                            placeholder="بحث عن..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-xs bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-200"
                        />
                    </div>
                    <Input
                        placeholder="استبدال بـ..."
                        value={replaceTerm}
                        onChange={(e) => setReplaceTerm(e.target.value)}
                        className="h-8 text-xs max-w-[150px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-200"
                    />
                    <div className="flex items-center gap-1">
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                                // Basic logic: find and replace first instance
                                if (editor && searchTerm) {
                                    const content = editor.getHTML();
                                    const newContent = content.replace(searchTerm, replaceTerm);
                                    editor.commands.setContent(newContent);
                                }
                            }}
                        >
                            استبدال
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400"
                            onClick={() => setShowSearch(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Toolbar Section - Bottom Position (Sticky) */}
            {toolbarPosition === 'bottom' && (
                <div className="px-2 py-2 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0 z-20 sticky bottom-0 safe-area-bottom">
                    <div className="flex-1 overflow-x-auto barakah-scrollbar no-scrollbar">
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
