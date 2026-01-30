
import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Type,
    Palette,
    Clock,
    ChevronDown,
    Minus,
    LayoutTemplate,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Highlighter,
    List,
    ListOrdered,
    Download,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Eraser
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
    editor: Editor | null;
    onOpenTemplates?: () => void;
    onExport?: (type: 'image' | 'pdf' | 'word' | 'text') => void;

}

const fontFamilies = [
    { name: 'Default', value: 'Inter' },
    { name: 'Cairo', value: 'Cairo' },
    { name: 'Tajawal', value: 'Tajawal' },
    { name: 'Amiri', value: 'Amiri' },
    { name: 'Almarai', value: 'Almarai' },
    { name: 'Harmattan', value: 'Harmattan' },
    { name: 'Aref Ruqaa', value: 'Aref Ruqaa' },
    { name: 'Reem Kufi', value: 'Reem Kufi' },
    { name: 'Calibri', value: 'Calibri' },
];

const colors = [
    '#000000', '#4B5563', '#9CA3AF', '#FFFFFF', // Grayscale & White
    '#DC2626', '#EA580C', '#D97706', '#CA8A04', // Reds/Oranges/Yellows
    '#65A30D', '#16A34A', '#059669', '#0D9488', // Greens/Teals
    '#0891B2', '#2563EB', '#4F46E5', '#7C3AED', // Blues/Indigos/Purples
    '#DB2777', '#E11D48' // Pinks/Roses
];

const highlights = [
    '#ffff00', '#a1ffba', '#ffcba1', '#ffb0e7', '#a6fcfc', '#e7e7e7', 'transparent'
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    onOpenTemplates,
    onExport,
}) => {
    if (!editor) return null;

    const addTimeSeparator = () => {
        const now = new Date();
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const dateString = `${now.getDate()} ${months[now.getMonth()]}`;
        const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });

        editor.chain().focus()
            .setHorizontalRule()
            .insertContent(`<p style="text-align: center; color: #9CA3AF; font-size: 0.85em; margin-top: -1em; background: white; width: fit-content; margin-left: auto; margin-right: auto; padding: 0 10px;">${dateString} ${timeString}</p>`)
            .enter()
            .run();
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col gap-2 p-2 mb-4 bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl sticky top-0 z-10 transition-all">

                {/* ROW 1: Typography & Formatting (Font, Size, B/I/U, Color, Highlight) */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 no-scrollbar">

                    {/* Font Family */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors font-medium text-xs sm:text-sm">
                                        <span className="max-w-[80px] truncate">
                                            {fontFamilies.find(f => editor.isActive('textStyle', { fontFamily: f.value }))?.name || 'الخط'}
                                        </span>
                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1 rounded-xl shadow-xl border-gray-100" align="start">
                                    <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                                        {fontFamilies.map((font) => (
                                            <button
                                                key={font.value}
                                                onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                                                className={`
                                                    flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                                    ${editor.isActive('textStyle', { fontFamily: font.value })
                                                        ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                        : 'hover:bg-gray-50 text-gray-700'}
                                                `}
                                                style={{ fontFamily: font.value }}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </TooltipTrigger>
                        <TooltipContent>نوع الخط</TooltipContent>
                    </Tooltip>

                    {/* Font Size */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors font-medium text-xs sm:text-sm">
                                        <Type className="w-3.5 h-3.5" />
                                        <span className="min-w-[18px] text-center">
                                            {editor.getAttributes('textStyle').fontSize?.replace('px', '') || '16'}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-16 p-1 rounded-xl shadow-xl border-gray-100 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-col gap-0.5" dir="rtl">
                                        {Array.from({ length: 21 }, (_, i) => 10 + i).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: `${size}` }).run()}
                                                className={`
                                                    flex items-center justify-center px-1 py-1.5 rounded-md text-sm transition-colors
                                                    ${editor.getAttributes('textStyle').fontSize === `${size}`
                                                        ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                        : 'hover:bg-gray-50 text-gray-700'}
                                                `}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </TooltipTrigger>
                        <TooltipContent>حجم الخط</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                    {/* Basic Formatting Group */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={`p-1.5 rounded-md transition-all ${editor.isActive('bold') ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>غمق (Bold)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={`p-1.5 rounded-md transition-all ${editor.isActive('italic') ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>مائل (Italic)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Eraser className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>مسح التنسيق</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                    {/* Colors */}
                    <div className="flex items-center gap-1">
                        {/* Text Color */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative group">
                                            <Palette className="w-4 h-4 text-gray-600" />
                                            <div
                                                className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full"
                                                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                                            />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl border-gray-100">
                                        <div className="grid grid-cols-6 gap-2">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                                    className={`w-7 h-7 rounded-full border hover:scale-110 transition-transform ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-gray-200'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <button onClick={() => editor.chain().focus().unsetColor().run()} className="w-full mt-2 text-xs text-gray-500 hover:text-red-500">إزالة اللون</button>
                                    </PopoverContent>
                                </Popover>
                            </TooltipTrigger>
                            <TooltipContent>لون النص</TooltipContent>
                        </Tooltip>

                        {/* Highlight */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative">
                                            <Highlighter className="w-4 h-4 text-gray-600" />
                                            <div
                                                className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full opacity-50"
                                                style={{ backgroundColor: editor.getAttributes('highlight').color || 'transparent' }}
                                            />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2 rounded-xl shadow-xl border-gray-100">
                                        <div className="grid grid-cols-4 gap-2">
                                            {highlights.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => color === 'transparent' ? editor.chain().focus().unsetHighlight().run() : editor.chain().focus().toggleHighlight({ color }).run()}
                                                    className={`w-8 h-8 rounded-md border flex items-center justify-center ${editor.isActive('highlight', { color }) ? 'ring-2 ring-blue-500' : 'border-gray-100'}`}
                                                    style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                                                >
                                                    {color === 'transparent' && <div className="w-full h-px bg-red-500 rotate-45" />}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TooltipTrigger>
                            <TooltipContent>تمييز النص</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* ROW 2: Paragraph & Inserts (Align, List, Separators, Templates, Export) */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 no-scrollbar border-t border-gray-50/50 pt-1.5">

                    {/* Alignment Group */}
                    <div className="flex bg-gray-50 rounded-lg p-0.5" dir="ltr">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'left' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><AlignLeft className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>محاذاة لليسار</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'center' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><AlignCenter className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>توسيط</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'right' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><AlignRight className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>محاذاة لليمين</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'justify' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><AlignJustify className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>ضبط كامل</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                    {/* Lists */}
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}><List className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>قائمة نقطية</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}><ListOrdered className="w-4 h-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent>قائمة رقمية</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                    {/* Insertions */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button onClick={addTimeSeparator} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><Clock className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent>إضافة فاصل زمني</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button onClick={onOpenTemplates} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><LayoutTemplate className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent>القوالب الجاهزة</TooltipContent>
                    </Tooltip>

                    <div className="ml-auto flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 transition-colors">
                                            <Download className="w-3.5 h-3.5" />
                                            <span>تصدير</span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40 p-1" align="end">
                                        <button onClick={() => onExport?.('image')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">صورة</button>
                                        <button onClick={() => onExport?.('pdf')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">PDF</button>
                                    </PopoverContent>
                                </Popover>
                            </TooltipTrigger>
                            <TooltipContent>تصدير الملاحظة</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};
