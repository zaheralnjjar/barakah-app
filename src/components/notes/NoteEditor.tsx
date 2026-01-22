import React, { useState } from 'react';
import { Bold, Italic, Underline, Highlighter, Palette, Link as LinkIcon, Paperclip, Tag, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
    initialTitle?: string;
    initialContent?: string;
    initialTags?: string[];
    onSave: (title: string, content: string, tags: string[]) => void;
    onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
    initialTitle = '',
    initialContent = '',
    initialTags = [],
    onSave,
    onCancel,
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [tags, setTags] = useState<string[]>(initialTags);
    const [newTag, setNewTag] = useState('');

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

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                    {initialTitle ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 ml-1" />
                        حفظ
                    </Button>
                </div>
            </div>

            {/* Title Input */}
            <div className="p-4 border-b">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الملاحظة..."
                    className="text-xl font-semibold border-none focus-visible:ring-0 px-0"
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                <button className="p-2 hover:bg-gray-200 rounded" title="غامق">
                    <Bold className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded" title="مائل">
                    <Italic className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded" title="تحته خط">
                    <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button className="p-2 hover:bg-gray-200 rounded" title="تمييز">
                    <Highlighter className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded" title="لون">
                    <Palette className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button className="p-2 hover:bg-gray-200 rounded" title="رابط">
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded" title="مرفق">
                    <Paperclip className="w-4 h-4" />
                </button>
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-4 overflow-y-auto">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="min-h-[300px] border-none focus-visible:ring-0 resize-none text-base"
                />
            </div>

            {/* Tags Section */}
            <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">الوسوم</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="أضف وسم..."
                        className="flex-1"
                    />
                    <Button size="sm" onClick={addTag} variant="outline">
                        إضافة
                    </Button>
                </div>
            </div>
        </div>
    );
};
