import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';

interface CreateNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialFolderId?: string | null;
}

const NOTE_COLORS = [
    { name: 'افتراضي', value: '#FFFFFF' },
    { name: 'أحمر فاتح', value: '#FEF2F2' },
    { name: 'أصفر فاتح', value: '#FFFBEB' },
    { name: 'أخضر فاتح', value: '#ECFDF5' },
    { name: 'أزرق فاتح', value: '#EFF6FF' },
    { name: 'بنفسجي فاتح', value: '#F5F3FF' },
];

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ isOpen, onClose, initialFolderId }) => {
    const { createNote } = useNotesV2(null);
    const { folders } = useFolders();
    const [title, setTitle] = useState('');
    const [folderId, setFolderId] = useState<string>(initialFolderId || 'none');
    const [color, setColor] = useState('#FFFFFF');
    const [isLoading, setIsLoading] = useState(false);

    // Update folderId if prop changes
    React.useEffect(() => {
        if (isOpen) {
            setFolderId(initialFolderId || 'none');
            setTitle(''); // Reset title on open
        }
    }, [isOpen, initialFolderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await createNote({
                title,
                folder_id: folderId === 'none' ? null : folderId,
                content: '',
                color: color
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle>ملاحظة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>عنوان الملاحظة</Label>
                        <Input
                            placeholder="مثال: أفكار للمشروع"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>المجلد</Label>
                        <Select value={folderId} onValueChange={setFolderId}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر مجلد" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- بدون مجلد --</SelectItem>
                                {folders.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.icon} {f.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>لون الخلفية</Label>
                        <div className="flex flex-wrap gap-2">
                            {NOTE_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`w-8 h-8 rounded-full border border-gray-200 transition-all ${color === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading ? 'جاري الإنشاء...' : 'إنشاء'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
