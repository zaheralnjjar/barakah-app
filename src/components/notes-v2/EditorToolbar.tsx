
import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Type,
    Palette,
    Clock,
    ChevronDown,
    Minus,
    LayoutTemplate,
    PenTool
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface EditorToolbarProps {
    editor: Editor | null;
    onOpenTemplates?: () => void;
    onOpenDrawing?: () => void;
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

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    onOpenTemplates,
    onOpenDrawing
}) => {
    if (!editor) return null;

    const addTimeSeparator = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });

        editor.chain().focus()
            .setHorizontalRule()
            .insertContent(`<p style="text-align: center; color: #9CA3AF; font-size: 0.85em; margin-top: -1em; background: white; width: fit-content; margin-left: auto; margin-right: auto; padding: 0 10px;">${dateString} • ${timeString}</p>`)
            .enter()
            .run();
    };

    return (
        <div className="flex items-center gap-2 p-2 mb-4 bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl sticky top-0 z-10 transition-all">

            {/* Font Family Selector */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors font-medium text-sm">
                        <Type className="w-4 h-4 text-indigo-500" />
                        <span className="max-w-[80px] truncate">
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

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Color Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                        title="لون النص"
                    >
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
                                title={color}
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

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Time Separator */}
            <button
                onClick={addTimeSeparator}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors"
                title="إضافة فاصل زمني"
            >
                <Minus className="w-4 h-4" />
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm font-medium hidden sm:inline">فاصل</span>
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Templates */}
            <button
                onClick={onOpenTemplates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors"
                title="قوالب جاهزة"
            >
                <LayoutTemplate className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">قوالب</span>
            </button>

            {/* Drawing */}
            <button
                onClick={onOpenDrawing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-colors"
                title="رسم"
            >
                <PenTool className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">رسم</span>
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Font Size (Simplified Toggles) */}
            <div className="flex items-center gap-1 mr-auto" dir="ltr">
                <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={`p-1.5 rounded-lg text-xs font-medium border ${editor.isActive('paragraph') ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-transparent hover:bg-gray-100'}`}
                >
                    Normal
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded-lg text-xs font-bold border ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-transparent hover:bg-gray-100'}`}
                >
                    Large
                </button>
            </div>

        </div>
    );
};
