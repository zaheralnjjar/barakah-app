import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useGemini } from '@/hooks/useGemini';
import { Bot, Send, Loader2, Sparkles, TrendingDown, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
    const { chat, analyzeFinances, generateReport, isLoading, isConfigured } = useGemini();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [expenses, setExpenses] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load expenses for context
    useEffect(() => {
        const loadExpenses = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            if (data?.pending_expenses) {
                setExpenses(data.pending_expenses);
            }
        };
        if (isOpen) loadExpenses();
    }, [isOpen]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0 && isConfigured) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                text: 'مرحباً! أنا مساعدك الذكي في نظام بركة 🌟\n\nيمكنني مساعدتك في:\n• تحليل مصاريفك\n• اقتراحات للتوفير\n• إنشاء تقارير مالية\n\nاسألني أي سؤال!',
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, isConfigured, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            let response: string;

            // Check for special commands
            const lowerInput = input.toLowerCase();
            if (lowerInput.includes('تقرير') || lowerInput.includes('ملخص')) {
                response = await generateReport(expenses, 'أسبوعي');
            } else if (lowerInput.includes('مصاريف') || lowerInput.includes('انفق') || lowerInput.includes('أنفق')) {
                response = await analyzeFinances(expenses, input);
            } else {
                // General chat with expense context
                const context = `المستخدم لديه ${expenses.length} معاملة مالية، إجمالي المصاريف ${expenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()} ARS`;
                response = await chat(input, context);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: `عذراً، حدث خطأ: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const quickActions = [
        { icon: <TrendingDown className="w-4 h-4" />, label: 'تحليل المصاريف', prompt: 'حلل مصاريفي واعطني ملخص' },
        { icon: <Sparkles className="w-4 h-4" />, label: 'اقتراحات توفير', prompt: 'كيف أوفر من مصاريفي؟' },
        { icon: <FileText className="w-4 h-4" />, label: 'تقرير أسبوعي', prompt: 'أنشئ تقرير أسبوعي' },
    ];

    if (!isConfigured) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 arabic-title">
                            <Bot className="w-6 h-6 text-green-600" />
                            المساعد الذكي
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-8">
                        <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 arabic-body">
                            لتفعيل المساعد الذكي، أضف مفتاح Gemini API في الإعدادات
                        </p>
                        <Button onClick={onClose} className="mt-4">
                            اذهب للإعدادات
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-l from-green-500 to-green-600 text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6" />
                        <span className="font-bold arabic-title">المساعد الذكي</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                            <Card className={`max-w-[85%] p-3 ${msg.role === 'user'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap arabic-body">{msg.text}</p>
                            </Card>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-end">
                            <Card className="p-3 bg-white">
                                <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                            </Card>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t bg-white">
                        {quickActions.map((action, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap text-xs"
                                onClick={() => {
                                    setInput(action.prompt);
                                    setTimeout(handleSend, 100);
                                }}
                            >
                                {action.icon}
                                <span className="mr-1">{action.label}</span>
                            </Button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اكتب سؤالك..."
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AIAssistant;
