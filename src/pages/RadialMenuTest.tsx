import React, { useState } from 'react';
import RadialMenu from '../components/RadialMenu';
import { Calendar, Plus, ArrowLeft, Settings, DollarSign, FileText, MapPin, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const RadialMenuTest = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [lastAction, setLastAction] = useState<string | null>(null);
    const { toast } = useToast();

    // Customizable actions state
    const [customActions, setCustomActions] = useState({
        top: { icon: <Calendar className="w-6 h-6" />, label: 'التقويم', action: 'calendar' },
        right: { icon: <Plus className="w-6 h-6" />, label: 'إضافة', action: 'add' },
        bottom: { icon: <ArrowLeft className="w-6 h-6" />, label: 'رجوع', action: 'back' },
        left: { icon: <Settings className="w-6 h-6" />, label: 'الإعدادات', action: 'settings' },
    });

    const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't open if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
            return;
        }

        setMenuPosition({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
    };

    const handleAction = (action: string) => {
        setLastAction(action);
        toast({
            title: 'تم تنفيذ الإجراء',
            description: `الإجراء: ${action}`,
        });

        // In real implementation, these would navigate or perform actions
        switch (action) {
            case 'home':
                console.log('Navigating to home...');
                break;
            case 'back':
                console.log('Going back...');
                break;
            case 'calendar':
                console.log('Opening calendar...');
                break;
            case 'add':
                console.log('Opening add dialog...');
                break;
            case 'settings':
                console.log('Opening settings...');
                break;
            default:
                console.log(`Action: ${action}`);
        }
    };

    // Preset action configurations
    const presets = {
        default: {
            top: { icon: <Calendar className="w-6 h-6" />, label: 'التقويم', action: 'calendar' },
            right: { icon: <Plus className="w-6 h-6" />, label: 'إضافة', action: 'add' },
            bottom: { icon: <ArrowLeft className="w-6 h-6" />, label: 'رجوع', action: 'back' },
            left: { icon: <Settings className="w-6 h-6" />, label: 'الإعدادات', action: 'settings' },
        },
        finance: {
            top: { icon: <DollarSign className="w-6 h-6" />, label: 'المالية', action: 'finance' },
            right: { icon: <Plus className="w-6 h-6" />, label: 'مصروف', action: 'add-expense' },
            bottom: { icon: <ArrowLeft className="w-6 h-6" />, label: 'رجوع', action: 'back' },
            left: { icon: <FileText className="w-6 h-6" />, label: 'تقرير', action: 'report' },
        },
        locations: {
            top: { icon: <MapPin className="w-6 h-6" />, label: 'موقع جديد', action: 'new-location' },
            right: { icon: <Plus className="w-6 h-6" />, label: 'حفظ موقف', action: 'save-parking' },
            bottom: { icon: <ArrowLeft className="w-6 h-6" />, label: 'رجوع', action: 'back' },
            left: { icon: <Bell className="w-6 h-6" />, label: 'تذكير', action: 'reminder' },
        },
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4"
            onClick={handleScreenClick}
        >
            {/* Header */}
            <div className="max-w-2xl mx-auto mb-8">
                <h1 className="text-2xl font-bold text-center text-green-800 mb-2">
                    🎯 اختبار القائمة الدائرية
                </h1>
                <p className="text-center text-gray-600">
                    اضغط في أي مكان على الشاشة لفتح القائمة الدائرية
                </p>
            </div>

            {/* Demo Area */}
            <Card className="max-w-2xl mx-auto mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">منطقة الاختبار</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                        <p className="text-lg mb-2">اضغط هنا لاختبار القائمة</p>
                        <p className="text-sm">ستظهر القائمة الدائرية في موضع النقر</p>
                        {lastAction && (
                            <p className="mt-4 text-green-600 font-medium">
                                آخر إجراء: {lastAction}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Preset Configurations */}
            <Card className="max-w-2xl mx-auto mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">تخصيص الأزرار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCustomActions(presets.default);
                            }}
                        >
                            الافتراضي
                        </Button>
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCustomActions(presets.finance);
                            }}
                        >
                            المالية
                        </Button>
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCustomActions(presets.locations);
                            }}
                        >
                            المواقع
                        </Button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">الإعدادات الحالية:</h3>
                        <ul className="text-sm space-y-1">
                            <li>⬆️ أعلى: {customActions.top.label}</li>
                            <li>➡️ يمين: {customActions.right.label}</li>
                            <li>⬇️ أسفل: {customActions.bottom.label}</li>
                            <li>⬅️ يسار: {customActions.left.label}</li>
                            <li>🏠 المنتصف: الشاشة الرئيسية</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-lg">كيفية الاستخدام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>1. اضغط في أي مكان على الشاشة (ما عدا الأزرار)</p>
                    <p>2. ستظهر القائمة الدائرية في موضع النقر</p>
                    <p>3. اختر أحد الأقسام الأربعة للإجراءات السريعة</p>
                    <p>4. اضغط على الدائرة الوسطى للعودة للشاشة الرئيسية</p>
                    <p>5. اضغط خارج القائمة لإغلاقها</p>
                </CardContent>
            </Card>

            {/* Radial Menu */}
            <RadialMenu
                isOpen={menuOpen}
                position={menuPosition}
                onClose={() => setMenuOpen(false)}
                onAction={handleAction}
                actions={customActions}
            />
        </div>
    );
};

export default RadialMenuTest;
