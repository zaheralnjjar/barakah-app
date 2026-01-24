
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    LayoutList,
    CalendarCheck,
    BookOpen,
    Briefcase,
    Zap,
    Grid,
    CheckSquare,
    CalendarDays
} from 'lucide-react';

interface TemplatesGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (html: string) => void;
}

const templates = [
    {
        id: 'bujo_daily',
        title: 'Bullet Journal يومي',
        icon: LayoutList,
        content: `
            <div style="border: 2px solid #555; padding: 20px; border-radius: 12px; background: #fffcf5;">
                <h2 style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px;">📅 سجل اليوم</h2>
                
                <h3>🔲 مهام اليوم (Tasks)</h3>
                <ul data-type="taskList">
                    <li data-type="taskItem" data-checked="false">مهمة رئيسية</li>
                    <li data-type="taskItem" data-checked="false">مهمة ثانوية</li>
                </ul>

                <h3>🦄 أحداث (Events)</h3>
                <ul>
                    <li>🕒 10:00 - اجتماع</li>
                    <li>🕒 14:00 - غداء عمل</li>
                </ul>

                <h3>📝 ملاحظات سريعة</h3>
                <p>...</p>
            </div>
        `
    },
    {
        id: 'bujo_weekly',
        title: 'تخطيط أسبوعي (Weekly)',
        icon: Grid,
        content: `
            <h2 style="text-align: center; background: #eef2ff; padding: 10px; border-radius: 8px;">🗓️ الأسبوع الممتد من ... إلى ...</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>السبت</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
                <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>الأحد</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
                 <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>الاثنين</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
                 <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>الثلاثاء</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
                 <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>الأربعاء</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
                 <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                    <strong>الخميس/الجمعة</strong>
                    <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                </div>
            </div>
        `
    },
    {
        id: 'monthly_goals',
        title: 'أهداف الشهر',
        icon: CalendarDays,
        content: `
            <h2>🎯 أهداف الشهر</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>الجانب المهني</strong></td>
                    <td style="padding: 10px; border: 1px solid #eee;">
                        <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                    </td>
                </tr>
                 <tr>
                    <td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>الجانب الشخصي</strong></td>
                    <td style="padding: 10px; border: 1px solid #eee;">
                        <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                    </td>
                </tr>
                 <tr>
                    <td style="padding: 10px; border: 1px solid #eee; background: #f9fafb;"><strong>العادات الجديدة</strong></td>
                    <td style="padding: 10px; border: 1px solid #eee;">
                        <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                    </td>
                </tr>
            </table>
        `
    },
    {
        id: 'meeting',
        title: 'محضر اجتماع رسمي',
        icon: Briefcase,
        content: `
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-right: 4px solid #3b82f6;">
                <h2>🤝 محضر اجتماع</h2>
                <p><strong>التاريخ:</strong> ... / <strong>الموقع:</strong> ...</p>
                <p><strong>الحضور:</strong> ...</p>
                <hr>
                <h3>📌 الأجندة</h3>
                <ul><li>بند 1</li><li>بند 2</li></ul>
                <hr>
                <h3>✅ القرارات / المهام</h3>
                <ul data-type="taskList">
                    <li data-type="taskItem">مهمة: [اسم الشخص] - [الموعد]</li>
                </ul>
            </div>
        `
    },
    {
        id: 'idea',
        title: 'عصف ذهني (Brainstorming)',
        icon: Zap,
        content: `
            <h1 style="color: #6366f1;">💡 فكرة مشروع: [الاسم]</h1>
            <p style="font-size: 1.1em; font-style: italic; color: #555;">وصف مختصر للفكرة...</p>
            
            <h3>لماذا؟ (Why)</h3>
            <p>...</p>

            <h3>كيف؟ (How)</h3>
            <ul>
                <li>خطوة 1</li>
                <li>خطوة 2</li>
            </ul>

            <h3>من؟ (Who)</h3>
            <p>الجمهور المستهدف...</p>
        `
    }
];

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold mb-4">اختر قالباً (Templates)</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.map(template => {
                        const Icon = template.icon;
                        return (
                            <button
                                key={template.id}
                                onClick={() => {
                                    onSelectTemplate(template.content);
                                    onClose();
                                }}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all group text-center shadow-sm hover:shadow-md h-[180px]"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-white shadow-sm flex items-center justify-center text-gray-500 group-hover:text-indigo-600 transition-colors">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-indigo-700">
                                    {template.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
};
