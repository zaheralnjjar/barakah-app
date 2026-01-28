
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NoteEditorV2 } from './NoteEditorV2';
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditorModalV2Props {
    isOpen: boolean;
    onClose: () => void;
}

export const EditorModalV2: React.FC<EditorModalV2Props> = ({ isOpen, onClose }) => {
    const { folders } = useFolders();
    const { createNote } = useNotesV2(null);
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            let finalTitle = title.trim();
            if (!finalTitle) {
                // Default title: Current Date and Time
                finalTitle = new Date().toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            await createNote({
                title: finalTitle,
                folder_id: (selectedFolderId === 'none' || !selectedFolderId) ? null : selectedFolderId,
                content
            });

            toast({ title: 'تم حفظ الملاحظة بنجاح ✅' });
            onClose();
            // Reset fields
            setTitle('');
            setContent('');
            setSelectedFolderId(null);
        } catch (error: any) {
            console.error(error);
            toast({
                title: 'حدث خطأ أثناء الحفظ',
                description: `السبب: ${error.message || 'غير معروف'}`,
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-transparent border-0 shadow-none">

                {/* Header / Meta inputs */}
                <div className="bg-white/95 backdrop-blur rounded-t-2xl p-4 flex gap-4 items-center border-b shadow-sm">
                    <Input
                        placeholder="عنوان الملاحظة..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-bold border-transparent shadow-none focus-visible:ring-0 bg-transparent flex-1"
                    />

                    <Select onValueChange={setSelectedFolderId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="اختر المجلد" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">بدون مجلد</SelectItem>
                            {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    <div className="flex items-center gap-2">
                                        <Folder className="w-4 h-4 text-indigo-500" />
                                        {folder.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </div>

                {/* Editor Container */}
                <div className="flex-1 bg-white rounded-b-2xl overflow-hidden relative">
                    <NoteEditorV2
                        initialContent={content}
                        onUpdate={setContent}
                        autoInsertSeparator={true} // Default behavior for quick notes
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
