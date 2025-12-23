import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface TemplateTask {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    order: number;
}

export interface TaskTemplate {
    id: string;
    name: string;
    type: 'morning' | 'weekend' | 'travel' | 'project' | 'custom';
    icon: string;
    tasks: TemplateTask[];
    isDefault?: boolean;
}

const STORAGE_KEY = 'baraka_task_templates';

// Default templates
const DEFAULT_TEMPLATES: TaskTemplate[] = [
    {
        id: 'morning-default',
        name: 'مهام الصباح اليومية',
        type: 'morning',
        icon: '🌅',
        isDefault: true,
        tasks: [
            { title: 'الاستيقاظ المبكر', priority: 'high', order: 1 },
            { title: 'صلاة الفجر', priority: 'high', order: 2 },
            { title: 'قراءة القرآن (10 دقائق)', priority: 'medium', order: 3 },
            { title: 'أذكار الصباح', priority: 'medium', order: 4 },
            { title: 'تمارين رياضية (15 دقيقة)', priority: 'medium', order: 5 },
            { title: 'تناول الإفطار الصحي', priority: 'medium', order: 6 },
            { title: 'مراجعة مهام اليوم', priority: 'high', order: 7 },
        ]
    },
    {
        id: 'weekend-default',
        name: 'مهام نهاية الأسبوع',
        type: 'weekend',
        icon: '🏠',
        isDefault: true,
        tasks: [
            { title: 'تنظيف المنزل', priority: 'medium', order: 1 },
            { title: 'غسل الملابس', priority: 'medium', order: 2 },
            { title: 'ترتيب الغرف', priority: 'low', order: 3 },
            { title: 'تسوق المواد الغذائية', priority: 'high', order: 4 },
            { title: 'زيارة الأهل', priority: 'medium', order: 5 },
            { title: 'وقت مع العائلة', priority: 'high', order: 6 },
            { title: 'الاستعداد للأسبوع القادم', priority: 'medium', order: 7 },
        ]
    },
    {
        id: 'travel-default',
        name: 'قائمة السفر',
        type: 'travel',
        icon: '✈️',
        isDefault: true,
        tasks: [
            { title: 'تأكيد حجز الطيران', priority: 'high', order: 1 },
            { title: 'تأكيد حجز الفندق', priority: 'high', order: 2 },
            { title: 'تجهيز جواز السفر والمستندات', priority: 'high', order: 3 },
            { title: 'تجهيز حقيبة الملابس', priority: 'medium', order: 4 },
            { title: 'شاحن الهاتف والأجهزة', priority: 'medium', order: 5 },
            { title: 'الأدوية الضرورية', priority: 'high', order: 6 },
            { title: 'إبلاغ البنك بالسفر', priority: 'medium', order: 7 },
            { title: 'ترتيب النقل من المطار', priority: 'medium', order: 8 },
            { title: 'تحميل الخرائط offline', priority: 'low', order: 9 },
            { title: 'إعداد قائمة الأماكن للزيارة', priority: 'low', order: 10 },
        ]
    },
    {
        id: 'project-default',
        name: 'قالب المشاريع العام',
        type: 'project',
        icon: '📊',
        isDefault: true,
        tasks: [
            { title: 'تحديد أهداف المشروع', priority: 'high', order: 1 },
            { title: 'البحث والدراسة المبدئية', priority: 'medium', order: 2 },
            { title: 'وضع خطة العمل', priority: 'high', order: 3 },
            { title: 'تحديد الموارد المطلوبة', priority: 'medium', order: 4 },
            { title: 'البدء في التنفيذ', priority: 'high', order: 5 },
            { title: 'مراجعة التقدم', priority: 'medium', order: 6 },
            { title: 'التعديلات والتحسينات', priority: 'medium', order: 7 },
            { title: 'الاختبار والتقييم', priority: 'high', order: 8 },
            { title: 'التسليم النهائي', priority: 'high', order: 9 },
        ]
    }
];

export const useTaskTemplates = () => {
    const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults - keep user templates and add any missing defaults
                const userTemplates = parsed.filter((t: TaskTemplate) => !t.isDefault);
                return [...DEFAULT_TEMPLATES, ...userTemplates];
            }
            return DEFAULT_TEMPLATES;
        } catch {
            return DEFAULT_TEMPLATES;
        }
    });
    const { toast } = useToast();

    // Save to localStorage whenever templates change
    useEffect(() => {
        const customTemplates = templates.filter(t => !t.isDefault);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...DEFAULT_TEMPLATES, ...customTemplates]));
    }, [templates]);

    const addTemplate = (template: Omit<TaskTemplate, 'id' | 'isDefault'>) => {
        const newTemplate: TaskTemplate = {
            ...template,
            id: `custom-${Date.now()}`,
            isDefault: false,
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: 'تم إنشاء القالب', description: `تم إضافة "${template.name}"` });
        return newTemplate;
    };

    const updateTemplate = (id: string, updates: Partial<TaskTemplate>) => {
        setTemplates(prev => prev.map(t => {
            if (t.id === id && !t.isDefault) {
                return { ...t, ...updates };
            }
            return t;
        }));
        toast({ title: 'تم التحديث' });
    };

    const deleteTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template?.isDefault) {
            toast({ title: 'خطأ', description: 'لا يمكن حذف القوالب الافتراضية', variant: 'destructive' });
            return;
        }
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast({ title: 'تم حذف القالب' });
    };

    const duplicateTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (!template) return;

        const newTemplate: TaskTemplate = {
            ...template,
            id: `custom-${Date.now()}`,
            name: `نسخة من ${template.name}`,
            isDefault: false,
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: 'تم نسخ القالب' });
        return newTemplate;
    };

    const getTemplatesByType = (type: TaskTemplate['type']) => {
        return templates.filter(t => t.type === type);
    };

    const getDefaultTemplates = () => {
        return templates.filter(t => t.isDefault);
    };

    const getCustomTemplates = () => {
        return templates.filter(t => !t.isDefault);
    };

    return {
        templates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        getTemplatesByType,
        getDefaultTemplates,
        getCustomTemplates,
        DEFAULT_TEMPLATES,
    };
};
