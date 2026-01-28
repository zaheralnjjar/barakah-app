import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useSystemModes } from '@/hooks/useSystemModes';
import {
    Sparkles, X, Plus, Settings, Trash2,
    Clock, Calendar, DollarSign, Wallet, ListTodo, Bell, MapPin, ShoppingCart,
    Calculator, Timer, Mic, FileText, Moon, Sun, Target, Heart, Pill,
    Copy, ExternalLink, Zap, Brain, Coffee, Droplets
} from 'lucide-react';

// Available Actions Library (25+ options)
const AVAILABLE_ACTIONS = [
    // Information Display
    { id: 'show_time', name: 'الوقت والتاريخ', icon: Clock, category: 'info', description: 'عرض الوقت الحالي والتاريخ الهجري' },
    { id: 'show_balance', name: 'الرصيد المالي', icon: Wallet, category: 'info', description: 'عرض الرصيد الحالي والمتبقي اليومي' },
    { id: 'show_dollar', name: 'سعر الدولار', icon: DollarSign, category: 'info', description: 'عرض سعر الدولار الرسمي والبلو' },
    { id: 'show_next_prayer', name: 'الصلاة القادمة', icon: Moon, category: 'info', description: 'عرض الصلاة القادمة والوقت المتبقي' },
    { id: 'show_today_tasks', name: 'مهام اليوم', icon: ListTodo, category: 'info', description: 'عرض عدد المهام المتبقية لليوم' },
    { id: 'show_appointments', name: 'المواعيد القادمة', icon: Calendar, category: 'info', description: 'عرض أقرب موعد قادم' },
    { id: 'show_shopping', name: 'قائمة التسوق', icon: ShoppingCart, category: 'info', description: 'عرض عدد العناصر في قائمة التسوق' },
    { id: 'show_medications', name: 'الأدوية', icon: Pill, category: 'info', description: 'عرض الأدوية المطلوبة اليوم' },
    { id: 'show_habits', name: 'العادات', icon: Heart, category: 'info', description: 'عرض تقدم العادات اليومية' },
    { id: 'show_goals', name: 'الأهداف', icon: Target, category: 'info', description: 'عرض تقدم الأهداف الحالية' },

    // Quick Actions
    { id: 'add_expense', name: 'إضافة مصروف', icon: DollarSign, category: 'action', description: 'إضافة مصروف سريع' },
    { id: 'add_task', name: 'إضافة مهمة', icon: ListTodo, category: 'action', description: 'إضافة مهمة جديدة' },
    { id: 'add_note', name: 'ملاحظة صوتية', icon: Mic, category: 'action', description: 'تسجيل ملاحظة صوتية' },
    { id: 'save_parking', name: 'حفظ موقف', icon: MapPin, category: 'action', description: 'حفظ موقف السيارة الحالي' },
    { id: 'start_pomodoro', name: 'بومودورو', icon: Timer, category: 'action', description: 'بدء مؤقت تركيز 25 دقيقة' },
    { id: 'add_shopping', name: 'للتسوق', icon: ShoppingCart, category: 'action', description: 'إضافة عنصر لقائمة التسوق' },
    { id: 'copy_location', name: 'نسخ موقعي', icon: Copy, category: 'action', description: 'نسخ رابط الموقع الحالي' },
    { id: 'open_map', name: 'فتح الخريطة', icon: ExternalLink, category: 'action', description: 'فتح الموقع على الخريطة' },

    // Calculators
    { id: 'calc_currency', name: 'تحويل العملات', icon: Calculator, category: 'calc', description: 'حاسبة تحويل ARS ↔ USD' },
    { id: 'calc_percentage', name: 'حساب النسبة', icon: Calculator, category: 'calc', description: 'حاسبة النسبة المئوية' },
    { id: 'calc_age', name: 'حساب العمر', icon: Calendar, category: 'calc', description: 'حساب العمر بالهجري والميلادي' },
    { id: 'calc_days', name: 'الفرق بين تاريخين', icon: Calendar, category: 'calc', description: 'حساب عدد الأيام بين تاريخين' },

    // Reminders
    { id: 'remind_5min', name: 'تذكير 5 دقائق', icon: Bell, category: 'remind', description: 'تذكير بعد 5 دقائق' },
    { id: 'remind_15min', name: 'تذكير 15 دقيقة', icon: Bell, category: 'remind', description: 'تذكير بعد 15 دقيقة' },
    { id: 'remind_1hour', name: 'تذكير ساعة', icon: Bell, category: 'remind', description: 'تذكير بعد ساعة' },
    { id: 'remind_water', name: 'شرب الماء', icon: Droplets, category: 'remind', description: 'تذكير بشرب الماء كل ساعة' },
    { id: 'remind_break', name: 'استراحة', icon: Coffee, category: 'remind', description: 'تذكير بأخذ استراحة' },

    // AI/Smart
    { id: 'daily_summary', name: 'ملخص اليوم', icon: Brain, category: 'smart', description: 'ملخص ذكي لنشاطات اليوم' },
    { id: 'quick_insights', name: 'رؤى سريعة', icon: Zap, category: 'smart', description: 'تحليل سريع للمصاريف والمهام' },
];

interface CustomButton {
    id: string;
    actionId: string;
    order: number;
}

interface SmartAssistantFABProps {
    onNavigateToTab: (tab: string) => void;
    onOpenVoiceRecorder?: () => void;
    onQuickParking?: () => void;
    onOpenTimer?: () => void;
}

const SmartAssistantFAB: React.FC<SmartAssistantFABProps> = ({
    onNavigateToTab,
    onOpenVoiceRecorder,
    onQuickParking,
    onOpenTimer
}) => {
    const { toast } = useToast();
    const { nextPrayer, timeUntilNext } = usePrayerTimes();
    const { financeData, dailyLimit } = useFinance();

    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showActionResult, setShowActionResult] = useState<{ title: string; content: string } | null>(null);
    const [customButtons, setCustomButtons] = useState<CustomButton[]>(() => {
        try {
            const saved = localStorage.getItem('baraka_smart_buttons');
            return saved ? JSON.parse(saved) : [
                { id: '1', actionId: 'show_next_prayer', order: 0 },
                { id: '2', actionId: 'show_balance', order: 1 },
                { id: '3', actionId: 'add_note', order: 2 },
            ];
        } catch { return []; }
    });

    // System Modes Integration
    const { modes } = useSystemModes();
    const activeMode = modes.find(m => m.is_active);
    const modeFabSettings = activeMode?.fab_settings;

    // Determine visibility
    const isVisible = modeFabSettings?.visible !== false; // Default to true if undefined

    // Save to localStorage (only if not in a mode that overrides this temporarily)
    useEffect(() => {
        if (!activeMode) {
            localStorage.setItem('baraka_smart_buttons', JSON.stringify(customButtons));
        }
    }, [customButtons, activeMode]);


    // Execute Action
    const executeAction = (actionId: string) => {
        const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
        if (!action) return;

        switch (actionId) {
            case 'show_time':
                const now = new Date();
                const hijri = now.toLocaleDateString('ar-SA-u-ca-islamic', { dateStyle: 'full' });
                setShowActionResult({
                    title: 'الوقت والتاريخ',
                    content: `🕐 ${now.toLocaleTimeString('ar-SA')}\n📅 ${now.toLocaleDateString('ar-SA', { dateStyle: 'full' })}\n🌙 ${hijri}`
                });
                break;

            case 'show_balance':
                const balance = financeData?.current_balance_ars || 0;
                const remaining = dailyLimit || 0;
                setShowActionResult({
                    title: 'الرصيد المالي',
                    content: `💰 الرصيد: ${balance.toLocaleString()} ARS\n📊 الحد اليومي المتبقي: ${remaining.toLocaleString()} ARS`
                });
                break;

            case 'show_dollar':
                fetch('https://dolarapi.com/v1/dolares/oficial')
                    .then(r => r.json())
                    .then(official => {
                        fetch('https://dolarapi.com/v1/dolares/blue')
                            .then(r => r.json())
                            .then(blue => {
                                setShowActionResult({
                                    title: 'سعر الدولار',
                                    content: `🏦 الرسمي: ${official.venta} ARS\n💵 البلو: ${blue.venta} ARS`
                                });
                            });
                    });
                break;

            case 'show_next_prayer':
                setShowActionResult({
                    title: 'الصلاة القادمة',
                    content: `🕌 ${nextPrayer?.nameAr || 'غير متاح'}\n⏱️ المتبقي: ${timeUntilNext || '--:--'}`
                });
                break;

            case 'add_note':
                setIsExpanded(false);
                if (onOpenVoiceRecorder) onOpenVoiceRecorder();
                break;

            case 'save_parking':
                setIsExpanded(false);
                if (onQuickParking) onQuickParking();
                toast({ title: '🅿️ تم حفظ موقف السيارة' });
                break;

            case 'start_pomodoro':
                setIsExpanded(false);
                if (onOpenTimer) onOpenTimer();
                break;

            case 'copy_location':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: '📍 تم نسخ رابط الموقع' });
                    });
                }
                setIsExpanded(false);
                break;

            case 'remind_5min':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت 5 دقائق' });
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تذكير البركة', { body: 'مضت 5 دقائق!' });
                    }
                }, 5 * 60 * 1000);
                toast({ title: '✅ تم ضبط التذكير لـ 5 دقائق' });
                setIsExpanded(false);
                break;

            case 'remind_15min':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت 15 دقيقة' });
                }, 15 * 60 * 1000);
                toast({ title: '✅ تم ضبط التذكير لـ 15 دقيقة' });
                setIsExpanded(false);
                break;

            case 'remind_1hour':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت ساعة' });
                }, 60 * 60 * 1000);
                toast({ title: '✅ تم ضبط التذكير لساعة' });
                setIsExpanded(false);
                break;

            case 'remind_water':
                toast({ title: '💧 تذكير بشرب الماء كل ساعة', description: 'سيتم تذكيرك' });
                setIsExpanded(false);
                break;

            default:
                toast({ title: action.name, description: action.description });
                setIsExpanded(false);
        }
    };

    const addButton = (actionId: string) => {
        if (customButtons.some(b => b.actionId === actionId)) {
            toast({ title: 'هذا الزر موجود مسبقاً' });
            return;
        }
        const newButton: CustomButton = {
            id: Date.now().toString(),
            actionId,
            order: customButtons.length
        };
        setCustomButtons([...customButtons, newButton]);
        toast({ title: '✅ تم إضافة الزر' });
    };

    const removeButton = (id: string) => {
        setCustomButtons(customButtons.filter(b => b.id !== id));
    };

    const getActionById = (actionId: string) => AVAILABLE_ACTIONS.find(a => a.id === actionId);

    if (!isVisible) return null;

    return (
        <>
            {/* Floating Button - Fixed at Bottom Center */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

                {/* Expanded Shortcuts - Horizontal Bar */}
                {isExpanded && (
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-xl rounded-full px-4 py-2 border border-gray-200 animate-in slide-in-from-bottom-2 duration-300">
                        {customButtons.map((btn) => {
                            const action = getActionById(btn.actionId);
                            if (!action) return null;
                            const Icon = action.icon;
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => executeAction(btn.actionId)}
                                    title={action.name}
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${action.category === 'info' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' :
                                        action.category === 'action' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' :
                                            action.category === 'calc' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' :
                                                action.category === 'remind' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' :
                                                    'bg-pink-100 text-pink-600 hover:bg-pink-200'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}

                        {/* Settings Button */}
                        <button
                            onClick={() => { setShowSettings(true); setIsExpanded(false); }}
                            className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                            title="تخصيص"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Main FAB Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-4 rounded-full shadow-xl transition-all duration-300 ${isExpanded
                        ? 'bg-gray-800 text-white rotate-45'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:scale-110 hover:shadow-2xl'
                        }`}
                >
                    {isExpanded ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </button>
            </div>

            {/* Action Result Dialog */}
            <Dialog open={showActionResult !== null} onOpenChange={() => setShowActionResult(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-right">
                            <Zap className="w-5 h-5 text-emerald-500" />
                            {showActionResult?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-line leading-relaxed text-gray-700">
                        {showActionResult?.content}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-right">
                            <Settings className="w-5 h-5 text-gray-500" />
                            اختصارات مخصصة
                        </DialogTitle>
                    </DialogHeader>

                    {/* Current Buttons */}
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 mb-2">الأزرار الحالية ({customButtons.length})</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {customButtons.map((btn) => {
                                const action = getActionById(btn.actionId);
                                if (!action) return null;
                                const Icon = action.icon;
                                return (
                                    <div key={btn.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">{action.name}</span>
                                        </div>
                                        <button
                                            onClick={() => removeButton(btn.id)}
                                            className="p-1 text-red-400 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Available Actions */}
                    <div className="flex-1 overflow-y-auto">
                        <h4 className="text-xs font-bold text-gray-500 mb-2">إضافة زر جديد</h4>

                        {['info', 'action', 'calc', 'remind', 'smart'].map(category => (
                            <div key={category} className="mb-3">
                                <Badge variant="outline" className="mb-2 text-[10px]">
                                    {category === 'info' ? '📊 عرض معلومات' :
                                        category === 'action' ? '⚡ إجراءات سريعة' :
                                            category === 'calc' ? '🧮 حاسبات' :
                                                category === 'remind' ? '🔔 تذكيرات' : '🧠 ذكي'}
                                </Badge>
                                <div className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_ACTIONS.filter(a => a.category === category).map(action => {
                                        const isAdded = customButtons.some(b => b.actionId === action.id);
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.id}
                                                onClick={() => !isAdded && addButton(action.id)}
                                                disabled={isAdded}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-right transition-all ${isAdded
                                                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                                    : 'bg-white border-gray-100 hover:border-emerald-300 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">{action.name}</p>
                                                    <p className="text-[9px] text-gray-400 truncate">{action.description}</p>
                                                </div>
                                                {!isAdded && <Plus className="w-3 h-3 text-emerald-500 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SmartAssistantFAB;
