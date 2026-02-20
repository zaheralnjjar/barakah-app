
import { Template, SmartTemplateConfig } from './types';
import {
    Moon, BookOpen, Sparkles, Sun, Hand, Heart, Coffee
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const generateSmartHtml = (template: Template, data: any): string => {
    const config = template.content as SmartTemplateConfig;
    const { outputConfig, fields } = config;

    // Fallback theme color
    const themeColor = outputConfig ? outputConfig.themeColor : (template.defaultColor || '#3b82f6');

    if (outputConfig && outputConfig.htmlTemplate && outputConfig.htmlTemplate.trim() !== '') {
        let html = outputConfig.htmlTemplate;

        // Replace System Variables
        const dateVal = data.date ? new Date(data.date).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG');
        html = html.replace(/{{DATE}}/g, dateVal);
        html = html.replace(/{{TEMPLATE_NAME}}/g, template.name);

        // Replace Field Variables
        fields.forEach(field => {
            const val = data[field.id];
            let displayValue: any = val;

            if (val === undefined || val === null || val === '') {
                if (field.type === 'checkbox') {
                    displayValue = `<input type="checkbox" style="width: 16px; height: 16px; margin: 0 6px; accent-color: ${themeColor}; cursor: pointer; vertical-align: middle; position: relative; top: -1px;" />`;
                } else {
                    displayValue = '<span style="opacity:0.5; font-style:italic;">--</span>';
                }
            } else if (field.type === 'rating') {
                const count = Number(val);
                displayValue = `<span style="color:#fbbf24; font-size:1.2em;">${'★'.repeat(count)}${'☆'.repeat(5 - count)}</span>`;
            } else if (field.type === 'list' || field.type === 'textarea') {
                if (typeof val === 'string' && val.includes('\n')) {
                    displayValue = val.split('\n').filter(t => t.trim()).map((line: string) => `<div>• ${line}</div>`).join('');
                } else {
                    displayValue = val;
                }
            } else if (field.type === 'checkbox') {
                const checkedAttr = val ? 'checked' : '';
                displayValue = `<input type="checkbox" ${checkedAttr} style="width: 16px; height: 16px; margin: 0 6px; accent-color: ${themeColor}; cursor: pointer; vertical-align: middle; position: relative; top: -1px;" />`;
            } else if (field.type === 'slider') {
                displayValue = `${val}/${field.max}`;
            } else if (field.type === 'date' && val) {
                try { displayValue = format(new Date(val), 'yyyy/MM/dd', { locale: ar }); } catch (e) { displayValue = val; }
            } else if (field.type === 'time' && val) {
                displayValue = val;
            } else if (field.type === 'number' || field.type === 'calculation') {
                let numStr = String(val);
                if (field.prefix) numStr = field.prefix + ' ' + numStr;
                if (field.suffix) numStr = numStr + ' ' + field.suffix;
                displayValue = numStr;
            }

            const regexString = `\\{\\{[\\s\\u00A0]*(?:<[^>]+>[\\s\\u00A0]*)*${escapeRegExp(field.id)}[\\s\\u00A0]*(?:<[^>]+>[\\s\\u00A0]*)*\\}\\}`;
            const variableRegex = new RegExp(regexString, 'gi');
            html = html.replace(variableRegex, String(displayValue));
        });

        return html;
    }
    return '';
};

export const TEMPLATES: Template[] = [
    {
        id: 'ramadan_planner',
        name: '🌙 منظم يوم رمضاني',
        description: 'جدول شامل للصيام والعبادات.',
        icon: Moon, category: 'islamic', type: 'smart-json', defaultColor: '#f0fdf4',
        isVisible: true,
        content: {
            fields: [
                { id: 'day', type: 'number', label: 'يوم رمضان' }, { id: 'suhoor', type: 'time', label: 'سحور' }, { id: 'iftar', type: 'time', label: 'إفطار' },
                { id: 'fajr', type: 'checkbox', label: 'فجر' }, { id: 'dhuhr', type: 'checkbox', label: 'ظهر' }, { id: 'asr', type: 'checkbox', label: 'عصر' },
                { id: 'maghrib', type: 'checkbox', label: 'مغرب' }, { id: 'isha', type: 'checkbox', label: 'عشاء' }, { id: 'tarawih', type: 'checkbox', label: 'تراويح' },
                { id: 'quran', type: 'text', label: 'ورد القرآن' }, { id: 'deed', type: 'text', label: 'عمل صالح' }
            ],
            outputConfig: {
                showTitle: false, showDate: true, themeColor: '#166534', layoutStyle: 'modern', fieldSettings: [],
                htmlTemplate: `<div style="background:#f0fdf4; border:3px double #166534; border-radius:20px; padding:20px; text-align:center;"><h2 style="color:#166534; font-family:'Amiri'; margin-bottom:10px;">🌙 يوم رمضان {{day}}</h2><div style="display:flex; justify-content:center; gap:20px; font-weight:bold; color:#15803d; background:#dcfce7; padding:8px; border-radius:50px; margin-bottom:15px;"><span>🥣 سحور: {{suhoor}}</span><span>Dates إفطار: {{iftar}}</span></div><div style="background:white; padding:10px; border-radius:15px; border:1px dashed #86efac; font-size:0.9em;">🕌 {{fajr}} فجر | {{dhuhr}} ظهر | {{asr}} عصر | {{maghrib}} مغرب | {{isha}} عشاء | <span style="color:#b91c1c;">{{tarawih}} تراويح</span></div><div style="margin-top:15px; text-align:right; font-size:0.9em;"><div style="margin-bottom:5px;">📖 <strong>القرآن:</strong> {{quran}}</div><div>✨ <strong>خير اليوم:</strong> {{deed}}</div></div></div>`
            }
        }
    },
    {
        id: 'quran_reflection',
        name: '🕋 تدبر آية',
        description: 'وقفة مع كتاب الله.',
        icon: BookOpen, category: 'islamic', type: 'smart-json', defaultColor: '#ecfccb',
        isVisible: true,
        content: {
            fields: [{ id: 'sura', type: 'text', label: 'السورة' }, { id: 'ayah', type: 'number', label: 'رقم الآية' }, { id: 'text', type: 'textarea', label: 'الآية' }, { id: 'reflection', type: 'textarea', label: 'التدبر' }],
            outputConfig: { themeColor: '#3f6212', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="padding:20px; border:2px solid #84cc16; border-radius:15px; background:#f7fee7; text-align:center;"><h3 style="color:#365314; font-family:'Amiri'; margin:0;">سورة {{sura}} : {{ayah}}</h3><p style="font-size:1.1em; color:#1a2e05; margin:15px 0; font-family:'Amiri';">"{{text}}"</p><hr style="border-color:#bef264;"/><div style="text-align:right;"><strong style="color:#4d7c0f;">💡 خواطر:</strong><p style="color:#3f6212;">{{reflection}}</p></div></div>` }
        }
    },
    { id: 'daily_wird', name: '📿 الورد اليومي', description: 'حصاد الحسنات.', icon: Sparkles, category: 'islamic', type: 'smart-json', defaultColor: '#fff', isVisible: true, content: { fields: [{ id: 'count', type: 'counter', label: 'استغفار' }], outputConfig: { themeColor: '#000', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="border:1px solid #e5e7eb; background:white; padding:15px; border-radius:12px; text-align:center; display:inline-block; min-width:200px; direction:rtl; box-shadow:0 1px 2px rgba(0,0,0,0.05);">📿 استغفار اليوم<div style="font-size:1.8em; color:#059669; font-weight:bold; margin:5px 0;">{{count}}</div>مرة</div>` } } },
    { id: 'friday_sunan', name: '🕌 سنن الجمعة', description: 'تذكير بسنن الجمعة.', icon: Sun, category: 'islamic', type: 'smart-json', defaultColor: '#f0f9ff', isVisible: true, content: { fields: [{ id: 'ghusl', type: 'checkbox', label: 'الغسل' }, { id: 'kahf', type: 'checkbox', label: 'الكهف' }, { id: 'perfume', type: 'checkbox', label: 'الطيب' }, { id: 'salawat', type: 'counter', label: 'الصلاة على النبي' }], outputConfig: { themeColor: '#0284c7', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="background:#e0f2fe; padding:20px; border-radius:16px; color:#0369a1; display:inline-block; min-width:300px; text-align:center; direction:rtl; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><strong>🕌 جمعة مباركة!</strong><br/><div style="margin-top:8px; display:flex; flex-wrap:wrap; justify-content:center; gap:8px;"><span>🚿 غسل: {{ghusl}}</span> <span>|</span> <span>📖 كهف: {{kahf}}</span> <span>|</span> <span>🌸 طيب: {{perfume}}</span></div><div style="margin-top:10px; font-weight:bold; border-top:1px dashed #bae6fd; padding-top:8px;">ﷺ صلوات: {{salawat}}</div></div>` } } },
    { id: 'dua_list', name: '🤲 قائمة الدعاء', description: 'أوقات الاستجابة.', icon: Hand, category: 'islamic', type: 'smart-json', defaultColor: '#fdf4ff', isVisible: true, content: { fields: [{ id: 'duas', type: 'textarea', label: 'أدعية أريدها' }], outputConfig: { themeColor: '#9333ea', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="background:#fae8ff; border-right:4px solid #a855f7; padding:15px;"><strong>🤲 يارب:</strong><br/>{{duas}}</div>` } } },
    { id: 'charity_log', name: '💸 صدقة السر', description: 'توثيق الخير.', icon: Heart, category: 'islamic', type: 'smart-json', defaultColor: '#fff1f2', isVisible: true, content: { fields: [{ id: 'amount', type: 'number', label: 'المبلغ' }, { id: 'cause', type: 'text', label: 'الجهة' }], outputConfig: { themeColor: '#e11d48', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="display:inline-block; border:1px dashed #f43f5e; padding:5px 15px; border-radius:20px; color:#be123c;">💝 صدقة: {{amount}} ({{cause}}) - تقبل الله</div>` } } },
    { id: 'fasting_tracker', name: '🥤 صيام التطوع', description: 'الإثنين والبيض.', icon: Coffee, category: 'islamic', type: 'smart-json', defaultColor: '#ecfeff', isVisible: true, content: { fields: [{ id: 'type', type: 'select', options: ['إثنين', 'خميس', 'بيض', 'عرفة', 'عاشوراء'], label: 'نوع الصيام' }], outputConfig: { themeColor: '#0891b2', showTitle: true, showDate: true, layoutStyle: 'modern', fieldSettings: [], htmlTemplate: `<div style="background:#cffafe; padding:10px; border-radius:8px; text-align:center; color:#155e75;">🌿 صيام {{type}} - تقبل الله طاعتك</div>` } } },
];
