
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Archive, AlertTriangle, CheckCircle, Database, History, RotateCcw } from 'lucide-react';
import { useArchiver, ArchiveSection } from '@/hooks/useArchiver';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const DataArchiver = () => {
    const { archives, isArchiving, isLoading, fetchArchives, archiveAndReset, restoreArchive } = useArchiver();
    const [selectedSections, setSelectedSections] = useState<ArchiveSection[]>([]);
    const [archiveLabel, setArchiveLabel] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchArchives();
    }, []);

    const toggleSection = (section: ArchiveSection) => {
        if (selectedSections.includes(section)) {
            setSelectedSections(selectedSections.filter(s => s !== section));
        } else {
            setSelectedSections([...selectedSections, section]);
        }
    };

    const handleArchive = async () => {
        const success = await archiveAndReset(selectedSections, archiveLabel);
        if (success) {
            setIsDialogOpen(false);
            setArchiveLabel('');
            setSelectedSections([]);
        }
    };

    const sectionsList: { id: ArchiveSection; label: string; color: string }[] = [
        { id: 'tasks', label: 'المهام', color: 'text-blue-600' },
        { id: 'appointments', label: 'المواعيد', color: 'text-orange-600' },
        { id: 'finance', label: 'المالية', color: 'text-green-600' },
        { id: 'habits', label: 'العادات', color: 'text-yellow-600' },
        { id: 'shopping', label: 'قائمة التسوق', color: 'text-purple-600' },
        { id: 'notes', label: 'الملاحظات', color: 'text-gray-600' },
    ];

    return (
        <Card className="border-orange-100 bg-orange-50/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                    <Archive className="w-5 h-5 text-orange-600" />
                    أرشفة البيانات وإعادة التعيين
                </CardTitle>
                <CardDescription className="arabic-body text-xs">
                    قم بأرشفة بياناتك الحالية وتصفير الأقسام لبداية جديدة. يتم حفظ البيانات للرجوع إليها لاحقاً.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                    {sectionsList.map((section) => (
                        <div key={section.id} className="flex items-center space-x-2 space-x-reverse justify-between p-2 bg-white rounded-lg border">
                            <label htmlFor={`sect-${section.id}`} className={`text-sm font-medium cursor-pointer flex-1 ${section.color}`}>
                                {section.label}
                            </label>
                            <Checkbox
                                id={`sect-${section.id}`}
                                checked={selectedSections.includes(section.id)}
                                onCheckedChange={() => toggleSection(section.id)}
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full gap-2" disabled={selectedSections.length === 0 || isLoading}>
                                <Database className="w-4 h-4" />
                                أرشفة البيانات المختارة وتصفيرها
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-right flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    تأكيد الأرشفة والتصفير
                                </DialogTitle>
                                <DialogDescription className="text-right pt-2">
                                    هل أنت متأكد؟ سيتم حفظ نسخة من البيانات المختارة في الأرشيف، ثم
                                    <span className="font-bold text-red-600 px-1">حذفها نهائياً</span>
                                    من الشاشات الحالية للبدء من جديد.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                    الأقسام التي سيتم تصفيرها:
                                    <ul className="list-disc list-inside mt-1 px-2">
                                        {selectedSections.map(s => (
                                            <li key={s}>{sectionsList.find(sl => sl.id === s)?.label}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">اسم الأرشيف (اختياري)</label>
                                    <Input
                                        placeholder="مثال: بيانات 2024"
                                        value={archiveLabel}
                                        onChange={(e) => setArchiveLabel(e.target.value)}
                                        className="text-right"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                                <Button variant="destructive" onClick={handleArchive} disabled={isArchiving}>
                                    {isArchiving ? 'جاري التنفيذ...' : 'نعم، أرشف وصفر البيانات'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Previous Archives List (Last 3) */}
                {archives.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="flex items-center gap-2 font-bold text-gray-700 mb-3 text-sm">
                            <History className="w-4 h-4" />
                            سجل الأرشيف (آخر 3 ملفات)
                        </h4>
                        <div className="space-y-2">
                            {archives.slice(0, 3).map((arch) => (
                                <div key={arch.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm border hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{arch.label || 'بدون عنوان'}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className="text-[10px] text-gray-500 ml-2">{new Date(arch.created_at).toLocaleDateString('ar-EG')}</span>
                                            {arch.sections.map((s: string) => (
                                                <Badge key={s} variant="secondary" className="text-[10px] px-1 h-5 bg-white border">{sectionsList.find(sl => sl.id === s)?.label || s}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2 text-xs gap-1 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                                        onClick={() => {
                                            if (confirm('هل أنت متأكد من استعادة هذا الأرشيف؟ سيتم استبدال البيانات الحالية ببيانات الأرشيف.')) {
                                                restoreArchive(arch.id);
                                            }
                                        }}
                                        disabled={isArchiving}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        استعادة
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DataArchiver;
