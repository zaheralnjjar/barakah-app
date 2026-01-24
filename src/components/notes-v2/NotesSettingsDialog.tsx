
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Assuming shadcn switch
import { Settings, Zap, Type, Palette } from 'lucide-react';

interface NotesSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        autoInsertSeparator: boolean;
        showFolderGridInitial: boolean;
    };
    onUpdateSettings: (key: string, value: boolean) => void;
}

export const NotesSettingsDialog: React.FC<NotesSettingsDialogProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        إعدادات الملاحظات
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
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

                    {/* Placeholder for future settings */}
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                        سيتم إضافة المزيد من خيارات الخطوط والنسخ الاحتياطي هنا.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
