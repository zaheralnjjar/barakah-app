import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiMessage {
    role: 'user' | 'model';
    text: string;
}

interface UseGeminiReturn {
    apiKey: string | null;
    setApiKey: (key: string) => void;
    isConfigured: boolean;
    isLoading: boolean;
    chat: (message: string, context?: string) => Promise<string>;
    analyzeFinances: (expenses: any[], question: string) => Promise<string>;
    suggestCategory: (description: string) => Promise<string>;
    generateReport: (expenses: any[], reportType: string) => Promise<string>;
    clearApiKey: () => void;
}

export const useGemini = (): UseGeminiReturn => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKeyState] = useState<string | null>(() => {
        return localStorage.getItem('baraka_gemini_api_key');
    });

    const setApiKey = useCallback((key: string) => {
        localStorage.setItem('baraka_gemini_api_key', key);
        setApiKeyState(key);
        toast({ title: 'تم الحفظ', description: 'تم حفظ مفتاح Gemini API' });
    }, [toast]);

    const clearApiKey = useCallback(() => {
        localStorage.removeItem('baraka_gemini_api_key');
        setApiKeyState(null);
        toast({ title: 'تم الحذف', description: 'تم حذف مفتاح API' });
    }, [toast]);

    const callGemini = useCallback(async (prompt: string, systemPrompt?: string): Promise<string> => {
        if (!apiKey) {
            throw new Error('مفتاح API غير موجود');
        }

        setIsLoading(true);
        try {
            const fullPrompt = systemPrompt
                ? `${systemPrompt}\n\n${prompt}`
                : prompt;

            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'فشل في الاتصال بـ Gemini');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('لم يتم الحصول على رد');
            }

            return text;
        } catch (error) {
            console.error('Gemini error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);

    // General chat
    const chat = useCallback(async (message: string, context?: string): Promise<string> => {
        const systemPrompt = `أنت مساعد ذكي عربي لنظام "بركة" لإدارة الحياة. 
تساعد المستخدم في إدارة المصاريف، المهام، والمواعيد.
أجب بالعربية دائماً وكن مختصراً ومفيداً.
${context ? `\nالسياق:\n${context}` : ''}`;

        return callGemini(message, systemPrompt);
    }, [callGemini]);

    // Analyze finances
    const analyzeFinances = useCallback(async (expenses: any[], question: string): Promise<string> => {
        const expensesSummary = expenses.slice(0, 50).map(e => ({
            amount: e.amount,
            description: e.description,
            date: new Date(e.timestamp).toLocaleDateString('ar-EG'),
            category: e.category || 'غير مصنف',
        }));

        const systemPrompt = `أنت محلل مالي ذكي. حلل البيانات التالية وأجب على السؤال.
استخدم أرقام محددة ونسب مئوية عند الإمكان.
أجب بالعربية بشكل مختصر ومفيد.

بيانات المصاريف (آخر ${expenses.length} معاملة):
${JSON.stringify(expensesSummary, null, 2)}

إجمالي المصاريف: ${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()} ARS`;

        return callGemini(question, systemPrompt);
    }, [callGemini]);

    // Suggest category for transaction
    const suggestCategory = useCallback(async (description: string): Promise<string> => {
        const systemPrompt = `أنت نظام تصنيف مصاريف. صنف المصروف التالي إلى إحدى الفئات:
طعام، مواصلات، سكن، صحة، تعليم، ترفيه، ملابس، اتصالات، فواتير، أخرى

أجب باسم الفئة فقط بدون أي توضيح إضافي.`;

        const result = await callGemini(`صنف: "${description}"`, systemPrompt);
        return result.trim();
    }, [callGemini]);

    // Generate financial report
    const generateReport = useCallback(async (expenses: any[], reportType: string): Promise<string> => {
        const expensesSummary = expenses.map(e => ({
            amount: e.amount,
            description: e.description,
            date: new Date(e.timestamp).toLocaleDateString('ar-EG'),
            category: e.category || 'غير مصنف',
        }));

        const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const systemPrompt = `أنشئ تقرير مالي ${reportType} مفصل بالعربية.
استخدم العناوين والنقاط. اذكر الأرقام والنسب.
قدم توصيات عملية للتوفير.

البيانات:
- عدد المعاملات: ${expenses.length}
- الإجمالي: ${totalAmount.toLocaleString()} ARS
- التفاصيل: ${JSON.stringify(expensesSummary.slice(0, 30), null, 2)}`;

        return callGemini(`أنشئ تقرير ${reportType}`, systemPrompt);
    }, [callGemini]);

    return {
        apiKey,
        setApiKey,
        isConfigured: !!apiKey,
        isLoading,
        chat,
        analyzeFinances,
        suggestCategory,
        generateReport,
        clearApiKey,
    };
};
