import React, { useState, useRef, useEffect } from 'react';
import {
    List, ListOrdered, Save, X,
    Plus, Minus, Bold, Italic, Underline,
    Palette, Type, Undo, Redo, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface NoteEditorProps {
    initialTitle?: string;
    initialContent?: string;
    initialTags?: string[];
    isEditing?: boolean;
    onSave: (title: string, content: string, tags: string[]) => void;
    onCancel: () => void;
}

const COLORS = [
    '#000000', // Black
    '#64748b', // Slate
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
];

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
    const editorRef = useRef<HTMLDivElement>(null);
    const [fontSize, setFontSize] = useState(3); // 1-7 scale for execCommand

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
        onSave(title, htmlContent, tags);
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const addTag = () => {
        if (!newTag.trim() || tags.includes(newTag.trim())) return;
        setTags([...tags, newTag.trim()]);
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الملاحظة..."
                    className="text-xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-10 flex-1 text-right"
                />
                <div className="flex items-center gap-2 mr-4">
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
            <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-white flex-wrap shadow-sm z-10 sticky top-0">

                {/* Text Formatting */}
                <div className="flex items-center border rounded-lg bg-gray-50 p-0.5">
                    <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white rounded transition-colors" title="عريض">
                        <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-white rounded transition-colors" title="مائل">
                        <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-white rounded transition-colors" title="تسطير">
                        <Underline className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Font Size */}
                <div className="flex items-center border rounded-lg bg-gray-50 p-0.5">
                    <button
                        onClick={() => {
                            const newSize = Math.max(1, fontSize - 1);
                            setFontSize(newSize);
                            execCmd('fontSize', newSize.toString());
                        }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="تصغير الخط"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <Type className="w-4 h-4 mx-1 text-gray-400" />
                    <button
                        onClick={() => {
                            const newSize = Math.min(7, fontSize + 1);
                            setFontSize(newSize);
                            execCmd('fontSize', newSize.toString());
                        }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                        title="تكبير الخط"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Colors */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200">
                            <Palette className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium">لون</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1 flex-wrap w-[150px]">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => execCmd('foreColor', color)}
                                    className="w-6 h-6 rounded-full border hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <div className="flex items-center border rounded-lg bg-gray-50 p-0.5">
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-white rounded transition-colors" title="قائمة نقطية">
                        <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-white rounded transition-colors" title="قائمة رقمية">
                        <ListOrdered className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5">
                    <button onClick={() => execCmd('undo')} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="تراجع">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={() => execCmd('redo')} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="إعادة">
                        <Redo className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative bg-white cursor-text" onClick={() => editorRef.current?.focus()}>
                <div
                    ref={editorRef}
                    contentEditable
                    className="h-full w-full p-6 outline-none overflow-auto text-right text-gray-800 text-lg leading-relaxed focus:bg-gray-50/10"
                    style={{ direction: 'rtl', minHeight: '100%' }}
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
        </div>
    );
};
