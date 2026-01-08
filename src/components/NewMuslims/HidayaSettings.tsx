import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Mail } from 'lucide-react';
import { useHidayaSettings } from '@/hooks/useHidayaSettings';
import { useHidayaTranslation } from '@/hooks/useHidayaTranslation';

export const HidayaSettings: React.FC = () => {
    const { templates, saveTemplates, clearAllData } = useHidayaSettings();
    const { t } = useHidayaTranslation();
    const [localTemplates, setLocalTemplates] = React.useState(templates);

    // Sync local state when templates change
    React.useEffect(() => {
        setLocalTemplates(templates);
    }, [templates]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5">
            {/* Message Templates */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="w-5 h-5 text-emerald-600" />
                        قوالب الرسائل
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>رسالة الترحيب</Label>
                        <Textarea
                            value={localTemplates.welcome}
                            onChange={e => setLocalTemplates(p => ({ ...p, welcome: e.target.value }))}
                            className="text-sm min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>رسالة التذكير</Label>
                        <Textarea
                            value={localTemplates.reminder}
                            onChange={e => setLocalTemplates(p => ({ ...p, reminder: e.target.value }))}
                            className="text-sm min-h-[80px]"
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        استخدم {'{name}'} لإدراج اسم الطالب.
                    </p>
                    <Button onClick={() => saveTemplates(localTemplates)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-4 h-4 mr-2" /> حفظ القوالب
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-100 bg-red-50/10">
                <CardHeader>
                    <CardTitle className="text-base text-red-600 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        منطقة الخطر
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full" onClick={clearAllData}>
                        مسح جميع البيانات
                    </Button>
                    <p className="text-xs text-red-400 text-center mt-2">
                        سيتم حذف جميع الطلاب والملاحظات والمواعيد.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
