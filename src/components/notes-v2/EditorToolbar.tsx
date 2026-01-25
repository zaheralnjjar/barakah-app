
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
    File as FileIcon
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface EditorToolbarProps {
    editor: Editor | null;
    onOpenTemplates?: () => void;
    onExport?: (type: 'image' | 'pdf' | 'word') => void;

}

const fontFamilies = [
    { name: 'Default', value: 'Inter' },
    { name: 'Cairo', value: 'Cairo' },
    { name: 'Tajawal', value: 'Tajawal' },
    { name: 'Amiri', value: 'Amiri' },
    { name: 'Calibri', value: 'Calibri' },
];

const colors = [
    '#000000', '#4B5563', '#DC2626', '#EA580C',
    '#D97706', '#65A30D', '#059669', '#0891B2',
    '#2563EB', '#7C3AED', '#DB2777'
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
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dateString = `${now.getDate()} de ${months[now.getMonth()]}`;
        const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

        editor.chain().focus()
            .setHorizontalRule()
            .insertContent(`<p style="text-align: center; color: #9CA3AF; font-size: 0.85em; margin-top: -1em; background: white; width: fit-content; margin-left: auto; margin-right: auto; padding: 0 10px;">${dateString} a las ${timeString}</p>`)
            .enter()
            .run();
    };

    return (
        <div className="flex flex-col gap-2 p-2 mb-4 bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl sticky top-0 z-10 transition-all">
            {/* Row 1: Font & Style */}
            {/* Row 1: Font & Style */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {/* Font Family Selector */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors font-medium text-sm">
                            <Type className="w-4 h-4 text-indigo-500" />
                            <span className="max-w-[70px] truncate">
                                {fontFamilies.find(f => editor.isActive('textStyle', { fontFamily: f.value }))?.name || 'الخط'}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1 rounded-xl shadow-xl border-gray-100" align="start">
                        <div className="flex flex-col gap-0.5">
                            {fontFamilies.map((font) => (
                                <button
                                    key={font.value}
                                    onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                                    className={`
                                        flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                        ${editor.isActive('textStyle', { fontFamily: font.value })
                                            ? 'bg-indigo-50 text-indigo-600 font-bold'
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

                {/* Font Size Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors font-medium text-sm border border-transparent hover:border-gray-200">
                            <Type className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="min-w-[20px] text-center">
                                {editor.getAttributes('textStyle').fontSize?.replace('px', '') || '16'}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-20 p-1 rounded-xl shadow-xl border-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col gap-0.5">
                            {Array.from({ length: 21 }, (_, i) => 10 + i).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run()}
                                    className={`
                                        flex items-center justify-center px-2 py-1.5 rounded-lg text-sm transition-colors
                                        ${editor.isActive('textStyle', { fontSize: `${size}px` })
                                            ? 'bg-indigo-50 text-indigo-600 font-bold'
                                            : 'hover:bg-gray-50 text-gray-700'}
                                    `}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Color Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                            <div
                                className="w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                            />
                            <ChevronDown className="w-3 h-3 opacity-50 text-gray-500" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl border-gray-100">
                        <div className="grid grid-cols-6 gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                    className={`
                                        w-8 h-8 rounded-full border transition-transform hover:scale-110
                                        ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-offset-1 ring-indigo-500 border-transparent' : 'border-gray-100'}
                                    `}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => editor.chain().focus().unsetColor().run()}
                            className="w-full mt-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            إزالة اللون
                        </button>
                    </PopoverContent>
                </Popover>

                {/* Highlight Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors ${editor.isActive('highlight') ? 'bg-gray-100' : 'hover:bg-gray-100 text-gray-600'}`}
                            style={{ color: editor.getAttributes('highlight').color || undefined }}
                        >
                            <Highlighter className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3 rounded-2xl shadow-xl border-gray-100">
                        <div className="grid grid-cols-4 gap-2">
                            {highlights.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        if (color === 'transparent') {
                                            editor.chain().focus().unsetHighlight().run();
                                        } else {
                                            editor.chain().focus().toggleHighlight({ color }).run();
                                        }
                                    }}
                                    className={`
                                        w-8 h-8 rounded-md border transition-transform hover:scale-105 flex items-center justify-center
                                        ${editor.isActive('highlight', { color }) ? 'ring-2 ring-offset-1 ring-yellow-400 border-transparent' : 'border-gray-100'}
                                    `}
                                    style={{ backgroundColor: color === 'transparent' ? 'white' : color }}
                                >
                                    {color === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Row 2: Alignment, Lists, Extra */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {/* Alignment */}
                <div className="flex bg-gray-50 rounded-lg p-0.5" dir="ltr">
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    ><AlignLeft className="w-4 h-4" /></button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    ><AlignCenter className="w-4 h-4" /></button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    ><AlignRight className="w-4 h-4" /></button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive({ textAlign: 'justify' }) ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    ><AlignJustify className="w-4 h-4" /></button>
                </div>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-xl transition-all ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="تعداد نقطي"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-xl transition-all ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="تعداد رقمي"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Time Separator */}
                <button
                    onClick={addTimeSeparator}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    <Minus className="w-4 h-4" />
                    <Clock className="w-3.5 h-3.5" />
                </button>

                {/* Templates */}
                <button
                    onClick={onOpenTemplates}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors"
                >
                    <LayoutTemplate className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Export Menu */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
                            title="تصدير الملاحظة"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1 rounded-xl shadow-xl border-gray-100" align="end">
                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={() => onExport?.('image')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition-colors w-full text-right"
                            >
                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                <span>صورة (Image)</span>
                            </button>
                            <button
                                onClick={() => onExport?.('pdf')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition-colors w-full text-right"
                            >
                                <FileText className="w-4 h-4 text-red-500" />
                                <span>ملف PDF</span>
                            </button>
                            <button
                                onClick={() => onExport?.('word')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition-colors w-full text-right"
                            >
                                <FileIcon className="w-4 h-4 text-blue-500" />
                                <span>ملف Word</span>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
