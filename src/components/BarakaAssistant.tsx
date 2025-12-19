import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { parseCommand, executeCommand, CommandResult } from '@/lib/barakaAI';
import { useToast } from '@/hooks/use-toast';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Send,
    X,
    Bot,
    Loader2,
    Sparkles
} from 'lucide-react';

interface Message {
    id: number;
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    agent?: string;
}

interface BarakaAssistantProps {
    onNavigateToAgent?: (agentId: string) => void;
}

const BarakaAssistant: React.FC<BarakaAssistantProps> = ({ onNavigateToAgent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            type: 'assistant',
            text: 'السلام عليكم! أنا بركة، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك التحدث معي أو الكتابة.',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const {
        transcript,
        isListening,
        startListening,
        stopListening,
        resetTranscript,
        isSupported: voiceSupported,
        error: voiceError
    } = useVoiceRecognition();

    const {
        speak,
        cancel: cancelSpeech,
        isSpeaking,
        isSupported: speechSupported
    } = useSpeechSynthesis();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-listen when opened
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen && voiceSupported) {
            timer = setTimeout(() => {
                startListening();
            }, 1000); // Wait 1 second before listening
        }
        return () => {
            if (timer) clearTimeout(timer);
            stopListening();
        };
    }, [isOpen, voiceSupported]);

    // Process voice transcript
    useEffect(() => {
        if (transcript && !isListening) {
            handleUserMessage(transcript);
            resetTranscript();
        }
    }, [isListening, transcript]);

    // Handle voice errors
    useEffect(() => {
        if (voiceError) {
            toast({
                title: 'خطأ في التعرف على الصوت',
                description: voiceError,
                variant: 'destructive',
            });
        }
    }, [voiceError]);

    const handleUserMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            type: 'user',
            text: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsProcessing(true);

        try {
            const parsed = parseCommand(text);
            const result = await executeCommand(parsed);

            const assistantMessage: Message = {
                id: Date.now() + 1,
                type: 'assistant',
                text: result.message,
                timestamp: new Date(),
                agent: result.agent,
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Speak the response
            if (speechSupported) {
                speak(result.message);
            }

            // Navigate to agent if specified
            if (result.success && result.agent && onNavigateToAgent) {
                setTimeout(() => {
                    onNavigateToAgent(result.agent!);
                }, 2000);
            }
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                type: 'assistant',
                text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleUserMessage(inputText);
    };

    const toggleVoice = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const getAgentColor = (agent?: string) => {
        const colors: { [key: string]: string } = {
            mohamed: 'bg-green-500',
            fatima: 'bg-blue-500',
            ahmed: 'bg-purple-500',
            youssef: 'bg-orange-500',
            sami: 'bg-gray-500',
            saad: 'bg-pink-500',
            haifa: 'bg-red-500',
        };
        return colors[agent || ''] || 'bg-primary';
    };

    const getAgentName = (agent?: string) => {
        const names: { [key: string]: string } = {
            mohamed: 'محمد',
            fatima: 'فاطمة',
            ahmed: 'أحمد',
            youssef: 'يوسف',
            sami: 'سامي',
            saad: 'سعد',
            haifa: 'د. هيفاء',
        };
        return names[agent || ''] || 'بركة';
    };

    return (
        <>
            {/* Floating Action Button - Bottom Left */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 left-4 w-14 h-14 rounded-full shadow-xl z-[9999] transition-all duration-300 pointer-events-auto ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                    </div>
                )}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed bottom-24 left-6 w-[90vw] max-w-[400px] h-[500px] shadow-2xl z-50 flex flex-col animate-slide-up">
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-t-lg">
                        <CardTitle className="arabic-title text-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-6 h-6" />
                                <span>مساعد بركة الذكي</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSpeaking && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={cancelSpeech}
                                    >
                                        <VolumeX className="w-4 h-4" />
                                    </Button>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {isListening ? 'أستمع...' : 'جاهز'}
                                </Badge>
                            </div>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg p-3 ${message.type === 'user'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {message.agent && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${getAgentColor(message.agent)}`} />
                                                <span className="text-xs opacity-70">{getAgentName(message.agent)}</span>
                                            </div>
                                        )}
                                        <p className="arabic-body text-sm">{message.text}</p>
                                        <span className="text-[10px] opacity-50 mt-1 block">
                                            {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isProcessing && (
                                <div className="flex justify-end">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                </div>
                            )}

                            {isListening && transcript && (
                                <div className="flex justify-start">
                                    <div className="bg-primary/20 rounded-lg p-3 border border-primary/30">
                                        <p className="arabic-body text-sm text-primary">{transcript}...</p>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-3 border-t bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant={isListening ? 'destructive' : 'outline'}
                                    onClick={toggleVoice}
                                    disabled={!voiceSupported}
                                    className="flex-shrink-0"
                                >
                                    {isListening ? (
                                        <MicOff className="w-5 h-5 animate-pulse" />
                                    ) : (
                                        <Mic className="w-5 h-5" />
                                    )}
                                </Button>

                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="اكتب رسالتك..."
                                    className="flex-1 arabic-body"
                                    disabled={isProcessing || isListening}
                                />

                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputText.trim() || isProcessing}
                                    className="flex-shrink-0"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>

                            {!voiceSupported && (
                                <p className="text-xs text-muted-foreground mt-2 arabic-body">
                                    المتصفح لا يدعم التعرف على الصوت
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default BarakaAssistant;
