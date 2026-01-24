import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFolders, Folder } from '@/hooks/useFolders';

interface EditFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    folder: Folder | null;
}

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'
];

export const EditFolderDialog: React.FC<EditFolderDialogProps> = ({ isOpen, onClose, folder }) => {
    const { updateFolder } = useFolders();
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📁');
    const [color, setColor] = useState(COLORS[4]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (folder) {
            setName(folder.name);
            setIcon(folder.icon || '📁');
            setColor(folder.color || COLORS[4]);
        }
    }, [folder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !folder) return;

        setIsLoading(true);
        try {
            await updateFolder({
                id: folder.id,
                updates: {
                    name,
                    icon,
                    color
                }
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
                    <DialogTitle>تعديل المجلد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>اسم المجلد</Label>
                        <Input
                            placeholder="مثال: مشاريع العمل"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الأيقونة (إيموجي)</Label>
                            <Input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="text-center text-xl"
                                maxLength={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>اللون</Label>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
