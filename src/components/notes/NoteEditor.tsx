import React, { useState, useRef } from 'react';
import {
    List, ListOrdered, Clock, Save, X,
    ChevronDown, Type, Palette, Plus, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteEditorProps {
    initialTitle?: string;
    initialContent?: string;
    initialTags?: string[];
    isEditing?: boolean;
    onSave: (title: string, content: string, tags: string[]) => void;
    onCancel: () => void;
}

// Arabic fonts
const ARABIC_FONTS = [
    { name: 'الافتراضي', value: 'inherit' },
    { name: 'تالومة', value: "'Tajawal', sans-serif" },
    { name: 'أميري', value: "'Amiri', serif" },
    { name: 'القاهرة', value: "'Cairo', sans-serif" },
    { name: 'نوتو نسخ', value: "'Noto Naskh Arabic', serif" },
    { name: 'الكوفي', value: "'Reem Kufi', sans-serif" },
];

// Font sizes - numeric 10 to 24
const FONT_SIZES = [
    { name: '10', value: '10px' },
    { name: '12', value: '12px' },
    { name: '14', value: '14px' },
    { name: '16', value: '16px' },
    { name: '18', value: '18px' },
    { name: '20', value: '20px' },
    { name: '22', value: '22px' },
    { name: '24', value: '24px' },
];

// Text colors
const TEXT_COLORS = [
    { name: 'أسود', value: '#1f2937', emoji: '⚫' },
    { name: 'أحمر', value: '#dc2626', emoji: '🔴' },
    { name: 'أخضر', value: '#16a34a', emoji: '🟢' },
    { name: 'أزرق', value: '#2563eb', emoji: '🔵' },
    { name: 'برتقالي', value: '#ea580c', emoji: '🟠' },
    { name: 'بنفسجي', value: '#9333ea', emoji: '🟣' },
];

// Rotating colors for edit entries
const EDIT_COLORS = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚪', '🟤'];

const getNextEditColor = (content: string): string => {
    const separatorCount = (content.match(/━━━━━━━━━━━━━━━━━━━━━━/g) || []).length;
    return EDIT_COLORS[separatorCount % EDIT_COLORS.length];
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
    initialTitle = '',
    initialContent = '',
    initialTags = [],
    isEditing = false,
    onSave,
    onCancel,
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [tags, setTags] = useState<string[]>(initialTags);
    const [newTag, setNewTag] = useState('');
    const [selectedFont, setSelectedFont] = useState(ARABIC_FONTS[0]);
    const [selectedSize, setSelectedSize] = useState(FONT_SIZES[1]);
    const [selectedColor, setSelectedColor] = useState(TEXT_COLORS[0]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = () => {
        if (!title.trim() && !content.trim()) return;
        onSave(title, content, tags);
    };

    const addTag = () => {
        if (!newTag.trim() || tags.includes(newTag.trim())) return;
        setTags([...tags, newTag.trim()]);
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    // Insert text at cursor position
    const insertAtCursor = (text: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = start + text.length;
                textareaRef.current.selectionStart = newPos;
                textareaRef.current.selectionEnd = newPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    // Add bullet point
    const addBullet = () => insertAtCursor('\n• ');

    // Add numbered list
    const addNumberedList = () => {
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 1];
        const match = lastLine.match(/^(\d+)\./);
        const nextNum = match ? parseInt(match[1]) + 1 : 1;
        insertAtCursor(`\n${nextNum}. `);
    };

    // Add separator with timestamp
    const addEditSeparator = () => {
        const timestamp = new Date().toLocaleString('ar-SA', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
        const color = getNextEditColor(content);
        const separator = `\n\n━━━━━━━━━━━━━━━━━━━━━━\n${color} [${timestamp}]\n`;
        insertAtCursor(separator);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header - Compact */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الملاحظة..."
                    className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 px-0 h-8 flex-1"
                    style={{ fontFamily: selectedFont.value }}
                />
                <div className="flex items-center gap-1 mr-2">
                    <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 px-2 text-gray-600">
                        <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} className="h-8 px-3 bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 ml-1" />
                        حفظ
                    </Button>
                </div>
            </div>

            {/* Compact Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-white flex-wrap">
                {/* Font Family */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100 border">
                        <Type className="w-3 h-3" />
                        <span className="max-w-16 truncate">{selectedFont.name}</span>
                        <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {ARABIC_FONTS.map((font) => (
                            <DropdownMenuItem
                                key={font.value}
                                onClick={() => setSelectedFont(font)}
                                style={{ fontFamily: font.value }}
                            >
                                {font.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Font Size */}
                <div className="flex items-center border rounded">
                    <button
                        onClick={() => {
                            const idx = FONT_SIZES.findIndex(s => s.value === selectedSize.value);
                            if (idx > 0) setSelectedSize(FONT_SIZES[idx - 1]);
                        }}
                        className="p-1 hover:bg-gray-100"
                        title="تصغير"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1 text-xs min-w-10 text-center">{selectedSize.name}</span>
                    <button
                        onClick={() => {
                            const idx = FONT_SIZES.findIndex(s => s.value === selectedSize.value);
                            if (idx < FONT_SIZES.length - 1) setSelectedSize(FONT_SIZES[idx + 1]);
                        }}
                        className="p-1 hover:bg-gray-100"
                        title="تكبير"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {/* Text Color */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100 border">
                        <Palette className="w-3 h-3" style={{ color: selectedColor.value }} />
                        <span>{selectedColor.emoji}</span>
                        <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {TEXT_COLORS.map((color) => (
                            <DropdownMenuItem
                                key={color.value}
                                onClick={() => setSelectedColor(color)}
                                className="gap-2"
                            >
                                <span>{color.emoji}</span>
                                <span style={{ color: color.value }}>{color.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* Bullet List */}
                <button
                    onClick={addBullet}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
                    title="نقطة •"
                >
                    <List className="w-4 h-4" />
                </button>

                {/* Numbered List */}
                <button
                    onClick={addNumberedList}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
                    title="ترقيم 1,2,3"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* Timestamp Separator */}
                <button
                    onClick={addEditSeparator}
                    className="w-7 h-7 flex items-center justify-center rounded bg-blue-50 hover:bg-blue-100"
                    title="فاصل مع التاريخ"
                >
                    <Clock className="w-4 h-4 text-blue-600" />
                </button>
            </div>

            {/* Content Editor */}
            <div className="flex-1 overflow-y-auto">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="min-h-full h-full w-full border-none focus-visible:ring-0 resize-none p-4"
                    style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: selectedFont.value,
                        fontSize: selectedSize.value,
                        color: selectedColor.value,
                    }}
                />
            </div>

            {/* Tags Section - Compact */}
            <div className="px-3 py-2 border-t bg-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                        >
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="+ وسم"
                        className="w-20 h-6 text-xs border-dashed"
                    />
                </div>
            </div>
        </div>
    );
};
