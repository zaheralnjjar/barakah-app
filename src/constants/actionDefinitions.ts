import {
    FileText, ShoppingCart, MapPin, DollarSign, Sparkles,
    CalendarPlus, CheckSquare, Target, Navigation, Timer, LayoutGrid, Wallet, Clock, ListChecks, Calendar, StickyNote, Heart, Pill,
    Bell, Mic, Copy, Coffee, Droplets, Brain, Zap, Moon, Calculator, ExternalLink, Trash2, Plus, Settings, GraduationCap, Users, Search,
    RefreshCw, Link, Phone, AlertTriangle
} from 'lucide-react';

/**
 * Available Actions for Shortcuts
 * تم تنظيف الاختصارات المكررة وتصنيفها بشكل واضح
 */
export const AVAILABLE_ACTIONS = [
    // ===== التنقل والأقسام (فتح النوافذ) =====
    { id: 'nav_dashboard', name: 'الرئيسية', icon: LayoutGrid, category: 'navigation', description: 'فتح شاشة التحكم الرئيسية' },
    { id: 'nav_finance', name: 'المالية', icon: DollarSign, category: 'navigation', description: 'الانتقال للقسم المالي' },
    { id: 'nav_productivity', name: 'الإنتاجية', icon: Target, category: 'navigation', description: 'الانتقال لقسم الإنتاجية' },
    { id: 'nav_notes', name: 'الملاحظات', icon: StickyNote, category: 'navigation', description: 'الانتقال للملاحظات' },
    { id: 'nav_map', name: 'الخريطة', icon: MapPin, category: 'navigation', description: 'فتح الخريطة التفاعلية' },
    { id: 'nav_academic', name: 'الأكاديمية', icon: GraduationCap, category: 'navigation', description: 'الانتقال للأكاديمية' },
    { id: 'nav_islamic', name: 'الإسلاميات', icon: Heart, category: 'navigation', description: 'فتح القسم الإسلامي' },
    { id: 'nav_new_muslims', name: 'هداية', icon: Users, category: 'navigation', description: 'قسم المهتدين الجدد' },
    { id: 'nav_settings', name: 'الإعدادات', icon: Settings, category: 'navigation', description: 'إعدادات التطبيق' },
    { id: 'nav_reports', name: 'التقارير', icon: FileText, category: 'navigation', description: 'فتح مركز التقارير' },

    // ===== ملخصات ومعلومات =====
    { id: 'info_daily', name: 'ملخص اليوم', icon: Brain, category: 'info', description: 'ملخص ذكي لنشاطات اليوم' },
    { id: 'info_monthly', name: 'ملخص الشهر', icon: ListChecks, category: 'info', description: 'تقرير إنجازات الشهر' },
    { id: 'info_balance', name: 'الرصيد', icon: Wallet, category: 'info', description: 'عرض الرصيد المالي الحالي' },
    { id: 'info_prayer', name: 'الصلاة القادمة', icon: Moon, category: 'info', description: 'الوقت المتبقي للصلاة' },
    { id: 'info_tasks', name: 'مهام اليوم', icon: ListChecks, category: 'info', description: 'المهام المتبقية' },

    // ===== إضافة سريعة (إجراءات ذكية) =====
    { id: 'add_task_priority', name: 'مهمة عاجلة', icon: AlertTriangle, category: 'action', description: 'إضافة مهمة ذات أولوية عالية' },
    { id: 'add_task_normal', name: 'مهمة عادية', icon: CheckSquare, category: 'action', description: 'إضافة مهمة جديدة' },
    { id: 'add_expense_quick', name: 'مصروف سريع', icon: DollarSign, category: 'action', description: 'تسجيل عملية مالية سريعة' },
    { id: 'add_note_quick', name: 'ملاحظة سريعة', icon: StickyNote, category: 'action', description: 'إضافة ملاحظة نصية' },
    { id: 'add_voice_quick', name: 'تسجيل صبري', icon: Mic, category: 'action', description: 'إضافة ملاحظة صوتية فورية' },
    { id: 'add_event_quick', name: 'موعد جديد', icon: Calendar, category: 'action', description: 'إضافة موعد أو حدث' },
    { id: 'add_distraction_log', name: 'سجل تشتت', icon: Zap, category: 'action', description: 'تسجيل تشتت فوري' },

    // ===== المؤقتات (إجراءات ذكية) =====
    { id: 'timer_focus', name: 'مؤقت تركيز', icon: Timer, category: 'timer', description: 'بدء جلسة بومودورو' },
    { id: 'timer_5', name: 'مؤقت 5د', icon: Clock, category: 'timer', description: 'مؤقت لـ 5 دقائق' },
    { id: 'timer_15', name: 'مؤقت 15د', icon: Clock, category: 'timer', description: 'مؤقت لـ 15 دقيقة' },
    { id: 'timer_30', name: 'مؤقت 30د', icon: Clock, category: 'timer', description: 'مؤقت لـ 30 دقيقة' },
    { id: 'timer_60', name: 'مؤقت ساعة', icon: Clock, category: 'timer', description: 'مؤقت لمدة ساعة' },

    // ===== الموقع والخرائط =====
    { id: 'loc_save_current', name: 'حفظ موقعي', icon: MapPin, category: 'location', description: 'حفظ الموقع الحالي' },
    { id: 'loc_save_parking', name: 'حفظ الموقف', icon: Navigation, category: 'location', description: 'حفظ مكان ركن السيارة' },
    { id: 'loc_find_car', name: 'أين السيارة؟', icon: Navigation, category: 'location', description: 'الملاحة لموقع السيارة' },
    { id: 'loc_share', name: 'مشاركة موقعي', icon: Copy, category: 'location', description: 'نسخ رابط الموقع' },

    // ===== أدوات النظام =====
    { id: 'sys_sync', name: 'مزامنة', icon: RefreshCw, category: 'system', description: 'تحديث البيانات' },
    { id: 'sys_calc', name: 'حاسبة', icon: Calculator, category: 'system', description: 'فتح الآلة الحاسبة' },
    { id: 'sys_clean', name: 'وضع التنظيف', icon: LayoutGrid, category: 'system', description: 'تبديل وضع العرض الصافي' },

    // ===== للتوافق العكسي (Aliases) - ستُزال لاحقاً =====
    // These are kept for backward compatibility with existing user shortcuts
    { id: 'timer', name: 'مؤقت', icon: Timer, category: 'alias', description: 'مؤقت التركيز', aliasFor: 'start_pomodoro' },
    { id: 'event', name: 'حدث', icon: Sparkles, category: 'alias', description: 'إضافة حدث', aliasFor: 'add_event' },
    { id: 'expense', name: 'مصروف', icon: DollarSign, category: 'alias', description: 'تسجيل مصروف', aliasFor: 'add_expense' },
    { id: 'location', name: 'موقع', icon: MapPin, category: 'alias', description: 'حفظ موقع', aliasFor: 'save_location_current' },
    { id: 'note', name: 'ملاحظة', icon: StickyNote, category: 'alias', description: 'إضافة ملاحظة', aliasFor: 'add_note' },
    { id: 'shopping', name: 'تسوق', icon: ShoppingCart, category: 'alias', description: 'قائمة التسوق', aliasFor: 'show_shopping' },
];

// Get action by ID
export const getActionById = (id: string) => AVAILABLE_ACTIONS.find(a => a.id === id);

// Get all non-alias actions (for display in shortcut customizer)
export const getMainActions = () => AVAILABLE_ACTIONS.filter(a => a.category !== 'alias');

// Get actions by category
export const getActionsByCategory = (category: string) =>
    AVAILABLE_ACTIONS.filter(a => a.category === category);

// Categories with Arabic names
export const ACTION_CATEGORIES = {
    navigation: 'التنقل',
    info: 'المعلومات',
    action: 'الإضافة السريعة',
    timer: 'المؤقتات',
    location: 'الموقع',
    system: 'النظام',
    productivity: 'الإنتاجية',
    reminder: 'التذكيرات',
    alias: 'مستعارات',
};
