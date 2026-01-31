import {
    FileText, ShoppingCart, MapPin, DollarSign, Sparkles,
    CalendarPlus, CheckSquare, Target, Navigation, Timer, LayoutGrid, Wallet, Clock, ListChecks, Calendar, StickyNote, Heart, Pill,
    Bell, Mic, Copy, Coffee, Droplets, Brain, Zap, Moon, Calculator, ExternalLink, Trash2, Plus, Settings, GraduationCap, Users, Search,
    RefreshCw, Link, Phone, AlertTriangle, Package
} from 'lucide-react';

/**
 * Available Actions for Shortcuts
 * تم تنظيف الاختصارات المكررة وتصنيفها بشكل واضح
 */
export const AVAILABLE_ACTIONS = [
    // ===== التنقل والأقسام (فتح النوافذ) =====
    { id: 'nav_dashboard', name: 'الرئيسية', icon: LayoutGrid, iconName: 'LayoutGrid', category: 'navigation', description: 'فتح شاشة التحكم الرئيسية' },
    { id: 'nav_finance', name: 'المالية', icon: DollarSign, iconName: 'DollarSign', category: 'navigation', description: 'الانتقال للقسم المالي' },
    { id: 'nav_productivity', name: 'الإنتاجية', icon: Target, iconName: 'Target', category: 'navigation', description: 'الانتقال لقسم الإنتاجية' },
    { id: 'nav_notes', name: 'الملاحظات', icon: StickyNote, iconName: 'StickyNote', category: 'navigation', description: 'الانتقال للملاحظات' },
    { id: 'nav_map', name: 'الخريطة', icon: MapPin, iconName: 'MapPin', category: 'navigation', description: 'فتح الخريطة التفاعلية' },
    { id: 'nav_academic', name: 'الأكاديمية', icon: GraduationCap, iconName: 'GraduationCap', category: 'navigation', description: 'الانتقال للأكاديمية' },
    { id: 'nav_islamic', name: 'الإسلاميات', icon: Heart, iconName: 'Heart', category: 'navigation', description: 'فتح القسم الإسلامي' },
    { id: 'nav_new_muslims', name: 'هداية', icon: Users, iconName: 'Users', category: 'navigation', description: 'قسم المهتدين الجدد' },
    { id: 'nav_settings', name: 'الإعدادات', icon: Settings, iconName: 'Settings', category: 'navigation', description: 'إعدادات التطبيق' },
    { id: 'nav_reports', name: 'التقارير', icon: FileText, iconName: 'FileText', category: 'navigation', description: 'فتح مركز التقارير' },

    // ===== ملخصات ومعلومات =====
    { id: 'info_daily', name: 'ملخص اليوم', icon: Brain, iconName: 'Brain', category: 'info', description: 'ملخص ذكي لنشاطات اليوم' },
    { id: 'info_monthly', name: 'ملخص الشهر', icon: ListChecks, iconName: 'ListChecks', category: 'info', description: 'تقرير إنجازات الشهر' },
    { id: 'info_balance', name: 'الرصيد', icon: Wallet, iconName: 'Wallet', category: 'info', description: 'عرض الرصيد المالي الحالي' },
    { id: 'info_prayer', name: 'الصلاة القادمة', icon: Moon, iconName: 'Moon', category: 'info', description: 'الوقت المتبقي للصلاة' },
    { id: 'info_tasks', name: 'مهام اليوم', icon: ListChecks, iconName: 'ListChecks', category: 'info', description: 'المهام المتبقية' },

    // ===== إضافة سريعة (إجراءات ذكية) =====
    { id: 'add_task_priority', name: 'مهمة عاجلة', icon: AlertTriangle, iconName: 'AlertTriangle', category: 'action', description: 'إضافة مهمة ذات أولوية عالية' },
    { id: 'add_task_normal', name: 'مهمة عادية', icon: CheckSquare, iconName: 'CheckSquare', category: 'action', description: 'إضافة مهمة جديدة' },
    { id: 'add_expense_quick', name: 'مصروف سريع', icon: DollarSign, iconName: 'DollarSign', category: 'action', description: 'تسجيل عملية مالية سريعة' },
    { id: 'add_note_quick', name: 'ملاحظة سريعة', icon: StickyNote, iconName: 'StickyNote', category: 'action', description: 'إضافة ملاحظة نصية' },
    { id: 'add_voice_quick', name: 'تسجيل صبري', icon: Mic, iconName: 'Mic', category: 'action', description: 'إضافة ملاحظة صوتية فورية' },
    { id: 'add_event_quick', name: 'موعد جديد', icon: Calendar, iconName: 'Calendar', category: 'action', description: 'إضافة موعد أو حدث' },
    { id: 'add_distraction_log', name: 'سجل نشاط', icon: Zap, iconName: 'Zap', category: 'action', description: 'تسجيل نشاط فوري' },

    // ===== المؤقتات (إجراءات ذكية) =====
    { id: 'timer_focus', name: 'مؤقت تركيز', icon: Timer, iconName: 'Timer', category: 'timer', description: 'بدء جلسة بومودورو' },
    { id: 'timer_5', name: 'مؤقت 5د', icon: Clock, iconName: 'Clock', category: 'timer', description: 'مؤقت لـ 5 دقائق' },
    { id: 'timer_15', name: 'مؤقت 15د', icon: Clock, iconName: 'Clock', category: 'timer', description: 'مؤقت لـ 15 دقيقة' },
    { id: 'timer_30', name: 'مؤقت 30د', icon: Clock, iconName: 'Clock', category: 'timer', description: 'مؤقت لـ 30 دقيقة' },
    { id: 'timer_60', name: 'مؤقت ساعة', icon: Clock, iconName: 'Clock', category: 'timer', description: 'مؤقت لمدة ساعة' },

    // ===== الموقع والخرائط =====
    { id: 'loc_add_new', name: 'الموقع بالتفصيل', icon: MapPin, iconName: 'MapPin', category: 'location', description: 'فتح نافذة إضافة موقع جديد بالتفصيل' },
    { id: 'loc_direct_detailed', name: 'الموقع المباشر', icon: Navigation, iconName: 'Navigation', category: 'location', description: 'فتح نافذة الموقع المباشر فوراً' },
    { id: 'loc_save_current', name: 'حفظ موقعي', icon: MapPin, iconName: 'MapPin', category: 'location', description: 'حفظ الموقع الحالي' },
    { id: 'loc_save_parking', name: 'حفظ الموقف', icon: Navigation, iconName: 'Navigation', category: 'location', description: 'حفظ مكان ركن السيارة' },
    { id: 'loc_find_car', name: 'أين السيارة؟', icon: Navigation, iconName: 'Navigation', category: 'location', description: 'الملاحة لموقع السيارة' },
    { id: 'loc_share', name: 'مشاركة موقعي', icon: Copy, iconName: 'Copy', category: 'location', description: 'نسخ رابط الموقع' },
    { id: 'loc_shipping', name: 'موقع شحن', icon: Package, iconName: 'Package', category: 'location', description: 'حفظ موقع شحن' },

    // ===== أدوات النظام =====
    { id: 'sys_sync', name: 'مزامنة سحابية', icon: RefreshCw, iconName: 'RefreshCw', category: 'system', description: 'تحديث البيانات يدوياً' },
    { id: 'sys_calc', name: 'الآلة الحاسبة', icon: Calculator, iconName: 'Calculator', category: 'system', description: 'فتح الحاسبة السريعة' },
    { id: 'sys_clean', name: 'وضع التركيز', icon: LayoutGrid, iconName: 'LayoutGrid', category: 'system', description: 'إخفاء العناصر المشتتة' },
    { id: 'sys_settings', name: 'إعدادات النظام', icon: Settings, iconName: 'Settings', category: 'system', description: 'تخصيص التطبيق' },

    // ===== الإنتاجية ( Productivity) =====
    { id: 'prod_distraction', name: 'تسجيل نشاط', icon: Zap, iconName: 'Zap', category: 'productivity', description: 'سجل نشاطك الحالي' },
    { id: 'prod_water', name: 'شرب ماء', icon: Droplets, iconName: 'Droplets', category: 'productivity', description: 'تسجيل كوب ماء' },
    { id: 'prod_pomo', name: 'بدء بومودورو', icon: Timer, iconName: 'Timer', category: 'productivity', description: 'جلسة تركيز 25 دقيقة' },
    { id: 'prod_reading', name: 'وقت قراءة', icon: FileText, iconName: 'FileText', category: 'productivity', description: 'بدء مؤقت قراءة' },

    // ===== الإسلاميات (Islamic) =====
    { id: 'islam_mushaf', name: 'المصحف', icon: FileText, iconName: 'FileText', category: 'islamic', description: 'فتح القرآن الكريم' },
    { id: 'islam_adhkar', name: 'الأذكار', icon: Heart, iconName: 'Heart', category: 'islamic', description: 'أذكار الصباح والمساء' },
    { id: 'islam_tasbih', name: 'المسبحة', icon: RefreshCw, iconName: 'RefreshCw', category: 'islamic', description: 'التسبيح الإلكتروني' },
    { id: 'islam_qibla', name: 'القبلة', icon: Navigation, iconName: 'Navigation', category: 'islamic', description: 'تحديد اتجاه القبلة' },

    // ===== التذكيرات (Reminders) =====
    { id: 'remind_5', name: 'تنبيه 5 دقائق', icon: Bell, iconName: 'Bell', category: 'reminder', description: 'تذكير بعد 5 دقائق' },
    { id: 'remind_15', name: 'تنبيه 15 دقيقة', icon: Bell, iconName: 'Bell', category: 'reminder', description: 'تذكير بعد 15 دقيقة' },
    { id: 'remind_pill', name: 'موعد دواء', icon: Pill, iconName: 'Pill', category: 'reminder', description: 'تذكير بأخذ الدواء' },

    // ===== للتوافق العكسي (Aliases) =====
    { id: 'timer', name: 'مؤقت', icon: Timer, iconName: 'Timer', category: 'alias', description: 'مؤقت التركيز', aliasFor: 'start_pomodoro' },
    { id: 'event', name: 'حدث', icon: Sparkles, iconName: 'Sparkles', category: 'alias', description: 'إضافة حدث', aliasFor: 'add_event' },
    { id: 'expense', name: 'مصروف', icon: DollarSign, iconName: 'DollarSign', category: 'alias', description: 'تسجيل مصروف', aliasFor: 'add_expense' },
    { id: 'location', name: 'موقع', icon: MapPin, iconName: 'MapPin', category: 'alias', description: 'حفظ موقع', aliasFor: 'save_location_current' },
    { id: 'note', name: 'ملاحظة', icon: StickyNote, iconName: 'StickyNote', category: 'alias', description: 'إضافة ملاحظة', aliasFor: 'add_note' },
    { id: 'shopping', name: 'تسوق', icon: ShoppingCart, iconName: 'ShoppingCart', category: 'alias', description: 'قائمة التسوق', aliasFor: 'show_shopping' },
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
    navigation: 'النوافذ والتنقل',
    action: 'إجراءات ذكية',
    info: 'ملخصات ومعلومات',
    timer: 'المؤقتات',
    location: 'الموقع والخرائط',
    system: 'النظام والأدوات',
    productivity: 'الإنتاجية والتركيز',
    islamic: 'القسم الإسلامي',
    reminder: 'التنبيهات والتذكير',
    alias: 'مستعارات',
};
