import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
    ar: {
        translation: {
            // Dashboard
            dashboard: {
                title: 'لوحة التحكم',
                welcome: 'مرحباً',
                quickStats: 'إحصائيات سريعة',
            },

            // Map
            map: {
                title: 'الخريطة التفاعلية والمواقع',
                quickSave: 'حفظ موقعي',
                search: 'بحث عن مكان (الشارع، المنطقة)...',
                locateMe: 'حدد موقعي',
                save: 'حفظ',
                share: 'مشاركة',
                edit: 'تعديل',
                delete: 'حذف',
                savedLocations: 'المواقع المحفوظة',
                locationName: 'اسم الموقع للحفظ...',
            },

            // Tasks
            tasks: {
                title: 'المهام',
                addTask: 'إضافة مهمة',
                addSubtask: 'إضافة مهمة فرعية',
                completed: 'مكتملة',
                pending: 'قيد التنفيذ',
                priority: 'الأولوية',
                deadline: 'الموعد النهائي',
                progress: 'التقدم',
            },

            // Appointments
            appointments: {
                title: 'المواعيد والتذكيرات',
                addAppointment: 'إضافة موعد',
                date: 'التاريخ',
                time: 'الوقت',
                reminder: 'تذكير',
                location: 'الموقع',
                notes: 'ملاحظات',
            },

            // Finance
            finance: {
                title: 'المراقب المالي',
                balance: 'الرصيد',
                expenses: 'المصروفات',
                income: 'الدخل',
                budget: 'الميزانية',
                addExpense: 'إضافة مصروف',
                addIncome: 'إضافة دخل',
                description: 'الوصف',
                amount: 'المبلغ',
                category: 'الفئة',
            },

            // Prayer
            prayer: {
                title: 'أوقات الصلاة',
                fajr: 'الفجر',
                sunrise: 'الشروق',
                dhuhr: 'الظهر',
                asr: 'العصر',
                maghrib: 'المغرب',
                isha: 'العشاء',
                fetchOnline: 'جلب من الإنترنت',
                export: 'تصدير',
            },

            // Settings
            settings: {
                title: 'الإعدادات',
                language: 'اللغة',
                theme: 'المظهر',
                sync: 'المزامنة',
                backup: 'النسخ الاحتياطي',
                about: 'حول التطبيق',
            },

            // Common
            common: {
                save: 'حفظ',
                cancel: 'إلغاء',
                delete: 'حذف',
                edit: 'تعديل',
                add: 'إضافة',
                search: 'بحث',
                filter: 'تصفية',
                sort: 'ترتيب',
                loading: 'جاري التحميل...',
                error: 'حدث خطأ',
                success: 'نجحت العملية',
                confirm: 'تأكيد',
                yes: 'نعم',
                no: 'لا',
            },

            // Sync
            sync: {
                syncNow: 'مزامنة الآن',
                lastSync: 'آخر مزامنة',
                syncing: 'جاري المزامنة...',
                syncSuccess: 'تمت المزامنة بنجاح',
                syncError: 'فشلت المزامنة',
                pullData: 'سحب البيانات من السحابة',
            },
        },
    },
    es: {
        translation: {
            // Dashboard
            dashboard: {
                title: 'Panel de Control',
                welcome: 'Bienvenido',
                quickStats: 'Estadísticas Rápidas',
            },

            // Map
            map: {
                title: 'Mapa Interactivo y Ubicaciones',
                quickSave: 'Guardar Mi Ubicación',
                search: 'Buscar un lugar (calle, área)...',
                locateMe: 'Ubicarme',
                save: 'Guardar',
                share: 'Compartir',
                edit: 'Editar',
                delete: 'Eliminar',
                savedLocations: 'Ubicaciones Guardadas',
                locationName: 'Nombre de ubicación para guardar...',
            },

            // Tasks
            tasks: {
                title: 'Tareas',
                addTask: 'Agregar Tarea',
                addSubtask: 'Agregar Subtarea',
                completed: 'Completada',
                pending: 'Pendiente',
                priority: 'Prioridad',
                deadline: 'Fecha Límite',
                progress: 'Progreso',
            },

            // Appointments
            appointments: {
                title: 'Citas y Recordatorios',
                addAppointment: 'Agregar Cita',
                date: 'Fecha',
                time: 'Hora',
                reminder: 'Recordatorio',
                location: 'Ubicación',
                notes: 'Notas',
            },

            // Finance
            finance: {
                title: 'Controlador Financiero',
                balance: 'Saldo',
                expenses: 'Gastos',
                income: 'Ingresos',
                budget: 'Presupuesto',
                addExpense: 'Agregar Gasto',
                addIncome: 'Agregar Ingreso',
                description: 'Descripción',
                amount: 'Monto',
                category: 'Categoría',
            },

            // Prayer
            prayer: {
                title: 'Horarios de Oración',
                fajr: 'Fajr',
                sunrise: 'Amanecer',
                dhuhr: 'Dhuhr',
                asr: 'Asr',
                maghrib: 'Maghrib',
                isha: 'Isha',
                fetchOnline: 'Obtener en Línea',
                export: 'Exportar',
            },

            // Settings
            settings: {
                title: 'Configuración',
                language: 'Idioma',
                theme: 'Tema',
                sync: 'Sincronización',
                backup: 'Copia de Seguridad',
                about: 'Acerca de',
            },

            // Common
            common: {
                save: 'Guardar',
                cancel: 'Cancelar',
                delete: 'Eliminar',
                edit: 'Editar',
                add: 'Agregar',
                search: 'Buscar',
                filter: 'Filtrar',
                sort: 'Ordenar',
                loading: 'Cargando...',
                error: 'Error Ocurrido',
                success: 'Éxito',
                confirm: 'Confirmar',
                yes: 'Sí',
                no: 'No',
            },

            // Sync
            sync: {
                syncNow: 'Sincronizar Ahora',
                lastSync: 'Última Sincronización',
                syncing: 'Sincronizando...',
                syncSuccess: 'Sincronización Exitosa',
                syncError: 'Error de Sincronización',
                pullData: 'Descargar Datos de la Nube',
            },
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'ar', // default language
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false, // react already escapes
        },
    });

export default i18n;
