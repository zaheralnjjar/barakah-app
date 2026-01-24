
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Zap, Palette, Save, Download, Trash2 } from 'lucide-react';

interface NotesSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        autoInsertSeparator: boolean;
        showFolderGridInitial: boolean;
    };
    onUpdateSettings: (key: string, value: boolean) => void;
    onExportBackup?: () => void;
    onExportPDF?: () => void;
}

export const NotesSettingsDialog: React.FC<NotesSettingsDialogProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    onExportBackup,
    onExportPDF
}) => {
    const handleExport = () => {
        if (onExportBackup) onExportBackup();
    };

    const handleExportPDFClick = () => {
        if (onExportPDF) onExportPDF();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        إعدادات الملاحظات
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Auto Separator */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-700 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                الفاصل الزمني التلقائي
                            </span>
                            <span className="text-xs text-gray-500">إضافة سطر وتاريخ تلقائياً عند فتح ملاحظة قديمة</span>
                        </div>
                        <Switch
                            checked={settings.autoInsertSeparator}
                            onCheckedChange={(val) => onUpdateSettings('autoInsertSeparator', val)}
                        />
                    </div>

                    {/* View Preference */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-700 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-purple-500" />
                                واجهة المكتبة الافتراضية
                            </span>
                            <span className="text-xs text-gray-500">عرض المجلدات كشبكة أيقونات عند البدء</span>
                        </div>
                        <Switch
                            checked={settings.showFolderGridInitial}
                            onCheckedChange={(val) => onUpdateSettings('showFolderGridInitial', val)}
                        />
                    </div>

                    {/* Data Management */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                            <Save className="w-4 h-4 text-green-500" />
                            إدارة البيانات
                        </div>
                        <Button variant="outline" className="w-full justify-start text-xs" onClick={handleExportPDFClick}>
                            <Download className="w-4 h-4 ml-2" />
                            تصدير الكل كملف PDF
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-xs" onClick={handleExport}>
                            <Download className="w-4 h-4 ml-2" />
                            تصدير نسخة احتياطية (JSON)
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف جميع الملاحظات
                        </Button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};
