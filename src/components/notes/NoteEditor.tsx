import React, { useState, useRef, useEffect } from 'react';
import {
    List, ListOrdered, Save, X,
    Minus, Palette, Calendar, Trash2, Highlighter, Type, Baseline, AlignJustify, ChevronDown, Menu, AlignRight, AlignCenter, AlignLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Bucket } from '@/hooks/useBuckets'; // Ensure this import exists or is added

interface NoteEditorProps {
    initialTitle?: string;
    initialContent?: string;
    initialTags?: string[];
    initialBucket?: string;
    buckets?: Bucket[];
    isEditing?: boolean;
    onSave: (title: string, content: string, tags: string[], bucket: string) => void;
    onDelete?: () => void;
    onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
    initialTitle = '',
    initialContent = '',
    initialTags = [],
    initialBucket = 'inbox',
    buckets = [],
    isEditing = false,
    onSave,
    onDelete,
    onCancel,
}) => {
    const { toast } = useToast();
    const [title, setTitle] = useState(initialTitle);
    const [bucket, setBucket] = useState(initialBucket);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [tags, setTags] = useState<string[]>(initialTags);
    const [newTag, setNewTag] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const [fontSize, setFontSize] = useState('3'); // 1-7 scale default is 3
    const [isLined, setIsLined] = useState(false); // Lined paper mode

    useEffect(() => {
        if (editorRef.current) {
            // Set initial content
            // If it looks like HTML, set it directly. If plain text, wrap in div or handle lines.
            // Simple check: does it contain tags?
            const isHTML = /<[a-z][\s\S]*>/i.test(initialContent);
            if (isHTML) {
                editorRef.current.innerHTML = initialContent;
            } else {
                // Convert plain text newlines to <br> or wrap in divs
                editorRef.current.innerText = initialContent;
            }
        }
    }, []);

    const handleSave = () => {
        if (!editorRef.current) return;
        const htmlContent = editorRef.current.innerHTML;
        if (!title.trim() && !editorRef.current.innerText.trim()) return;
        onSave(title, htmlContent, tags, bucket);
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        console.log('[NoteEditor] Executing:', command, value);
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const NOTE_COLORS = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚪'];

    const insertDateSeparator = () => {
        if (!editorRef.current) return;

        const content = editorRef.current.innerHTML;
        const separatorCount = (content.match(/<hr/g) || []).length;
        const colorIcon = NOTE_COLORS[separatorCount % NOTE_COLORS.length];

        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-SA');
        const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        // Create separator HTML
        // Use a div wrapper to ensure clean separation
        const separatorHtml = `
            <div class="my-4 select-none" contenteditable="false">
                <hr class="border-t border-gray-200 mb-2" />
                <div class="flex items-center gap-2 text-xs text-gray-500 font-mono" dir="rtl">
                    <span class="text-base leading-none">${colorIcon}</span>
                    <span>${dateStr}</span>
                    <span>${timeStr}</span>
                </div>
            </div>
            <div><br></div>
        `;

        document.execCommand('insertHTML', false, separatorHtml);
        editorRef.current.focus();
    };

    const addTag = () => {
        if (!newTag.trim() || tags.includes(newTag.trim())) return;
        setTags([...tags, newTag.trim()]);
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    // Lined paper metrics based on font size (1-7)
    const LINE_HEIGHT_MAP: Record<string, string> = {
        '1': '24px',
        '2': '28px',
        '3': '36px',
        '4': '42px',
        '5': '52px',
        '6': '64px',
        '7': '90px',
    };

    const currentLineHeight = LINE_HEIGHT_MAP[String(fontSize)] || '36px';

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <div className="flex flex-1 items-center gap-2">
                    {/* Bucket Selector */}
                    <div className="relative">
                        <select
                            value={bucket}
                            onChange={(e) => setBucket(e.target.value)}
                            className="h-9 px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-gray-700 min-w-[120px]"
                            title="اختر الحاوية"
                            dir="rtl"
                        >
                            {buckets.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="عنوان الملاحظة..."
                        className="text-xl font-bold border-none bg-transparent focus-visible:ring-0 px-2 h-10 flex-1 text-right"
                    />
                </div>

                <div className="flex items-center gap-2 mr-4">
                    {onDelete && (
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="حذف الملاحظة"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onCancel} className="text-gray-600 hover:bg-gray-200">
                        <X className="w-5 h-5" />
                        <span className="mr-1">إلغاء</span>
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 min-w-[100px]">
                        <Save className="w-5 h-5 ml-1" />
                        حفظ
                    </Button>
                </div>
            </div>

            {/* Rich Text Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-white flex-wrap shadow-sm z-10 sticky top-0">

                {/* Font Size Dropdown (Mapping 1-5 to 10px-24px roughly) */}
                {/* Font Size Dropdown (Custom Popover to prevent focus loss) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="h-8 border rounded-md px-2 text-sm bg-gray-50 hover:bg-white transition-colors cursor-pointer outline-none focus:ring-2 ring-blue-100 flex items-center gap-2 min-w-[4rem] justify-between"
                            title="حجم الخط"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <span>{fontSize}</span>
                            <ChevronDown className="w-3 h-3 text-gray-400 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-16 p-1"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <div className="flex flex-col gap-0.5">
                            {['1', '2', '3', '4', '5', '6', '7'].map((size) => (
                                <button
                                    key={size}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setFontSize(size);
                                        execCmd('fontSize', size);
                                    }}
                                    className={`w-full py-1 text-center text-sm rounded hover:bg-gray-100 transition-colors ${fontSize === size ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Lined Paper Toggle */}
                <button
                    onClick={() => setIsLined(!isLined)}
                    className={`flex items-center gap-1 p-1.5 rounded-md transition-colors border ${isLined ? 'bg-blue-100 border-blue-200 text-blue-600' : 'hover:bg-gray-100 border-transparent text-gray-500'}`}
                    title="تسطير الصفحة (ذكي)"
                >
                    <Menu className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{isLined ? 'مسطر' : 'تسطير'}</span>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <div className="relative flex items-center gap-2">
                    {/* Text Color Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
                                title="لون النص"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <Baseline className="w-4 h-4 text-gray-700" />
                                <div className="w-2 h-2 rounded-full bg-black/50" />
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-48 p-2"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="grid grid-cols-5 gap-1">
                                {[
                                    '#000000', '#64748b', '#ef4444', '#f97316',
                                    '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
                                    '#8b5cf6', '#d946ef', '#ffffff'
                                ].map(color => (
                                    <button
                                        key={color}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => execCmd('foreColor', color)}
                                        className="w-7 h-7 rounded-full border border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 relative"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    >
                                        {color === '#ffffff' && <div className="absolute inset-0 border border-gray-100 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-200" />

                    {/* Highlight Color Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
                                title="لون الخلفية"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <Highlighter className="w-4 h-4 text-gray-700" />
                                <div className="w-2 h-2 rounded-full bg-yellow-200 border border-gray-300" />
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-48 p-2"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="grid grid-cols-5 gap-1">
                                {[
                                    '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8',
                                    '#fed7aa', '#e9d5ff', '#e2e8f0', '#ffffff',
                                    'transparent'
                                ].map(color => (
                                    <button
                                        key={color}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => execCmd('backColor', color)}
                                        className={`w-7 h-7 rounded-full border border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 relative ${color === 'transparent' ? 'bg-white' : ''}`}
                                        style={{ backgroundColor: color }}
                                        title={color === 'transparent' ? 'إزالة الخلفية' : color}
                                    >
                                        {color === 'transparent' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-px bg-red-500 rotate-45" />
                                            </div>
                                        )}
                                        {color === '#ffffff' && <div className="absolute inset-0 border border-gray-100 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <div className="flex items-center border rounded-lg bg-gray-50 p-0.5">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCmd('insertUnorderedList')}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="قائمة نقطية"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCmd('insertOrderedList')}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="قائمة رقمية"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Horizontal Rule */}
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCmd('insertHorizontalRule')}
                    className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-sm font-medium text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                    title="خط فاصل"
                >
                    <Minus className="w-4 h-4" />
                    <span>فاصل</span>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Alignment */}
                <div className="flex items-center border rounded-lg bg-gray-50 p-0.5">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCmd('justifyRight')}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="محاذاة لليمين"
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCmd('justifyCenter')}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="توسيط"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCmd('justifyLeft')}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="محاذاة لليسار"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Date Separator */}
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertDateSeparator}
                    className="flex items-center gap-1 px-2 py-1.5 hover:bg-blue-50 text-blue-600 rounded text-sm font-medium transition-colors border border-transparent hover:border-blue-100"
                    title="إضافة فاصل مؤرخ"
                >
                    <Calendar className="w-4 h-4" />
                    <span>فاصل مؤرخ</span>
                </button>

            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative bg-white cursor-text" onClick={() => editorRef.current?.focus()}>
                <div
                    ref={editorRef}
                    contentEditable
                    className="h-full w-full p-6 outline-none overflow-auto text-right text-gray-800 text-lg focus:bg-gray-50/10 [&_ul]:list-disc [&_ul]:mr-5 [&_ol]:list-decimal [&_ol]:mr-5 selection:bg-blue-100"
                    style={{
                        direction: 'rtl',
                        minHeight: '100%',
                        lineHeight: isLined ? currentLineHeight : '1.6',
                        backgroundImage: isLined
                            ? `repeating-linear-gradient(transparent, transparent calc(${currentLineHeight} - 1px), #e5e7eb calc(${currentLineHeight} - 1px), #e5e7eb ${currentLineHeight})`
                            : 'none',
                        backgroundAttachment: 'local',
                        backgroundPosition: '0 1.2em' // Offset to align with baseline
                    }}
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                />

                {!content && (
                    <div className="absolute top-6 right-6 text-gray-300 text-lg pointer-events-none select-none">
                        اكتب ملاحظتك هنا...
                    </div>
                )}
            </div>

            {/* Footer / Tags */}
            <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 ml-2">الأوسمة:</span>
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs border border-blue-100"
                        >
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <div className="relative">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            placeholder="+ وسم"
                            className="w-24 h-7 text-xs border-dashed bg-white shadow-sm focus:w-32 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">حذف الملاحظة</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="action-row gap-2 sm:justify-start">
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (onDelete) onDelete();
                                setShowDeleteDialog(false);
                            }}
                        >
                            حذف نهائي
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
