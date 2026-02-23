
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
    ZapOff,
    Briefcase,
    Heart,
    Users,
    Home,
    Image as ImageIcon
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
    noteCategory?: string | null;
    onCategoryChange?: (category: string | null) => void;
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
    onSearchClick,
    noteCategory: initialCategory,
    onCategoryChange,
}) => {
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [pageLayout, setPageLayout] = useState<'blank' | 'ruled' | 'dotted' | 'squared'>('blank');
    const [rulingSpacing, setRulingSpacing] = useState(32); // px between lines/dots
    const [noteCategory, setNoteCategory] = useState<string | null>(initialCategory || null);
    const [pageBackground, setPageBackground] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

    // Page settings
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [pageMargin, setPageMargin] = useState(20); // mm
    const [pageBorder, setPageBorder] = useState<'none' | 'simple' | 'double' | 'dashed' | 'thick' | 'dotted' | 'double-thick' | 'outlined'>('none');
    const [pageBorderColor, setPageBorderColor] = useState<string>('#6b7280');
    const [pageBorderWidth, setPageBorderWidth] = useState<number>(2);
    const [cornerRadius, setCornerRadius] = useState<number>(0);
    const [pageBgColor, setPageBgColor] = useState<string>('#ffffff');

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
                    setTimeout(() => {
                        const boxes = document.querySelectorAll('[data-type="textBox"]');
                        const lastBox = boxes[boxes.length - 1];
                        if (lastBox) lastBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
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
                title: 'صورة',
                description: 'إدراج صورة من جهازك',
                icon: <ImageIcon size={18} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const src = e.target?.result as string;
                                editor.chain().focus().setImage({ src }).run();
                            };
                            reader.readAsDataURL(file);
                        }
                    };
                    input.click();
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

                    // Create ~35 empty paragraphs to fill the A4 page
                    const fillParagraphs = Array(35).fill(0).map(() => ({ type: 'paragraph' }));

                    editor.chain()
                        .focus()
                        .insertContentAt(insertPos, {
                            type: 'page',
                            content: fillParagraphs
                        })
                        .run();

                    // Scroll the new page into center of view
                    setTimeout(() => {
                        const pages = document.querySelectorAll('.page-node-view');
                        const lastPage = pages[pages.length - 1];
                        if (lastPage) {
                            lastPage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 100);
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
        content: (() => {
            if (initialContent && initialContent !== '<p></p>') {
                if (initialContent.includes('data-type="page"')) {
                    return initialContent;
                }
                const fillPs = Array(35).fill('<p></p>').join('');
                return `<div data-type="page">${initialContent}${fillPs}</div>`;
            }
            // New empty note — fill with paragraphs
            const fillPs = Array(35).fill('<p></p>').join('');
            return `<div data-type="page">${fillPs}</div>`;
        })(),
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

    // Initialize state from document attributes on first load
    useEffect(() => {
        if (editor && !isSettingsLoaded && editor.state.doc.content.size > 0) {
            let foundAttributes = false;
            editor.state.doc.descendants((node) => {
                if (node.type.name === 'page' && !foundAttributes) {
                    const attrs = node.attrs;
                    if (attrs.layout) setPageLayout(attrs.layout as any);
                    if (attrs.rulingSpacing) setRulingSpacing(attrs.rulingSpacing);
                    if (attrs.pageBgColor) setPageBgColor(attrs.pageBgColor);
                    if (attrs.orientation) setOrientation(attrs.orientation as any);
                    if (attrs.margin) setPageMargin(attrs.margin);
                    if (attrs.border) setPageBorder(attrs.border as any);
                    if (attrs.borderColor) setPageBorderColor(attrs.borderColor);
                    if (attrs.borderWidth) setPageBorderWidth(attrs.borderWidth);
                    if (attrs.cornerRadius !== undefined) setCornerRadius(attrs.cornerRadius);
                    foundAttributes = true;
                    return false;
                }
                return true;
            });
            if (foundAttributes) setIsSettingsLoaded(true);
            else if (editor.state.doc.content.size > 0) setIsSettingsLoaded(true);
        }
    }, [editor, isSettingsLoaded]);

    // Sync zoom, ruling, orientation, margin to extension storage AND node attributes
    useEffect(() => {
        if (editor) {
            if ((editor.storage as any).textBox) {
                (editor.storage as any).textBox.zoom = zoom;
            }
            if ((editor.storage as any).page) {
                (editor.storage as any).page.zoom = zoom;
                (editor.storage as any).page.layout = pageLayout;
                (editor.storage as any).page.rulingSpacing = rulingSpacing;
                (editor.storage as any).page.background = pageBackground;
                (editor.storage as any).page.backgroundColor = backgroundColor;
                (editor.storage as any).page.orientation = orientation;
                (editor.storage as any).page.margin = pageMargin;
                (editor.storage as any).page.border = pageBorder;
                (editor.storage as any).page.borderColor = pageBorderColor;
                (editor.storage as any).page.borderWidth = pageBorderWidth;
                (editor.storage as any).page.cornerRadius = cornerRadius;
                (editor.storage as any).page.pageBgColor = pageBgColor;
            }

            // Only update node attributes if settings have been initially loaded (to prevent overwriting with defaults)
            if (isSettingsLoaded) {
                const { tr } = editor.state;
                let modified = false;
                editor.state.doc.descendants((node, pos) => {
                    if (node.type.name === 'page') {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            layout: pageLayout,
                            rulingSpacing: rulingSpacing,
                            pageBgColor: pageBgColor,
                            orientation: orientation,
                            margin: pageMargin,
                            border: pageBorder,
                            borderColor: pageBorderColor,
                            borderWidth: pageBorderWidth,
                            cornerRadius: cornerRadius,
                            _settingsVersion: Date.now(),
                        });
                        modified = true;
                    }
                    return true;
                });
                if (modified) {
                    editor.view.dispatch(tr);
                }
            }
        }
    }, [zoom, pageLayout, rulingSpacing, pageBackground, backgroundColor, orientation, pageMargin, pageBorder, pageBorderColor, pageBorderWidth, cornerRadius, pageBgColor, editor, isSettingsLoaded]);

    const calculateNextTextBoxPosition = () => {
        if (!editor) return { x: 80, y: 150 };

        const PAGE_WIDTH = orientation === 'portrait' ? 794 : 1123;
        const PAGE_HEIGHT = orientation === 'portrait' ? 1123 : 794;
        const MARGIN_PX = pageMargin * 3.78; // convert mm to px roughly

        const nodes: any[] = [];
        editor.state.doc.descendants((node) => {
            if (node.type.name === 'textBox' || node.type.name === 'trackerEmbed' || node.type.name === 'smartTemplateNode') {
                nodes.push(node.attrs);
            }
            return true;
        });

        const DEFAULT_WIDTH = 200;
        const DEFAULT_HEIGHT = 80;
        const GAP = 20;

        if (nodes.length === 0) {
            return { x: MARGIN_PX + 20, y: MARGIN_PX + 100 };
        }

        // Find bottom-most node
        const lastNode = [...nodes].sort((a, b) => (b.y + (b.height || DEFAULT_HEIGHT)) - (a.y + (a.height || DEFAULT_HEIGHT)))[0];

        let nextX = lastNode.x;
        let nextY = lastNode.y + (lastNode.height || DEFAULT_HEIGHT) + GAP;

        // Ensure within page bounds
        if (nextY + DEFAULT_HEIGHT > PAGE_HEIGHT - MARGIN_PX) {
            nextX = lastNode.x + (lastNode.width || DEFAULT_WIDTH) + GAP;
            nextY = MARGIN_PX + 100;

            // If right side exceeded, wrap to next column or start over with small offset
            if (nextX + DEFAULT_WIDTH > PAGE_WIDTH - MARGIN_PX) {
                nextX = MARGIN_PX + 20 + (nodes.length * 15) % 100;
                nextY = MARGIN_PX + 100 + (nodes.length * 15) % 100;
            }
        }

        // Final safety check to keep inside page
        nextX = Math.max(MARGIN_PX, Math.min(nextX, PAGE_WIDTH - DEFAULT_WIDTH - MARGIN_PX));
        nextY = Math.max(MARGIN_PX, Math.min(nextY, PAGE_HEIGHT - DEFAULT_HEIGHT - MARGIN_PX));

        return { x: nextX, y: nextY };
    };

    const handleZoomChange = (newZoom: number) => {
        setZoom(Math.max(50, Math.min(130, newZoom)));
    };

    // Helper: find insertion position - prefer cursor position, fallback to end of last page
    const getInsertPosInsidePage = (): number => {
        if (!editor) return 0;
        const { doc, selection } = editor.state;

        // First, try to use the current cursor position
        const cursorPos = selection.$anchor.pos;

        // Check if cursor is inside a page node
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

        if (isInsidePage) {
            // Insert at cursor position
            return cursorPos;
        }

        // Fallback: end of last page
        let lastPagePos = -1;
        let lastPageNode: any = null;
        doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                lastPagePos = pos;
                lastPageNode = node;
            }
            return true;
        });
        if (lastPagePos >= 0 && lastPageNode) {
            return lastPagePos + lastPageNode.nodeSize - 1;
        }
        // Fallback: end of document
        return doc.content.size;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY;
            handleZoomChange(zoom - delta * 0.5);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;

            switch (e.key) {
                case '=':
                case '+':
                    e.preventDefault();
                    handleZoomChange(zoom + 10);
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomChange(zoom - 10);
                    break;
                case '0':
                    e.preventDefault();
                    handleZoomChange(100);
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    // Content auto-saves on change, show toast
                    toast({ title: '✅ تم الحفظ تلقائياً' });
                    break;
                case 'f':
                case 'F':
                    if (!e.shiftKey) {
                        e.preventDefault();
                        setShowSearch(prev => !prev);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoom]);

    useEffect(() => {
        if (editor && initialContent && autoInsertSeparator) {
            const isNewNote = !initialContent || initialContent === '<p></p>';
            if (!isNewNote) { /* Logic to insert separator if needed */ }
        }
    }, [editor, initialContent, autoInsertSeparator]);

    useEffect(() => {
        if (editor && initialContent && initialContent !== editor.getHTML()) {
            if (initialContent === '<p></p>' && editor.isEmpty) return;
            if (initialContent.includes('data-type="page"')) {
                editor.commands.setContent(initialContent);
            } else {
                // Wrap in page — build fill paragraphs as HTML
                const fillPs = Array(35).fill('<p></p>').join('');
                const finalContent = `<div data-type="page">${initialContent}${fillPs}</div>`;
                editor.commands.setContent(finalContent);
            }
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
            setPageLayout('blank');
        } else {
            const insertPos = getInsertPosInsidePage();
            if (editor) {
                const pos = calculateNextTextBoxPosition();
                const insertPos = getInsertPosInsidePage();
                editor.chain().focus().insertContentAt(insertPos, {
                    type: 'smartTemplateNode',
                    attrs: {
                        html: content,
                        left: pos.x,
                        top: pos.y,
                        width: 400,
                        baseWidth: 400,
                        height: 200,
                        isFloating: true
                    }
                }).run();
            }
        }
    };

    const [showTrackerDialog, setShowTrackerDialog] = useState(false);

    const handleInsertTracker = () => {
        setShowTrackerDialog(true);
    };

    const handleTrackerSelect = (trackers: { id: string; label: string; type: string; color?: string; icon?: string }[], coords?: { x: number; y: number }) => {
        if (!editor || trackers.length === 0) return;
        const pos = calculateNextTextBoxPosition();
        trackers.forEach((tracker, index) => {
            const insertPos = getInsertPosInsidePage();
            editor.chain().focus().insertContentAt(insertPos, {
                type: 'trackerEmbed',
                attrs: {
                    trackers: [tracker],
                    x: pos.x + (index * 20),
                    y: pos.y + (index * 20),
                    displayMode: 'chip'
                }
            }).run();
        });
        // Scroll to the inserted element
        setTimeout(() => {
            const trackerEls = document.querySelectorAll('[data-type="trackerEmbed"]');
            const lastEl = trackerEls[trackerEls.length - 1];
            if (lastEl) lastEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
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

        // Create ~35 empty paragraphs to fill the A4 page
        const fillParagraphs = Array(35).fill(0).map(() => ({ type: 'paragraph' }));

        editor.chain()
            .focus()
            .insertContentAt(doc.content.size, {
                type: 'page',
                attrs: { pageNumber: pageCount + 1 },
                content: fillParagraphs
            })
            .run();

        // Scroll the new page into center of view
        setTimeout(() => {
            const pages = document.querySelectorAll('.page-node-view');
            const lastPage = pages[pages.length - 1];
            if (lastPage) lastPage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleExport = async (type: 'image' | 'pdf' | 'word' | 'html' | 'text') => {
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
                if (type === 'image') {
                    const pmElement = document.querySelector('.ProseMirror') as HTMLElement;
                    if (pmElement) {
                        const originalOverflow = pmElement.style.overflow;
                        const originalHeight = pmElement.style.height;

                        pmElement.style.overflow = 'visible';
                        pmElement.style.height = 'auto';

                        // @ts-ignore
                        const canvas = await html2canvas(pmElement, {
                            scale: 2,
                            backgroundColor: pageBackground ? null : backgroundColor,
                            useCORS: true,
                            windowWidth: pmElement.scrollWidth,
                            windowHeight: pmElement.scrollHeight,
                            y: pmElement.getBoundingClientRect().top + window.scrollY,
                        } as any);

                        pmElement.style.overflow = originalOverflow;
                        pmElement.style.height = originalHeight;

                        const link = document.createElement('a');
                        link.download = `Note-${Date.now()}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                        toast({ title: 'تم تصدير الصورة' });
                    }
                } else if (type === 'pdf') {
                    // Multi-page PDF Export
                    const pages = document.querySelectorAll('.page-node-view');
                    if (pages.length === 0) return;

                    const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();

                    for (let i = 0; i < pages.length; i++) {
                        const pageElement = (pages[i] as HTMLElement).firstElementChild as HTMLElement; // Target the inner div to avoid margins
                        if (!pageElement) continue;

                        // @ts-ignore
                        const canvas = await html2canvas(pageElement, {
                            scale: 2,
                            backgroundColor: pageBackground ? null : pageBgColor,
                            useCORS: true,
                        } as any);

                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = pdf.getImageProperties(imgData);

                        // Calculate dimensions to fit perfectly within A4 keeping aspect ratio
                        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
                        const finalWidth = imgProps.width * ratio;
                        const finalHeight = imgProps.height * ratio;

                        // Center horizontally and vertically
                        const imgX = (pdfWidth - finalWidth) / 2;
                        const imgY = (pdfHeight - finalHeight) / 2;

                        if (i > 0) {
                            pdf.addPage();
                        }

                        pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
                    }

                    pdf.save(`Note-${Date.now()}.pdf`);
                    toast({ title: 'تم تصدير ملف PDF' });
                }
            } else if (type === 'html' || type === 'word') {
                const htmlContent = editor.getHTML();

                let finalContent = htmlContent;
                let mimeType = 'text/html';
                let extension = 'html';

                if (type === 'word') {
                    let wordBody = '';
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
                    const pages = doc.querySelectorAll('div[data-type="page"]');

                    if (pages.length > 0) {
                        pages.forEach((page, index) => {
                            let borderStyle = pageBorder === 'none' ? 'none' : `${pageBorderWidth}px solid ${pageBorderColor}`;
                            wordBody += `<div style="padding: ${pageMargin}mm; background-color: ${pageBgColor}; border: ${borderStyle}; min-height: 297mm; border-radius: 8px;">`;
                            wordBody += page.innerHTML;
                            wordBody += `</div>`;
                            if (index < pages.length - 1) {
                                wordBody += `<br clear="all" style="page-break-before:always" />`;
                            }
                        });
                    } else {
                        wordBody = htmlContent;
                    }

                    finalContent = `
                        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                        <head>
                        <meta charset='utf-8'>
                        <title>Export</title>
                        <style>
                            body { font-family: 'Arial', 'Segoe UI', sans-serif; direction: rtl; }
                            p { margin: 0 0 10px 0; line-height: 1.6; }
                            table { border-collapse: collapse; width: 100%; }
                            td, th { border: 1px solid #ccc; padding: 8px; }
                        </style>
                        </head>
                        <body dir="rtl">
                        ${wordBody}
                        </body></html>
                    `;
                    mimeType = 'application/msword';
                    extension = 'doc';
                }

                const blob = new Blob([finalContent], { type: `${mimeType};charset=utf-8` });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Note-${Date.now()}.${extension}`;
                link.click();
                URL.revokeObjectURL(url);
                toast({ title: `تم التصدير كملف ${extension.toUpperCase()}` });
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'حدث خطأ أثناء التصدير', variant: 'destructive' });
        }
    };

    const CATEGORIES = [
        { id: 'distraction', label: 'تشتت', icon: ZapOff, color: 'text-red-500', bg: 'bg-red-50', activeBg: 'bg-red-500' },
        { id: 'work', label: 'عمل', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', activeBg: 'bg-blue-500' },
        { id: 'dawah', label: 'دعوة', icon: Heart, color: 'text-green-500', bg: 'bg-green-50', activeBg: 'bg-green-500' },
        { id: 'social', label: 'اجتماعي', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', activeBg: 'bg-purple-500' },
        { id: 'family', label: 'عائلة', icon: Home, color: 'text-orange-500', bg: 'bg-orange-50', activeBg: 'bg-orange-500' },
    ];

    const handleCategoryChange = (catId: string | null) => {
        setNoteCategory(catId);
        onCategoryChange?.(catId);
    };

    return (
        <div className="h-full w-full flex flex-col bg-slate-100 overflow-hidden" dir="rtl">
            {/* Top toolbar - onMouseDown preventDefault keeps text selection */}
            <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 shrink-0 z-[20] shadow-sm relative" onMouseDown={e => { if ((e.target as HTMLElement).closest('input, select, [role="slider"]')) return; e.preventDefault(); }}>
                {/* Category Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border outline-none",
                                !noteCategory
                                    ? "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    : (() => {
                                        const activeCat = CATEGORIES.find(c => c.id === noteCategory);
                                        return activeCat ? `${activeCat.activeBg} text-white border-transparent` : "";
                                    })()
                            )}
                        >
                            <span className="truncate max-w-[80px]">
                                {!noteCategory ? 'بدون تصنيف' : CATEGORIES.find(c => c.id === noteCategory)?.label || 'بدون تصنيف'}
                            </span>
                            {!noteCategory ? (
                                <FileText className="w-3.5 h-3.5" />
                            ) : (
                                (() => {
                                    const Icon = CATEGORIES.find(c => c.id === noteCategory)?.icon || FileText;
                                    return <Icon className="w-3.5 h-3.5" />;
                                })()
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="w-36 p-1.5 flex flex-col gap-1 z-[60]">
                        <button
                            onClick={() => handleCategoryChange(null)}
                            className={cn(
                                "flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition-all w-full text-right",
                                !noteCategory ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-100 text-gray-600"
                            )}
                        >
                            <span>بدون تصنيف</span>
                            <FileText className="w-3 h-3" />
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(noteCategory === cat.id ? null : cat.id)}
                                className={cn(
                                    "flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition-all w-full text-right",
                                    noteCategory === cat.id
                                        ? `${cat.activeBg} text-white`
                                        : `hover:${cat.bg} ${cat.color}`
                                )}
                            >
                                <span>{cat.label}</span>
                                <cat.icon className="w-3 h-3" />
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>

                <div className="w-px h-6 bg-gray-200 shrink-0" />

                <div className="flex-1 overflow-x-auto overflow-y-visible" style={{ scrollbarWidth: 'thin' }}>
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

                            {/* Page Background Color */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">لون خلفية الصفحة (الداخلي)</label>
                                <div className="flex bg-gray-50 p-1 rounded-md h-8 items-center justify-between">
                                    <input
                                        type="color"
                                        value={pageBgColor}
                                        onChange={(e) => setPageBgColor(e.target.value)}
                                        className="w-full h-full p-0 border-0 bg-transparent cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Page Layout */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">تخطيط الصفحة</label>
                                <div className="flex gap-1 bg-gray-50 p-1 rounded-md">
                                    {([
                                        { id: 'blank' as const, label: 'فارغ', icon: '☐' },
                                        { id: 'ruled' as const, label: 'مسطر', icon: '☰' },
                                        { id: 'dotted' as const, label: 'نقطي', icon: '⠿' },
                                        { id: 'squared' as const, label: 'شبكي', icon: '▦' },
                                    ]).map(lt => (
                                        <button
                                            key={lt.id}
                                            onClick={() => setPageLayout(lt.id)}
                                            className={cn(
                                                "flex-1 h-7 rounded text-[10px] flex items-center justify-center gap-0.5",
                                                pageLayout === lt.id ? "bg-white shadow-sm text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            <span className="text-sm">{lt.icon}</span>
                                            {lt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Spacing - only shown when layout is not blank */}
                            {pageLayout !== 'blank' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400">تباعد {pageLayout === 'ruled' ? 'السطور' : 'النقاط'} ({rulingSpacing}px)</label>
                                    <Slider
                                        value={[rulingSpacing]}
                                        min={16}
                                        max={64}
                                        step={2}
                                        onValueChange={([val]) => setRulingSpacing(val)}
                                    />
                                    <div className="flex gap-1 mt-1">
                                        {[{ label: 'ضيق', val: 20 }, { label: 'عادي', val: 32 }, { label: 'واسع', val: 48 }].map(p => (
                                            <button
                                                key={p.val}
                                                onClick={() => setRulingSpacing(p.val)}
                                                className={cn(
                                                    "flex-1 h-6 text-[10px] rounded",
                                                    rulingSpacing === p.val ? "bg-indigo-50 text-indigo-600 font-bold" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Border Style */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">نمط إطار الصفحة</label>
                                <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                        {([
                                            { id: 'none' as const, label: 'بدون', preview: 'border-transparent' },
                                            { id: 'simple' as const, label: 'بسيط', preview: 'border-gray-400' },
                                            { id: 'double' as const, label: 'مزدوج', preview: 'border-gray-500 border-double' },
                                            { id: 'dashed' as const, label: 'متقطع', preview: 'border-gray-400 border-dashed' },
                                            { id: 'dotted' as const, label: 'منقط', preview: 'border-gray-400 border-dotted' },
                                            { id: 'thick' as const, label: 'سميك', preview: 'border-gray-600 border-[3px]' },
                                            { id: 'double-thick' as const, label: 'مزدوج سميك', preview: 'border-gray-700 border-double border-[4px]' },
                                            { id: 'outlined' as const, label: 'محدد', preview: 'border-gray-600 border-solid border-[2px] outline outline-1 outline-gray-400 outline-offset-1' },
                                        ]).map(b => (
                                            <button key={b.id} onClick={() => setPageBorder(b.id as any)} className={cn("h-10 rounded flex flex-col items-center justify-center gap-0.5 transition-all text-gray-700 font-medium", pageBorder === b.id ? "bg-indigo-50 ring-2 ring-indigo-300" : "bg-gray-50 hover:bg-gray-100")}>
                                                <div className={cn("w-4 h-5 rounded-sm border-2", b.preview)} />
                                                <span className="text-[8px] whitespace-nowrap overflow-hidden text-ellipsis w-full text-center px-0.5">{b.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Border Radius */}
                            {pageBorder !== 'none' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400">زاوية الإطار ({cornerRadius}px)</label>
                                    <Slider
                                        value={[cornerRadius]}
                                        min={0}
                                        max={64}
                                        step={2}
                                        onValueChange={([val]) => setCornerRadius(val)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Border Color & Width */}
                        {pageBorder !== 'none' && (
                            <div className="flex gap-2">
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] text-gray-400">لون الإطار</label>
                                    <div className="flex bg-gray-50 p-1 rounded-md h-8 items-center justify-between">
                                        <input
                                            type="color"
                                            value={pageBorderColor}
                                            onChange={(e) => setPageBorderColor(e.target.value)}
                                            className="w-full h-full p-0 border-0 bg-transparent cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] text-gray-400">سماكة الإطار (px)</label>
                                    <div className="flex gap-1 h-8">
                                        {[1, 2, 4, 8].map(w => (
                                            <button
                                                key={w}
                                                onClick={() => setPageBorderWidth(w)}
                                                className={cn(
                                                    "flex-1 rounded text-[10px] flex items-center justify-center border",
                                                    pageBorderWidth === w ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                                )}
                                            >
                                                {w}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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
            )
            }

            {/* Main editor area — scrollable pages */}
            <div
                ref={editorRef}
                className="flex-1 overflow-auto"
                style={{ backgroundColor: isMobile ? '#ffffff' : (backgroundColor || '#f1f5f9') }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onWheel={handleWheel}
            >
                <div className={cn("flex-1 flex flex-col items-center gap-0 relative min-h-full", isMobile ? "py-0" : "py-8")}>
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
        </div >
    );
};
