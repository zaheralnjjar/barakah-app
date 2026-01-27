import {
    FileText, ShoppingCart, MapPin, DollarSign, Sparkles,
    CalendarPlus, CheckSquare, Target, Navigation, Timer, LayoutGrid, Wallet, Clock, ListChecks, Calendar, StickyNote, Heart, Pill,
    Bell, Mic, Copy, Coffee, Droplets, Brain, Zap, Moon, Calculator, ExternalLink, Trash2, Plus, Settings, GraduationCap, Users, Search,
    RefreshCw, Link, Phone
} from 'lucide-react';

/**
 * Available Actions for Shortcuts
 * تم تنظيف الاختصارات المكررة وتصنيفها بشكل واضح
 */
export const AVAILABLE_ACTIONS = [
    // ===== التنقل والأقسام =====
    { id: 'show_new_muslims', name: 'المهتدين', icon: Users, category: 'navigation', description: 'الانتقال إلى قسم هداية' },
    { id: 'open_academic', name: 'الأكاديمية', icon: GraduationCap, category: 'navigation', description: 'الانتقال إلى الأكاديمية' },
    { id: 'open_settings', name: 'الإعدادات', icon: Settings, category: 'navigation', description: 'إعدادات التطبيق' },
    { id: 'toggle_clean_mode', name: 'إخفاء/إظهار', icon: LayoutGrid, category: 'navigation', description: 'تبديل وضع العرض' },
    { id: 'open_tools', name: 'تخصيص', icon: Sparkles, category: 'navigation', description: 'تخصيص الاختصارات والأدوات' },
    { id: 'search', name: 'بحث', icon: Search, category: 'navigation', description: 'البحث في التطبيق' },

    // ===== ملخصات ومعلومات =====
    { id: 'daily_summary', name: 'ملخص اليوم', icon: Brain, category: 'info', description: 'ملخص ذكي لنشاطات اليوم' },
    { id: 'show_monthly_summary', name: 'ملخص الشهر', icon: ListChecks, category: 'info', description: 'تقرير إنجازات الشهر' },
    { id: 'show_balance', name: 'الرصيد المالي', icon: Wallet, category: 'info', description: 'عرض الرصيد الحالي والمتبقي اليومي' },
    { id: 'finance_summary', name: 'ملخص مالي', icon: Wallet, category: 'info', description: 'عرض ملخص المصاريف لليوم' },
    { id: 'show_next_prayer', name: 'الصلاة القادمة', icon: Moon, category: 'info', description: 'عرض الصلاة القادمة والوقت المتبقي' },
    { id: 'show_tasks', name: 'مهام اليوم', icon: ListChecks, category: 'info', description: 'عرض المهام المتبقية اليوم' },
    { id: 'show_appointments', name: 'المواعيد', icon: Calendar, category: 'info', description: 'عرض المواعيد القادمة' },
    { id: 'show_shopping', name: 'التسوق', icon: ShoppingCart, category: 'info', description: 'عرض نواقص قائمة التسوق' },
    { id: 'show_medications', name: 'الأدوية', icon: Pill, category: 'info', description: 'عرض الأدوية المطلوبة اليوم' },
    { id: 'show_habits', name: 'العادات', icon: Heart, category: 'info', description: 'عرض العادات المطلوب إنجازها' },

    // ===== إضافة سريعة =====
    { id: 'add_task', name: 'مهمة جديدة', icon: CheckSquare, category: 'action', description: 'إضافة مهمة جديدة بسرعة' },
    { id: 'add_expense', name: 'مصروف جديد', icon: DollarSign, category: 'action', description: 'تسجيل عملية مالية' },
    { id: 'add_note', name: 'ملاحظة جديدة', icon: StickyNote, category: 'action', description: 'إضافة ملاحظة' },
    { id: 'add_event', name: 'موعد جديد', icon: Calendar, category: 'action', description: 'إضافة موعد أو حدث جديد' },
    { id: 'add_shopping', name: 'صنف تسوق', icon: ShoppingCart, category: 'action', description: 'إضافة صنف للتسوق' },
    { id: 'brain_dump', name: 'تفريغ ذهني', icon: Brain, category: 'action', description: 'كتابة ملاحظة سريعة لتفريغ الأفكار' },

    // ===== المؤقتات =====
    { id: 'start_pomodoro', name: 'مؤقت التركيز', icon: Timer, category: 'timer', description: 'بدء جلسة بومودورو' },
    { id: 'quick_timer_5', name: 'مؤقت 5 دقائق', icon: Timer, category: 'timer', description: 'بدء مؤقت سريع لـ 5 دقائق' },

    // ===== الموقع والخرائط =====
    { id: 'save_parking', name: 'حفظ موقف السيارة', icon: Navigation, category: 'location', description: 'حفظ موقع السيارة الحالي' },
    { id: 'find_car', name: 'أين سيارتي؟', icon: Navigation, category: 'location', description: 'الملاحة لموقع السيارة المحفوظ' },
    { id: 'save_location_current', name: 'حفظ موقعي', icon: MapPin, category: 'location', description: 'حفظ الموقع الحالي في القائمة' },
    { id: 'share_location', name: 'مشاركة موقعي', icon: Copy, category: 'location', description: 'نسخ رابط الموقع الحالي' },
    { id: 'copy_coords', name: 'نسخ الإحداثيات', icon: Copy, category: 'location', description: 'نسخ إحداثيات الموقع الحالي' },
    { id: 'open_map', name: 'فتح الخريطة', icon: MapPin, category: 'location', description: 'فتح خرائط جوجل في موقعي' },

    // ===== أدوات النظام =====
    { id: 'sync_now', name: 'مزامنة', icon: RefreshCw, category: 'system', description: 'تحديث البيانات يدوياً' },
    { id: 'power_mode', name: 'توفير الطاقة', icon: Zap, category: 'system', description: 'تقليل المؤثرات البصرية' },
    { id: 'clear_cache', name: 'تنظيف الذاكرة', icon: Trash2, category: 'system', description: 'إصلاح مشاكل العرض' },
    { id: 'show_calculator', name: 'آلة حاسبة', icon: Calculator, category: 'system', description: 'فتح الآلة الحاسبة' },

    // ===== الإنتاجية =====
    { id: 'log_distraction', name: 'سجل تشتت', icon: Zap, category: 'productivity', description: 'تسجيل سبب التشتت الحالي' },
    { id: 'remind_water', name: 'تذكير الماء', icon: Droplets, category: 'productivity', description: 'تذكير لشرب الماء' },

    // ===== تذكيرات =====
    { id: 'remind_5min', name: 'تذكير 5 دقائق', icon: Bell, category: 'reminder', description: 'تنبيه بعد 5 دقائق' },

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
