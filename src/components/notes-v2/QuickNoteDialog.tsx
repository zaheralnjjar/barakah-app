import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { FileText, Save, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickNoteDialog: React.FC<QuickNoteDialogProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [folderId, setFolderId] = useState<string | null>(null);
    const { folders } = useFolders();
    const { createNote } = useNotesV2();
    const { toast } = useToast();

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ title: 'يرجى إدخال عنوان للملاحظة', variant: 'destructive' });
            return;
        }

        try {
            await createNote({ title, content, folder_id: folderId });
            toast({ title: 'تم حفظ الملاحظة بنجاح ✅' });
            setTitle('');
            setContent('');
            setFolderId(null);
            onClose();
        } catch (error) {
            toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-700">
                        <FileText className="w-5 h-5" />
                        ملاحظة سريعة جديدة
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">العنوان</label>
                        <Input
                            placeholder="عنوان الملاحظة..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-gray-50 border-gray-200 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>

                    {/* Folder Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">المجلد (اختياري)</label>
                        <Select value={folderId || 'none'} onValueChange={(val) => setFolderId(val === 'none' ? null : val)}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 text-right">
                                <SelectValue placeholder="اختر المجلد..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="none" className="text-right">بدون مجلد</SelectItem>
                                {folders.map(f => (
                                    <SelectItem key={f.id} value={f.id} className="text-right">
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4 text-indigo-400" />
                                            {f.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">المحتوى</label>
                        <textarea
                            placeholder="اكتب ملاحظتك هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[150px] p-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>
                            <Save className="w-4 h-4 ml-2" />
                            حفظ الملاحظة
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
