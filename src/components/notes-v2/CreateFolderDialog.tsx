import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFolders } from '@/hooks/useFolders';

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentFolderId?: string | null;
}

import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';

const PRESET_COLORS = [
    { color: '#EF4444', name: 'أحمر' },
    { color: '#F97316', name: 'برتقالي' },
    { color: '#F59E0B', name: 'كهرماني' },
    { color: '#10B981', name: 'زمردي' },
    { color: '#06B6D4', name: 'سماوي' },
    { color: '#3B82F6', name: 'أزرق' },
    { color: '#6366F1', name: 'نيلي' },
    { color: '#8B5CF6', name: 'بنفسجي' },
    { color: '#D946EF', name: 'فوشيا' },
    { color: '#EC4899', name: 'وردي' },
    { color: '#6B7280', name: 'رمادي' },
    { color: '#1F2937', name: 'رمادي غامق' },
];

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ isOpen, onClose, parentFolderId }) => {
    const { createFolder } = useFolders();
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📁');
    const [color, setColor] = useState(PRESET_COLORS[5].color); // Default Blue
    const [isLoading, setIsLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await createFolder({
                name,
                icon,
                color,
                parent_id: parentFolderId || null
            });
            onClose();
            setName('');
            setIcon('📁');
            setColor(PRESET_COLORS[5].color);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle>إنشاء مجلد جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>اسم المجلد</Label>
                        <Input
                            placeholder="مثال: مشاريع العمل، أفكار، خطط..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-50 text-lg"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                            <Label>الأيقونة</Label>
                            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 text-2xl bg-gray-50 hover:bg-gray-100"
                                    >
                                        {icon}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 border-none w-auto" align="start">
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => {
                                            setIcon(emojiData.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        autoFocusSearch={false}
                                        theme={Theme.LIGHT}
                                        emojiStyle={EmojiStyle.NATIVE}
                                        width={320}
                                        height={400}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>لون المجلد</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.color}
                                    type="button"
                                    onClick={() => setColor(c.color)}
                                    className={`
                                        w-full aspect-square rounded-full transition-all flex items-center justify-center
                                        hover:scale-110 active:scale-95
                                        ${color === c.color ? 'ring-2 ring-offset-2 ring-black scale-110 shadow-sm' : 'hover:shadow-sm'}
                                    `}
                                    style={{ backgroundColor: c.color }}
                                    title={c.name}
                                >
                                    {color === c.color && <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()} className="min-w-[100px]">
                            {isLoading ? 'جاري الإنشاء...' : 'إنشاء'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
