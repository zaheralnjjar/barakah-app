import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Zap, Bell, Volume2, CheckSquare } from 'lucide-react';
import { useAutomationStore, TriggerType, ActionType } from '@/store/useAutomationStore';

export const AutomationBuilder = () => {
    const { rules, addRule, deleteRule, toggleRule } = useAutomationStore();
    const [newRuleName, setNewRuleName] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('time');
    const [triggerValue, setTriggerValue] = useState('');
    const [actionType, setActionType] = useState<ActionType>('notification');
    const [actionPayload, setActionPayload] = useState('');

    const handleAddRule = () => {
        if (!newRuleName || !triggerValue || !actionPayload) return;

        addRule({
            name: newRuleName,
            trigger: { type: triggerType, value: triggerValue },
            action: { type: actionType, payload: { message: actionPayload, title: actionPayload } } // Simplified payload
        });

        setNewRuleName('');
        setTriggerValue('');
        setActionPayload('');
    };

    const getTriggerIcon = (type: TriggerType) => {
        switch (type) {
            case 'time': return <span className="text-xl">⏰</span>;
            case 'location': return <span className="text-xl">📍</span>;
            case 'prayer': return <span className="text-xl">🕌</span>;
            default: return <span className="text-xl">⚡</span>;
        }
    };

    const getActionIcon = (type: ActionType) => {
        switch (type) {
            case 'notification': return <Bell className="w-4 h-4" />;
            case 'sound': return <Volume2 className="w-4 h-4" />;
            case 'todo_add': return <CheckSquare className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Creator Card */}
            <Card className="border-2 border-indigo-100 dark:border-indigo-900/50">
                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                        <Zap className="w-5 h-5 fill-indigo-200" />
                        منشئ القواعد التلقائية
                    </CardTitle>
                    <CardDescription>أتمتة مهامك: "إذا حدث كذا... فافعل كذا"</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>اسم القاعدة</Label>
                        <Input
                            placeholder="مثال: تذكير الأذكار"
                            className="text-right"
                            value={newRuleName}
                            onChange={(e) => setNewRuleName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed">
                        {/* Trigger Section */}
                        <div className="space-y-3">
                            <Label className="text-blue-600 font-bold flex items-center gap-1">
                                1. الشرط <span className="text-xs font-normal text-muted-foreground">(عندما...)</span>
                            </Label>
                            <Select value={triggerType} onValueChange={(v: any) => setTriggerType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="time">⏰ وقت محدد</SelectItem>
                                    <SelectItem value="prayer">🕌 دخول وقت صلاة</SelectItem>
                                    {/* <SelectItem value="location">📍 وصول لموقع</SelectItem> */}
                                </SelectContent>
                            </Select>

                            {triggerType === 'time' && (
                                <Input
                                    type="time"
                                    value={triggerValue}
                                    onChange={(e) => setTriggerValue(e.target.value)}
                                />
                            )}

                            {triggerType === 'prayer' && (
                                <Select value={triggerValue} onValueChange={setTriggerValue}>
                                    <SelectTrigger><SelectValue placeholder="اختر الصلاة" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fajr">الفجر</SelectItem>
                                        <SelectItem value="Dhuhr">الظهر</SelectItem>
                                        <SelectItem value="Asr">العصر</SelectItem>
                                        <SelectItem value="Maghrib">المغرب</SelectItem>
                                        <SelectItem value="Isha">العشاء</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="space-y-3">
                            <Label className="text-green-600 font-bold flex items-center gap-1">
                                2. النتيجة <span className="text-xs font-normal text-muted-foreground">(فافعل...)</span>
                            </Label>
                            <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="notification">🔔 إشعار</SelectItem>
                                    {/* <SelectItem value="sound">🔊 تشغيل صوت</SelectItem> */}
                                    <SelectItem value="todo_add">✅ إضافة مهمة</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder={actionType === 'notification' ? 'نص الرسالة' : 'عنوان المهمة'}
                                className="text-right"
                                value={actionPayload}
                                onChange={(e) => setActionPayload(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleAddRule}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={!newRuleName || !triggerValue || !actionPayload}
                    >
                        <Plus className="w-4 h-4 ml-2" /> حفظ القاعدة
                    </Button>
                </CardContent>
            </Card>

            {/* List of Rules */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">القواعد النشطة ({rules.length})</h3>
                {rules.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                        لا توجد قواعد مضافة بعد
                    </div>
                ) : (
                    rules.map((rule) => (
                        <Card key={rule.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-2xl">
                                        {getTriggerIcon(rule.trigger.type)}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">{rule.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                {rule.trigger.type === 'prayer' ? `صلاة ${rule.trigger.value}` : rule.trigger.value}
                                            </span>
                                            <span>➡️</span>
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">
                                                {getActionIcon(rule.action.type)}
                                                <span>{rule.action.payload.message || rule.action.payload.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="scale-75">
                                        <Switch
                                            checked={rule.isEnabled}
                                            onCheckedChange={() => toggleRule(rule.id)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => deleteRule(rule.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
