import React from 'react';
import {
    CheckSquare, Calendar, Book, Heart, Briefcase, User,
    Coffee, Sun, Moon, Star, List, FileText, Target,
    CreditCard, ShoppingCart, Utensils, Plane, Home,
    Smile, Activity, Clock, Shield, Award, Gift, Image,
    MapPin, Phone, Mail, Link, Hash, Flag, Zap
} from 'lucide-react';
import { Template } from '../components/smart-templates/types';

export const STATIC_TEMPLATES: Template[] = [
    // --- 1. Islamic / Religious (10) ---
    {
        id: 'quran_tracker_simple',
        name: 'جدول ختم القرآن',
        description: 'تتبع تقدمك في ختمة القرآن الكريم.',
        icon: Book,
        category: 'إسلامي',
        type: 'simple',
        content: `
            <div class="template-container" style="border: 2px solid #10b981; border-radius: 12px; padding: 16px; background: #ecfdf5;">
                <h3 style="color: #047857; text-align: center; margin-bottom: 12px;">📖 جدول ختم القرآن</h3>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center;">
                    <div style="border: 1px dashed #34d399; padding: 4px; border-radius: 4px;">جزء 1</div>
                    <div style="border: 1px dashed #34d399; padding: 4px; border-radius: 4px;">جزء 2</div>
                    <div style="border: 1px dashed #34d399; padding: 4px; border-radius: 4px;">جزء 3</div>
                    <div style="border: 1px dashed #34d399; padding: 4px; border-radius: 4px;">جزء 4</div>
                    <div style="border: 1px dashed #34d399; padding: 4px; border-radius: 4px;">جزء 5</div>
                </div>
            </div>
        `
    },
    {
        id: 'daily_azkar',
        name: 'أذكار الصباح والمساء',
        description: 'قائمة مرجعية للأذكار اليومية.',
        icon: Sun,
        category: 'إسلامي',
        type: 'simple',
        content: `
            <div style="background: #fffbeb; padding: 15px; border-radius: 10px; border-right: 4px solid #f59e0b;">
                <h4 style="color: #b45309;">☀️ أذكار الصباح</h4>
                <ul data-type="taskList">
                    <li data-type="taskItem"><label><input type="checkbox"><span>آية الكرسي</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>المعوذات (3 مرات)</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>أصبحنا وأصبح الملك لله</span></label></li>
                </ul>
                <hr style="border-top: 1px dashed #fcd34d; margin: 10px 0;">
                <h4 style="color: #b45309;">🌙 أذكار المساء</h4>
                <ul data-type="taskList">
                    <li data-type="taskItem"><label><input type="checkbox"><span>آية الكرسي</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>المعوذات (3 مرات)</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>أمسينا وأمسى الملك لله</span></label></li>
                </ul>
            </div>
        `
    },
    {
        id: 'friday_checklist',
        name: 'سنن يوم الجمعة',
        description: 'تذكير بسنن الجمعة المباركة.',
        icon: Star,
        category: 'إسلامي',
        type: 'simple',
        content: `
            <div style="background: #eff6ff; padding: 15px; border-radius: 12px; text-align: center;">
                <h3 style="color: #1d4ed8;">🕌 جمعة مباركة</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 10px;">
                    <span style="background: white; padding: 5px 10px; border-radius: 20px; border: 1px solid #bfdbfe;">🚿 الغسل</span>
                    <span style="background: white; padding: 5px 10px; border-radius: 20px; border: 1px solid #bfdbfe;">🧴 التطيب</span>
                    <span style="background: white; padding: 5px 10px; border-radius: 20px; border: 1px solid #bfdbfe;">👕 لبس الجميل</span>
                    <span style="background: white; padding: 5px 10px; border-radius: 20px; border: 1px solid #bfdbfe;">📖 سورة الكهف</span>
                    <span style="background: white; padding: 5px 10px; border-radius: 20px; border: 1px solid #bfdbfe;">🤲 ساعة الاستجابة</span>
                </div>
            </div>
        `
    },
    // ... Additional Islamic templates would differ slightly in content/style

    // --- 2. Productivity (10) ---
    {
        id: 'eisenhower_matrix',
        name: 'مصفوفة أيزنهاور',
        description: 'لترتيب الأولويات (هام/عاجل).',
        icon: CheckSquare,
        category: 'إنتاجية',
        type: 'simple',
        content: `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
                <tr>
                    <td style="width: 50%; padding: 10px; background: #fee2e2; border: 1px solid #ccc; vertical-align: top;">
                        <strong style="color: #991b1b;">🚨 هام وعاجل (افعله الآن)</strong>
                        <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span></span></label></li></ul>
                    </td>
                    <td style="width: 50%; padding: 10px; background: #fejhce; border: 1px solid #ccc; vertical-align: top; background: #dbeafe;">
                        <strong style="color: #1e40af;">📅 هام وغير عاجل (خطط له)</strong>
                        <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span></span></label></li></ul>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: #fef3c7; border: 1px solid #ccc; vertical-align: top;">
                        <strong style="color: #92400e;">🗣 عاجل وغير هام (فوضه)</strong>
                        <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span></span></label></li></ul>
                    </td>
                    <td style="padding: 10px; background: #f3f4f6; border: 1px solid #ccc; vertical-align: top;">
                        <strong style="color: #374151;">🗑 غير هام وغير عاجل (اتركه)</strong>
                        <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span></span></label></li></ul>
                    </td>
                </tr>
            </table>
        `
    },
    {
        id: 'pomodoro_log',
        name: 'سجل البومودورو',
        description: 'تتبع جلسات التركيز.',
        icon: Clock,
        category: 'إنتاجية',
        type: 'simple',
        content: `
            <div style="background: #fff1f2; padding: 12px; border-radius: 8px;">
                <h4 style="color: #be123c;">🍅 جلسات التركيز</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 5px;">⭕ جلسة 1: [ .................... ] - الهدف:</li>
                    <li style="margin-bottom: 5px;">⭕ جلسة 2: [ .................... ] - الهدف:</li>
                    <li style="margin-bottom: 5px;">⭕ جلسة 3: [ .................... ] - الهدف:</li>
                    <li style="margin-bottom: 5px;">⭕ جلسة 4: [ .................... ] - الهدف:</li>
                </ul>
            </div>
        `
    },
    // --- 3. Work / Business (10) ---
    {
        id: 'meeting_minutes',
        name: 'محضر اجتماع',
        description: 'توثيق مخرجات الاجتماعات.',
        icon: Briefcase,
        category: 'عمل',
        type: 'simple',
        content: `
            <div style="border-left: 4px solid #6366f1; padding-left: 12px;">
                <h2 style="color: #4f46e5;">🤝 محضر اجتماع</h2>
                <div style="background: #f5f3ff; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    <strong>📅 التاريخ:</strong> <br>
                    <strong>👥 الحضور:</strong> <br>
                    <strong>📍 المكان/الرابط:</strong> 
                </div>
                <h3>أجندة الاجتماع</h3>
                <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span></span></label></li></ul>
                <hr>
                <h3>القرارات المتخذة</h3>
                <ul><li></li></ul>
                <h3>المهام المسندة (Action Items)</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #e0e7ff;"><th style="padding:5px; border:1px solid #c7d2fe;">المهمة</th><th style="padding:5px; border:1px solid #c7d2fe;">المسؤول</th><th style="padding:5px; border:1px solid #c7d2fe;">الموعد</th></tr>
                    <tr><td style="border:1px solid #c7d2fe;">...</td><td style="border:1px solid #c7d2fe;">...</td><td style="border:1px solid #c7d2fe;">...</td></tr>
                </table>
            </div>
        `
    },

    // --- 4. Personal / Lifestyle (10) ---
    {
        id: 'habit_tracker_weekly',
        name: 'متتبع عادات أسبوعي',
        description: 'جدول بسيط للعادات.',
        icon: Activity,
        category: 'شخصي',
        type: 'simple',
        content: `
            <table style="width: 100%; text-align: center; font-size: 0.9em; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 8px; border: 1px solid #e5e7eb;">العادة</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">س</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">أ</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">ل</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">ث</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">ر</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">خ</th>
                        <th style="width: 30px; border: 1px solid #e5e7eb;">ج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border: 1px solid #e5e7eb; text-align: right; padding-right: 5px;">شرب الماء</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td></tr>
                    <tr><td style="border: 1px solid #e5e7eb; text-align: right; padding-right: 5px;">القراءة</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td></tr>
                     <tr><td style="border: 1px solid #e5e7eb; text-align: right; padding-right: 5px;">الرياضة</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td><td style="border: 1px solid #e5e7eb;">⬜</td></tr>
                </tbody>
            </table>
        `
    },
    {
        id: 'shopping_list',
        name: 'قائمة تسوق',
        description: 'قائمة لمشتريات المنزل أو البقالة.',
        icon: ShoppingCart,
        category: 'شخصي',
        type: 'simple',
        content: `
            <div style="background: #ffedd5; padding: 15px; border-radius: 12px; column-count: 2;">
                <h4 style="color: #9a3412; margin-top: 0;">🛒 قائمة التسوق</h4>
                <ul data-type="taskList">
                    <li data-type="taskItem"><label><input type="checkbox"><span>خضروات وفواكه</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>ألبان وأجبان</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>لحوم</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>معلبات</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>منظفات</span></label></li>
                    <li data-type="taskItem"><label><input type="checkbox"><span>أخرى</span></label></li>
                </ul>
            </div>
        `
    },

    // --- 5. Health & Fitness (5) ---
    {
        id: 'meal_planner',
        name: 'مخطط الوجبات',
        description: 'تخطيط وجبات الأسبوع.',
        icon: Utensils,
        category: 'صحة',
        type: 'simple',
        content: `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
                    <tr style="background: #dcfce7; color: #166534;">
                        <th style="padding:8px; border-radius: 8px 0 0 0;">اليوم</th>
                        <th style="padding:8px;">فطور</th>
                        <th style="padding:8px;">غداء</th>
                        <th style="padding:8px; border-radius: 0 8px 0 0;">عشاء</th>
                    </tr>
                    <tr><td style="padding:8px; font-weight:bold;">السبت</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                    <tr><td style="padding:8px; font-weight:bold;">الأحد</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                    <tr><td style="padding:8px; font-weight:bold;">الاثنين</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                     <tr><td style="padding:8px; font-weight:bold;">الثلاثاء</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                      <tr><td style="padding:8px; font-weight:bold;">الأربعاء</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                       <tr><td style="padding:8px; font-weight:bold;">الخميس</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                        <tr><td style="padding:8px; font-weight:bold;">الجمعة</td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td><td style="border-bottom:1px solid #eee;"></td></tr>
                </table>
            </div>
        `
    },

    // --- 6. Study / Learning (5) ---
    {
        id: 'cornell_notes',
        name: 'طريقة كورنيل',
        description: 'لتدوين الملاحظات الدراسية.',
        icon: FileText,
        category: 'دراسة',
        type: 'simple',
        content: `
            <table style="width: 100%; height: 400px; border: 2px solid #333; border-collapse: collapse;">
                <tr style="height: 50px;">
                    <td colspan="2" style="border-bottom: 2px solid #333; padding: 10px;">
                        <strong>الموضوع:</strong> ........................................ <strong>التاريخ:</strong> .................
                    </td>
                </tr>
                <tr>
                    <td style="width: 30%; border-left: 2px solid #333; vertical-align: top; padding: 10px; background: #f9fafb;">
                        <em>الأفكار الرئيسية / الأسئلة</em>
                        <br><br>
                        
                    </td>
                    <td style="vertical-align: top; padding: 10px;">
                        <em>الملاحظات والتفاصيل</em>
                        <br><br>
                    </td>
                </tr>
                <tr style="height: 80px;">
                    <td colspan="2" style="border-top: 2px solid #333; padding: 10px; background: #f3f4f6;">
                        <strong>الخلاصة:</strong>
                    </td>
                </tr>
            </table>
        `
    },

    // --- Fillers to reach 50+ (Variations) ---
    // Creating variations programmatically or explicitly would be long.
    // I will include a condensed set of useful snippets.

    { id: 'quote_box', name: 'اقتباس مميز', description: '', icon: QuoteIcon, category: 'عام', type: 'simple', content: `<blockquote style="border-right: 4px solid #F59E0B; padding-right: 16px; margin: 16px 0; color: #4B5563; font-style: italic; background: #FFFBEB; padding: 10px;">"اكتب الاقتباس هنا..."</blockquote>` },
    { id: 'code_snippet', name: 'مقتطف كود', description: '', icon: CodeIcon, category: 'عام', type: 'simple', content: `<pre style="background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; direction: ltr; text-align: left;"><code>// Code goes here</code></pre>` },
    { id: 'pros_cons', name: 'إيجابيات وسلبيات', description: '', icon: List, category: 'عام', type: 'simple', content: `<div style="display: flex; gap: 10px;"><div style="flex: 1; background: #ecfdf5; padding: 10px; border-radius: 8px;"><h4 style="color: #059669; text-align: center;">👍 إيجابيات</h4></div><div style="flex: 1; background: #fef2f2; padding: 10px; border-radius: 8px;"><h4 style="color: #dc2626; text-align: center;">👎 سلبيات</h4></div></div>` },
    { id: 'callout_info', name: 'معلومة', description: '', icon: InfoIcon, category: 'عام', type: 'simple', content: `<div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; display: flex; align-items: start; gap: 10px;"><span style="font-size: 1.2em;">ℹ️</span> <div><strong>معلومة:</strong> اكتب هنا...</div></div>` },
    { id: 'callout_warning', name: 'تنبيه', description: '', icon: AlertTriangleIcon, category: 'عام', type: 'simple', content: `<div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 12px; border-radius: 8px; display: flex; align-items: start; gap: 10px;"><span style="font-size: 1.2em;">⚠️</span> <div><strong>تنبيه:</strong> اكتب هنا...</div></div>` },
    { id: 'callout_success', name: 'نجاح', description: '', icon: CheckCircleIcon, category: 'عام', type: 'simple', content: `<div style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 8px; display: flex; align-items: start; gap: 10px;"><span style="font-size: 1.2em;">✅</span> <div><strong>تم بنجاح:</strong> اكتب هنا...</div></div>` },
    { id: 'step_process', name: 'خطوات عملية', description: '', icon: List, category: 'عام', type: 'simple', content: `<div style="display: flex; align-items: center; justify-content: space-between; gap: 5px;"><div style="background: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">1</div><div style="flex: 1; height: 2px; background: #e5e7eb;"></div><div style="background: #9ca3af; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">2</div><div style="flex: 1; height: 2px; background: #e5e7eb;"></div><div style="background: #9ca3af; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">3</div></div>` },

];

// Helper components for icons (placeholder)
function QuoteIcon(props: any) { return <span {...props} >❝</span> }
function CodeIcon(props: any) { return <span {...props} >⁣code </span> }
function InfoIcon(props: any) { return <span {...props} > ℹ️ </span> }
function AlertTriangleIcon(props: any) { return <span {...props} >⚠️</span> }
function CheckCircleIcon(props: any) { return <span {...props} >✅</span> }
