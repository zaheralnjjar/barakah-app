
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
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
    X,
    FileDown,
    RotateCcw,
    Settings2,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

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
    onBackgroundColorChange?: (color: string) => void;
    folderId?: string | null;
    onFolderChange?: (id: string | null) => void;
    folders?: any[];
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
    const [zoom, setZoom] = useState(100);
    const [pageRuling, setPageRuling] = useState(false);
    const [pageBackground, setPageBackground] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Page settings
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [pageMargin, setPageMargin] = useState(20); // mm

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
                description: 'مهمة قابلة للتحديد',
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
                description: 'نص عائم يمكن تحريكه',
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
                description: 'إدراج تخطيط جاهز',
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
                    const { doc } = editor.state;
                    const insertPos = doc.content.size;
                    editor.chain()
                        .focus()
                        .insertContentAt(insertPos, { type: 'page', content: [{ type: 'paragraph' }] })
                        .run();
                },
            },
            {
                title: 'ملصق (Sticker)',
                description: 'ملصقات تحفيزية وإسلامية',
                icon: <Palette size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
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
        content: initialContent || '<div data-type="page"><p></p></div>',
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

    // Sync zoom, ruling, orientation, margin to extension storage
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
                (editor.storage as any).page.orientation = orientation;
                (editor.storage as any).page.margin = pageMargin;
            }
            // Force re-render of page nodes when settings change
            editor.view.dispatch(editor.view.state.tr);
        }
    }, [zoom, pageRuling, pageBackground, backgroundColor, orientation, pageMargin, editor]);

    const calculateNextTextBoxPosition = () => {
        if (!editor) return { x: 50, y: 150 };
        const nodes: any[] = [];
        editor.state.doc.descendants((node) => {
            if (node.type.name === 'textBox') {
                nodes.push(node.attrs);
            }
            return true;
        });
        const MARGIN = 40;
        const BOX_WIDTH = 400;
        const ROW_HEIGHT = 300;
        const EDITOR_HEIGHT = 800;

        if (nodes.length === 0) {
            return { x: MARGIN, y: EDITOR_HEIGHT - ROW_HEIGHT - MARGIN };
        }
        nodes.sort((a, b) => b.y - a.y || a.x - b.x);
        const lastNode = nodes[0];
        let nextX = lastNode.x + lastNode.width + MARGIN;
        let nextY = lastNode.y;
        if (nextX + BOX_WIDTH > 1000) {
            nextX = MARGIN;
            nextY = lastNode.y - ROW_HEIGHT - MARGIN;
        }
        return { x: nextX, y: Math.max(0, nextY) };
    };

    const handleZoomChange = (newZoom: number) => {
        setZoom(Math.max(50, Math.min(130, newZoom)));
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY;
            handleZoomChange(zoom - delta * 0.5);
        }
    };

    useEffect(() => {
        if (editor && initialContent && autoInsertSeparator) {
            const isNewNote = !initialContent || initialContent === '<p></p>';
            if (!isNewNote) { /* Logic to insert separator if needed */ }
        }
    }, [editor, initialContent, autoInsertSeparator]);

    useEffect(() => {
        if (editor && initialContent && initialContent !== editor.getHTML()) {
            if (initialContent === '<p></p>' && editor.isEmpty) return;
            const finalContent = initialContent.includes('data-type="page"')
                ? initialContent
                : `<div data-type="page">${initialContent}</div>`;
            editor.commands.setContent(finalContent);
        }
    }, [initialContent, editor]);

    useEffect(() => {
        if (editor && voiceTranscript) {
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

    const handleAddPage = () => {
        if (!editor) return;
        const { doc } = editor.state;
        // Count existing pages to set page number
        let pageCount = 0;
        doc.descendants((node) => {
            if (node.type.name === 'page') pageCount++;
            return true;
        });

        editor.chain()
            .focus()
            .insertContentAt(doc.content.size, {
                type: 'page',
                attrs: { pageNumber: pageCount + 1 },
                content: [{ type: 'paragraph' }]
            })
            .run();
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
            } else if (type === 'pdf' || type === 'image') {
                const element = editorRef.current;
                if (element) {
                    // @ts-ignore
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        backgroundColor: pageBackground ? null : backgroundColor,
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
                        const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 overflow-hidden">
            {/* Top toolbar */}
            <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-start gap-2 shrink-0 z-10 shadow-sm">
                <div className="flex-1 overflow-x-auto barakah-scrollbar pb-1">
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
                        isFocusMode={true}
                        onToggleFocusMode={() => { /* always full screen */ }}
                        onInsertTracker={handleInsertTracker}
                        zoom={zoom}
                        onZoomChange={handleZoomChange}
                        onClose={onClose}
                        onSearchClick={() => setShowSearch(!showSearch)}
                    />
                </div>

                {/* Page settings popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0 mt-0.5" title="إعدادات الصفحة">
                            <Settings2 size={16} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="end" dir="rtl" sideOffset={8}>
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-gray-700">إعدادات الصفحة</h4>

                            {/* Orientation */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">اتجاه الصفحة</label>
                                <div className="flex gap-1 bg-gray-50 p-1 rounded-md">
                                    <button
                                        onClick={() => setOrientation('portrait')}
                                        className={cn(
                                            "flex-1 h-8 rounded text-xs flex items-center justify-center gap-1",
                                            orientation === 'portrait' ? "bg-white shadow-sm text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="w-3 h-4 border border-current rounded-sm" />
                                        طولي
                                    </button>
                                    <button
                                        onClick={() => setOrientation('landscape')}
                                        className={cn(
                                            "flex-1 h-8 rounded text-xs flex items-center justify-center gap-1",
                                            orientation === 'landscape' ? "bg-white shadow-sm text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="w-4 h-3 border border-current rounded-sm" />
                                        عرضي
                                    </button>
                                </div>
                            </div>

                            {/* Margins */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">هوامش الصفحة ({pageMargin} ملم)</label>
                                <Slider
                                    value={[pageMargin]}
                                    min={5}
                                    max={40}
                                    step={1}
                                    onValueChange={([val]) => setPageMargin(val)}
                                />
                                <div className="flex gap-1 mt-1">
                                    {[{ label: 'ضيق', val: 10 }, { label: 'عادي', val: 20 }, { label: 'واسع', val: 30 }].map(p => (
                                        <button
                                            key={p.val}
                                            onClick={() => setPageMargin(p.val)}
                                            className={cn(
                                                "flex-1 h-6 text-[10px] rounded",
                                                pageMargin === p.val ? "bg-indigo-50 text-indigo-600 font-bold" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ruling */}
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] text-gray-400">خطوط مسطرة</label>
                                <button
                                    onClick={() => setPageRuling(!pageRuling)}
                                    className={cn(
                                        "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                                        pageRuling ? "bg-indigo-500 justify-end" : "bg-gray-300 justify-start"
                                    )}
                                >
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Search and Replace Bar */}
            {showSearch && (
                <div className="bg-white border-b border-gray-100 p-2 flex flex-wrap items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200 z-[105]">
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

            {/* Main editor area — scrollable pages */}
            <div
                ref={editorRef}
                className="flex-1 overflow-auto bg-slate-100"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onWheel={handleWheel}
            >
                <div className="flex flex-col items-center py-8 gap-0 relative min-h-full">
                    <EditorContent editor={editor} className="relative z-0 w-full" />

                    {/* Add Page button below all pages */}
                    <button
                        onClick={handleAddPage}
                        className="mt-6 mb-12 flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all text-sm font-medium shadow-sm"
                    >
                        <FilePlus size={16} />
                        إضافة صفحة جديدة
                    </button>
                </div>
            </div>

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
