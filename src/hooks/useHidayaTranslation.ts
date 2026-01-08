import { useState, useEffect } from 'react';

type Language = 'ar' | 'es';

const translations: Record<Language, Record<string, string>> = {
    ar: {
        login: 'تسجيل الدخول',
        signup: 'تسجيل حساب جديد',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        loading: 'جاري التحميل...',
        logout: 'تسجيل الخروج',
        sync: 'مزامنة',
        sync_now: 'مزامنة البيانات الآن',
        syncing: 'جاري المزامنة...',
        settings: 'الإعدادات',
        notes: 'الملاحظات',
        appointments: 'المواعيد',
        hidaya: 'هداية',
        app_info: 'معلومات التطبيق',
        version: 'الإصدار',
        language: 'اللغة',
        arabic: 'العربية',
        spanish: 'Español (الإسبانية)',
        account_info: 'معلومات الحساب',
        logged_in: 'مسجل الدخول',
        or_long_press: 'أو اضغط باستمرار على أيقونة الإعدادات',
        refresh_app: 'تحديث التطبيق',
        voice_note: 'ملاحظة صوتية',
        search: 'بحث',
        welcome: 'مرحباً',
        guest: 'ضيف',
        education_plan: 'خطة التعليم والمناهج',
        print: 'طباعة'
    },
    es: {
        login: 'Iniciar sesión',
        signup: 'Registrarse',
        email: 'Correo electrónico',
        password: 'Contraseña',
        loading: 'Cargando...',
        logout: 'Cerrar sesión',
        sync: 'Sincronización',
        sync_now: 'Sincronizar ahora',
        syncing: 'Sincronizando...',
        settings: 'Ajustes',
        notes: 'Notas',
        appointments: 'Citas',
        hidaya: 'Hidaya',
        app_info: 'Info de la App',
        version: 'Versión',
        language: 'Idioma',
        arabic: 'Árabe (Arabé)',
        spanish: 'Español',
        account_info: 'Cuenta',
        logged_in: 'Conectado',
        or_long_press: 'O mantén pulsado ajustes',
        refresh_app: 'Actualizar App',
        voice_note: 'Nota de voz',
        search: 'Buscar',
        welcome: 'Hola',
        guest: 'Invitado',
        education_plan: 'Plan de Estudios',
        print: 'Imprimir'
    }
};

export const useHidayaTranslation = () => {
    const [language, setLanguage] = useState<Language>('ar');

    useEffect(() => {
        const stored = localStorage.getItem('hidaya_lang') as Language;
        if (stored && (stored === 'ar' || stored === 'es')) {
            setLanguage(stored);
        }
    }, []);

    // Listen for changes from other components
    useEffect(() => {
        const handleLangChange = () => {
            const stored = localStorage.getItem('hidaya_lang') as Language;
            if (stored) setLanguage(stored);
        };
        window.addEventListener('hidaya-lang-change', handleLangChange);
        return () => window.removeEventListener('hidaya-lang-change', handleLangChange);
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('hidaya_lang', lang);
        // Force reload might be needed to update direction properly if we change <html> dir
        // But for now just event
        window.dispatchEvent(new Event('hidaya-lang-change'));

        // Update document direction
        if (lang === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'ar';
        } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'es';
        }
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || key;
    };

    const isRTL = language === 'ar';

    return { language, changeLanguage, t, isRTL };
};
