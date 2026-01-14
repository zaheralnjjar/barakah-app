import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ResearchMaterial } from '@/types/academic';
import { BookOpen, Link, FileText, Plus } from 'lucide-react';

interface AddMaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (material: Omit<ResearchMaterial, 'id'>) => void;
}

export function AddMaterialDialog({ isOpen, onClose, onAdd }: AddMaterialDialogProps) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [year, setYear] = useState('');
    const [type, setType] = useState<'book' | 'paper' | 'link' | 'other'>('book');
    const [url, setUrl] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;

        onAdd({
            title,
            author: author || undefined,
            publisher: publisher || undefined,
            year: year || undefined,
            type,
            url: url || undefined,
            status: 'to_read',
            tags: []
        });

        // Reset form
        setTitle('');
        setAuthor('');
        setPublisher('');
        setYear('');
        setUrl('');
        setType('book');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        إضافة مرجع جديد
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type" className="text-right">نوع المرجع</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)} dir="rtl">
                            <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="book">📕 كتاب</SelectItem>
                                <SelectItem value="paper">📄 ورقة بحثية / مقال</SelectItem>
                                <SelectItem value="link">🔗 رابط موقع</SelectItem>
                                <SelectItem value="other">📦 أخرى</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title" className="text-right">العنوان <span className="text-red-500">*</span></Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="text-right" placeholder="مثال: العقيدة الطحاوية" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="author" className="text-right">المؤلف</Label>
                            <Input id="author" value={author} onChange={e => setAuthor(e.target.value)} className="text-right" placeholder="اسم المؤلف" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="year" className="text-right">سنة النشر</Label>
                            <Input id="year" value={year} onChange={e => setYear(e.target.value)} className="text-right" placeholder="مثال: 1445" />
                        </div>
                    </div>

                    {type === 'book' && (
                        <div className="grid gap-2">
                            <Label htmlFor="publisher" className="text-right">دار النشر</Label>
                            <Input id="publisher" value={publisher} onChange={e => setPublisher(e.target.value)} className="text-right" />
                        </div>
                    )}

                    {(type === 'link' || type === 'paper') && (
                        <div className="grid gap-2">
                            <Label htmlFor="url" className="text-right">الرابط</Label>
                            <Input id="url" value={url} onChange={e => setUrl(e.target.value)} className="text-right text-left" dir="ltr" placeholder="https://..." />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button type="submit" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 ml-1" /> إضافة المرجع
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
