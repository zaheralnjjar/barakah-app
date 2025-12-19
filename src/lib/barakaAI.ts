// Baraka AI - Enhanced Smart Command Processor
// Improved Arabic command parsing with fuzzy matching

import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export interface CommandResult {
    success: boolean;
    message: string;
    action?: string;
    data?: any;
    agent?: string;
}

interface ParsedCommand {
    intent: 'add_expense' | 'add_income' | 'add_appointment' | 'query_balance' | 'query_prayer' | 'add_symptom' | 'save_location' | 'navigate' | 'greeting' | 'help' | 'unknown';
    entities: {
        amount?: number;
        currency?: 'ARS' | 'USD';
        description?: string;
        date?: string;
        time?: string;
    };
    confidence: number;
}

// Common Arabic greetings and phrases
const GREETINGS = ['مرحبا', 'السلام عليكم', 'اهلا', 'صباح الخير', 'مساء الخير', 'هلا', 'هاي'];
const HELP_PHRASES = ['مساعدة', 'ساعدني', 'كيف', 'ماذا يمكنك', 'ماذا تستطيع', 'اوامر'];

// Enhanced number extraction (Arabic and English)
function extractNumber(text: string): number | null {
    // Arabic numerals mapping
    const arabicNumerals: { [key: string]: string } = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };

    // Convert Arabic numerals to English
    let normalized = text;
    for (const [ar, en] of Object.entries(arabicNumerals)) {
        normalized = normalized.replace(new RegExp(ar, 'g'), en);
    }

    // Arabic word numbers
    const wordNumbers: { [key: string]: number } = {
        'صفر': 0, 'واحد': 1, 'اثنين': 2, 'ثلاثة': 3, 'اربعة': 4, 'اربع': 4,
        'خمسة': 5, 'خمس': 5, 'ستة': 6, 'ست': 6, 'سبعة': 7, 'سبع': 7,
        'ثمانية': 8, 'ثمان': 8, 'تسعة': 9, 'تسع': 9, 'عشرة': 10, 'عشر': 10,
        'عشرين': 20, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50,
        'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
        'مية': 100, 'مائة': 100, 'ميتين': 200, 'مئتين': 200,
        'الف': 1000, 'ألف': 1000, 'الفين': 2000
    };

    // Check for word numbers
    for (const [word, num] of Object.entries(wordNumbers)) {
        if (normalized.includes(word)) {
            return num;
        }
    }

    // Extract numeric values
    const match = normalized.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
        return parseFloat(match[1].replace(',', '.'));
    }

    return null;
}

// Fuzzy keyword matching
function containsKeyword(text: string, keywords: string[]): boolean {
    const normalizedText = text.toLowerCase().trim();
    return keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()));
}

export function parseCommand(text: string): ParsedCommand {
    const normalizedText = text.trim().toLowerCase();

    // Check for greetings
    if (containsKeyword(normalizedText, GREETINGS)) {
        return { intent: 'greeting', entities: {}, confidence: 0.9 };
    }

    // Check for help
    if (containsKeyword(normalizedText, HELP_PHRASES)) {
        return { intent: 'help', entities: {}, confidence: 0.9 };
    }

    // Check for expense - multiple patterns
    const expenseKeywords = ['اضف', 'أضف', 'سجل', 'خصم', 'صرفت', 'دفعت', 'اشتريت', 'مصروف', 'مصاريف', 'شراء'];
    if (containsKeyword(normalizedText, expenseKeywords)) {
        const amount = extractNumber(text);
        const currency = normalizedText.includes('دولار') || normalizedText.includes('usd') ? 'USD' : 'ARS';

        // Extract description
        let description = 'مصروف';
        const descPatterns = [/(?:على|ل|من اجل|بسبب)\s+(.+?)(?:\s|$)/i, /(?:للـ?|لـ)\s*(.+)/i];
        for (const pattern of descPatterns) {
            const match = text.match(pattern);
            if (match) {
                description = match[1].trim();
                break;
            }
        }

        return {
            intent: 'add_expense',
            entities: { amount: amount || 0, currency, description },
            confidence: amount ? 0.85 : 0.5
        };
    }

    // Check for income
    const incomeKeywords = ['دخل', 'راتب', 'استلمت', 'قبضت', 'ايراد', 'ربح'];
    if (containsKeyword(normalizedText, incomeKeywords)) {
        const amount = extractNumber(text);
        const currency = normalizedText.includes('دولار') || normalizedText.includes('usd') ? 'USD' : 'ARS';

        return {
            intent: 'add_income',
            entities: { amount: amount || 0, currency, description: 'دخل' },
            confidence: amount ? 0.85 : 0.5
        };
    }

    // Check for balance query
    const balanceKeywords = ['رصيد', 'كم معي', 'كم عندي', 'ميزانية', 'حد يومي', 'كم باقي', 'كم المبلغ'];
    if (containsKeyword(normalizedText, balanceKeywords)) {
        return { intent: 'query_balance', entities: {}, confidence: 0.9 };
    }

    // Check for prayer times
    const prayerKeywords = ['صلاة', 'صلاه', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'اذان', 'أذان', 'وقت الصلاة'];
    if (containsKeyword(normalizedText, prayerKeywords)) {
        return { intent: 'query_prayer', entities: {}, confidence: 0.9 };
    }

    // Check for appointment
    const appointmentKeywords = ['موعد', 'اجتماع', 'ذكرني', 'تذكير', 'مهمة', 'حجز'];
    if (containsKeyword(normalizedText, appointmentKeywords)) {
        return {
            intent: 'add_appointment',
            entities: { description: text },
            confidence: 0.7
        };
    }

    // Check for symptoms
    const symptomKeywords = ['اشعر', 'أشعر', 'عندي', 'لدي', 'مريض', 'صحة', 'الم', 'ألم', 'صداع', 'حرارة'];
    if (containsKeyword(normalizedText, symptomKeywords)) {
        return {
            intent: 'add_symptom',
            entities: { description: text },
            confidence: 0.7
        };
    }

    // Check for location
    const locationKeywords = ['موقع', 'موقف', 'سيارة', 'احفظ المكان', 'اين انا'];
    if (containsKeyword(normalizedText, locationKeywords)) {
        return { intent: 'save_location', entities: {}, confidence: 0.8 };
    }

    // Unknown command
    return { intent: 'unknown', entities: {}, confidence: 0 };
}

export async function executeCommand(parsed: ParsedCommand): Promise<CommandResult> {
    try {
        switch (parsed.intent) {
            case 'greeting':
                return {
                    success: true,
                    message: 'وعليكم السلام ورحمة الله! كيف يمكنني مساعدتك اليوم؟',
                };

            case 'help':
                return {
                    success: true,
                    message: `يمكنني مساعدتك في:
• إضافة مصروف: "أضف مصروف 500 بيزو للطعام"
• استعلام الرصيد: "كم رصيدي؟"
• أوقات الصلاة: "متى صلاة المغرب؟"
• إضافة موعد: "ذكرني بموعد الطبيب غداً"
• حفظ الموقع: "احفظ موقف السيارة"`,
                };

            case 'add_expense':
                return await handleFinanceCommand(parsed, 'expense');

            case 'add_income':
                return await handleFinanceCommand(parsed, 'income');

            case 'query_balance':
                return await handleBalanceQuery();

            case 'query_prayer':
                return handlePrayerQuery();

            case 'add_appointment':
                return handleAppointmentCommand(parsed);

            case 'add_symptom':
                return handleSymptomCommand(parsed);

            case 'save_location':
                return handleLocationCommand();

            default:
                return {
                    success: false,
                    message: 'عذراً، لم أفهم. جرب قول: "أضف مصروف 100" أو "كم رصيدي؟" أو قل "مساعدة" للمزيد.',
                };
        }
    } catch (error) {
        console.error('Command error:', error);
        return { success: false, message: 'حدث خطأ. حاول مرة أخرى.' };
    }
}

async function handleFinanceCommand(parsed: ParsedCommand, type: 'expense' | 'income'): Promise<CommandResult> {
    const { amount, currency, description } = parsed.entities;

    if (!amount || amount === 0) {
        return { success: false, message: 'لم أفهم المبلغ. قل مثلاً: "أضف 500 بيزو"' };
    }

    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        const { data: financeData } = await supabase
            .from(TABLES.finance)
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!financeData) {
            return { success: false, message: 'لم يتم العثور على بياناتك المالية' };
        }

        const isExpense = type === 'expense';
        let updatedBalanceARS = financeData.current_balance_ars;
        let updatedBalanceUSD = financeData.current_balance_usd;

        if (currency === 'ARS') {
            updatedBalanceARS += isExpense ? -amount : amount;
        } else {
            updatedBalanceUSD += isExpense ? -amount : amount;
        }

        const newTransaction = {
            id: Date.now(),
            amount,
            currency,
            type,
            description,
            timestamp: new Date().toISOString(),
        };

        const { error } = await supabase
            .from(TABLES.finance)
            .update({
                current_balance_ars: updatedBalanceARS,
                current_balance_usd: updatedBalanceUSD,
                pending_expenses: [...(financeData.pending_expenses || []), newTransaction],
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (error) throw error;

        const action = isExpense ? 'خصم' : 'إضافة';
        const currencyName = currency === 'ARS' ? 'بيزو' : 'دولار';

        return {
            success: true,
            message: `✅ تم ${action} ${amount} ${currencyName}${description !== 'مصروف' && description !== 'دخل' ? ' لـ' + description : ''}`,
            agent: 'mohamed',
            action: type === 'expense' ? 'expense_added' : 'income_added',
        };
    } catch (error) {
        return { success: false, message: 'فشل في حفظ المعاملة' };
    }
}

async function handleBalanceQuery(): Promise<CommandResult> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return { success: false, message: 'يجب تسجيل الدخول' };
        }

        const { data: financeData } = await supabase
            .from(TABLES.finance)
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!financeData) {
            return { success: false, message: 'لا توجد بيانات مالية' };
        }

        const rate = financeData.exchange_rate || 1;
        const totalARS = financeData.current_balance_ars + (financeData.current_balance_usd * rate);
        const dailyLimit = Math.max(0, (totalARS - (financeData.emergency_buffer || 0)) / 30);

        return {
            success: true,
            message: `💰 رصيدك: ${totalARS.toLocaleString('ar')} بيزو\n📊 الحد اليومي: ${dailyLimit.toLocaleString('ar', { maximumFractionDigits: 0 })} بيزو`,
            agent: 'mohamed',
        };
    } catch (error) {
        return { success: false, message: 'فشل في جلب الرصيد' };
    }
}

function handlePrayerQuery(): CommandResult {
    const now = new Date();
    const hour = now.getHours();

    // Get saved prayer times or use defaults
    const saved = localStorage.getItem('baraka_prayer_times');
    let times = { fajr: '05:30', dhuhr: '12:45', asr: '16:15', maghrib: '19:30', isha: '21:00' };

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.times) {
                times = { ...times, ...parsed.times };
            }
        } catch (e) { }
    }

    // Find next prayer
    const prayers = [
        { name: 'الفجر', time: times.fajr },
        { name: 'الظهر', time: times.dhuhr },
        { name: 'العصر', time: times.asr },
        { name: 'المغرب', time: times.maghrib },
        { name: 'العشاء', time: times.isha },
    ];

    const currentMinutes = hour * 60 + now.getMinutes();

    for (const prayer of prayers) {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerMinutes = h * 60 + m;

        if (prayerMinutes > currentMinutes) {
            const diff = prayerMinutes - currentMinutes;
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            const remaining = hours > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${mins} دقيقة`;

            return {
                success: true,
                message: `🕌 الصلاة القادمة: ${prayer.name} الساعة ${prayer.time}\n⏱️ باقي: ${remaining}`,
                agent: 'ahmed',
            };
        }
    }

    return {
        success: true,
        message: `🕌 الصلاة القادمة: الفجر غداً الساعة ${times.fajr}`,
        agent: 'ahmed',
    };
}

function handleAppointmentCommand(parsed: ParsedCommand): CommandResult {
    const text = parsed.entities.description || '';

    // Extract title - remove date/time keywords
    let title = text
        .replace(/موعد|ذكرني|تذكير|مهمة|حجز|غدا|غداً|بعد غد|اليوم|بكرة|الساعة|\d+:\d+|\d+/gi, '')
        .trim() || 'موعد جديد';

    // Extract date
    let date = '';
    const today = new Date();

    if (text.includes('غدا') || text.includes('غداً') || text.includes('بكرة')) {
        const tomorrow = new Date(today.getTime() + 86400000);
        date = tomorrow.toISOString().split('T')[0];
    } else if (text.includes('بعد غد')) {
        const afterTomorrow = new Date(today.getTime() + 172800000);
        date = afterTomorrow.toISOString().split('T')[0];
    } else if (text.includes('اليوم')) {
        date = today.toISOString().split('T')[0];
    } else {
        // Default to tomorrow
        const tomorrow = new Date(today.getTime() + 86400000);
        date = tomorrow.toISOString().split('T')[0];
    }

    // Extract time
    let time = '09:00';
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // Check for time keywords
    if (text.includes('صباحا') || text.includes('الصباح')) {
        time = '09:00';
    } else if (text.includes('ظهرا') || text.includes('الظهر')) {
        time = '12:00';
    } else if (text.includes('عصرا') || text.includes('العصر')) {
        time = '16:00';
    } else if (text.includes('مساء') || text.includes('المساء')) {
        time = '19:00';
    }

    // Save appointment with proper structure
    const appointments = JSON.parse(localStorage.getItem('baraka_appointments') || '[]');
    const newApt = {
        id: Date.now().toString(),
        title: title.trim(),
        date,
        time,
        reminderMinutes: 15,
        isCompleted: false,
        createdAt: new Date().toISOString()
    };

    appointments.push(newApt);
    localStorage.setItem('baraka_appointments', JSON.stringify(appointments));

    const dateFormatted = new Date(date).toLocaleDateString('ar-EG', {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    return {
        success: true,
        message: `✅ تم حفظ الموعد:\n📅 ${title}\n🗓️ ${dateFormatted} الساعة ${time}\n🔔 تذكير قبل 15 دقيقة`,
        agent: 'fatima',
    };
}

function handleSymptomCommand(parsed: ParsedCommand): CommandResult {
    const symptoms = JSON.parse(localStorage.getItem('baraka_symptoms') || '[]');
    symptoms.push({
        id: Date.now(),
        description: parsed.entities.description,
        createdAt: new Date().toISOString(),
    });
    localStorage.setItem('baraka_symptoms', JSON.stringify(symptoms));

    return {
        success: true,
        message: '✅ تم تسجيل العرض. أنصحك بمراجعة طبيب إذا استمر.',
        agent: 'haifa',
    };
}

function handleLocationCommand(): CommandResult {
    if (!navigator.geolocation) {
        return { success: false, message: 'الجهاز لا يدعم تحديد الموقع' };
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const locations = JSON.parse(localStorage.getItem('baraka_saved_locations') || '[]');
            locations.unshift({
                id: Date.now().toString(),
                name: `موقف ${new Date().toLocaleDateString('ar')}`,
                type: 'parking',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            localStorage.setItem('baraka_saved_locations', JSON.stringify(locations));
        },
        () => { }
    );

    return {
        success: true,
        message: '📍 جاري حفظ الموقع الحالي...',
    };
}
