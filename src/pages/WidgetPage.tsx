import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useLocations } from '@/hooks/useLocations';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useFinance } from '@/hooks/useFinance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Clock, CheckSquare, Calendar, Wallet, Moon, Sun, Sunrise, Sunset,
    ListChecks, ShoppingCart, StickyNote, Heart, Pill, MapPin, Check,
    Plus, ExternalLink, Navigation, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const WidgetPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const widgetTypeParam = searchParams.get('type') || 'all';
    const widgetTypes = widgetTypeParam.split(',').map(t => t.trim());
    const { toast } = useToast();

    // Quick expense state
    const [quickExpenseAmount, setQuickExpenseAmount] = useState('');
    const [quickExpenseDesc, setQuickExpenseDesc] = useState('');

    // Helper to check if a type should be shown
    const shouldShow = (type: string) => widgetTypes.includes('all') || widgetTypes.includes(type);

    const {
        financeData,
        dailyLimitARS,
        prayerTimes,
        nextPrayer,
        timeUntilNext,
        loading,
        shoppingListSummary,
        savedLocations
    } = useDashboardData();

    const { tasks, updateTask } = useTasks();
    const { appointments } = useAppointments();
    const { habits, toggleHabit } = useHabits();
    const { medications, toggleMedTaken } = useMedications();
    const { getLocationsOnly } = useLocations();
    const { notesHistory } = useQuickNotes();
    const { addTransaction } = useFinance();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = financeData?.pending_expenses
        ?.filter((t: any) => t.type === 'expense' && t.timestamp?.startsWith(todayStr))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const pendingTasks = useMemo(() => tasks.filter(t => t.progress < 100).slice(0, 6), [tasks]);

    const upcomingAppts = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(a => new Date(`${a.date}T${a.time}`) > now)
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
            .slice(0, 5);
    }, [appointments]);

    const locations = useMemo(() => {
        try { return getLocationsOnly?.() || savedLocations || []; } catch { return []; }
    }, [getLocationsOnly, savedLocations]);

    const getPrayerIcon = (name: string) => {
        switch (name) {
            case 'fajr': return <Moon className="w-3 h-3" />;
            case 'sunrise': return <Sunrise className="w-3 h-3" />;
            case 'dhuhr': return <Sun className="w-3 h-3" />;
            case 'asr': return <Sun className="w-3 h-3 opacity-80" />;
            case 'maghrib': return <Sunset className="w-3 h-3" />;
            case 'isha': return <Moon className="w-3 h-3 opacity-80" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    // Interactive handlers
    const handleCompleteTask = async (task: any) => {
        const updatedTask = { ...task, progress: 100 };
        await updateTask(updatedTask);
        toast({ title: 'تم إكمال المهمة ✓' });
    };

    const handleQuickExpense = async () => {
        if (!quickExpenseAmount || isNaN(Number(quickExpenseAmount))) return;
        await addTransaction({
            type: 'expense',
            amount: Number(quickExpenseAmount),
            description: quickExpenseDesc || 'مصروف سريع',
            category: 'other',
            currency: 'ARS'
        });
        setQuickExpenseAmount('');
        setQuickExpenseDesc('');
        toast({ title: 'تم تسجيل المصروف ✓' });
    };

    const handleToggleHabit = async (habitId: string) => {
        if (toggleHabit) {
            toggleHabit(habitId);
            toast({ title: 'تم تحديث العادة ✓' });
        }
    };

    const handleMedicationTaken = async (medId: string) => {
        if (toggleMedTaken) {
            await toggleMedTaken(medId, todayStr);
            toast({ title: 'تم تسجيل الدواء ✓' });
        }
    };

    const openLocation = (loc: any) => {
        if (loc.lat && loc.lng) {
            window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
        } else if (loc.url) {
            window.open(loc.url, '_blank');
        }
    };

    const openMainApp = () => {
        window.open('/', '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 text-sm font-medium">
                <div className="animate-pulse">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-3 flex flex-col gap-3 overflow-auto">

            {/* ===== FINANCE ===== */}
            {shouldShow('finance') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg"><Wallet className="w-4 h-4 text-blue-600" /></div>
                            <span className="text-sm font-bold text-gray-800">المالية</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                            <div className="bg-red-50 p-2 rounded-lg">
                                <p className="text-[9px] text-red-600 font-medium">مصروف اليوم</p>
                                <p className="text-sm font-bold text-red-700 font-mono">{todayExpense.toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded-lg">
                                <p className="text-[9px] text-emerald-600 font-medium">الحد اليومي</p>
                                <p className="text-sm font-bold text-emerald-700 font-mono">{dailyLimitARS.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <p className="text-[9px] text-blue-600 font-medium">الرصيد</p>
                                <p className="text-sm font-bold text-blue-700 font-mono">{(financeData?.current_balance_ars || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        {/* Quick Expense Form */}
                        <div className="flex gap-1.5 items-center">
                            <Input
                                type="number"
                                placeholder="المبلغ"
                                value={quickExpenseAmount}
                                onChange={(e) => setQuickExpenseAmount(e.target.value)}
                                className="h-8 text-xs flex-1"
                            />
                            <Input
                                placeholder="الوصف (اختياري)"
                                value={quickExpenseDesc}
                                onChange={(e) => setQuickExpenseDesc(e.target.value)}
                                className="h-8 text-xs flex-1"
                            />
                            <Button
                                size="sm"
                                onClick={handleQuickExpense}
                                className="h-8 px-3 bg-red-500 hover:bg-red-600"
                            >
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ===== PRAYER ===== */}
            {shouldShow('prayer') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 rounded-lg"><Clock className="w-4 h-4 text-amber-600" /></div>
                                <span className="text-sm font-bold text-gray-800">أوقات الصلاة</span>
                            </div>
                            {nextPrayer && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                                    {nextPrayer.nameAr} بعد {timeUntilNext}
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-6 gap-1 text-center">
                            {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(key => {
                                const prayer = prayerTimes.find((p: any) => p.name === key);
                                if (!prayer) return null;
                                const isNext = nextPrayer?.name === key;
                                return (
                                    <div key={key} className={`p-1.5 rounded-lg ${isNext ? 'bg-emerald-100' : 'bg-gray-50'}`}>
                                        <div className={`mx-auto mb-0.5 ${isNext ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {getPrayerIcon(key)}
                                        </div>
                                        <p className={`text-[8px] ${isNext ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>{prayer.nameAr}</p>
                                        <p className={`text-[10px] font-mono ${isNext ? 'text-emerald-800 font-bold' : 'text-gray-700'}`}>{prayer.time}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ===== TASKS (Interactive) ===== */}
            {shouldShow('tasks') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg"><ListChecks className="w-4 h-4 text-purple-600" /></div>
                            <span className="text-sm font-bold text-gray-800">المهام</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">{pendingTasks.length} متبقية</Badge>
                        </div>
                        {pendingTasks.length > 0 ? (
                            <div className="space-y-1.5">
                                {pendingTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-2 p-2 bg-purple-50/50 rounded-lg hover:bg-purple-100/50 cursor-pointer transition-colors group"
                                        onClick={() => handleCompleteTask(task)}
                                    >
                                        <div className="w-4 h-4 rounded border-2 border-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-500 transition-colors">
                                            <Check className="w-3 h-3 text-transparent group-hover:text-white" />
                                        </div>
                                        <span className="text-xs text-gray-700 truncate flex-1">{task.title}</span>
                                        {task.priority === 'high' && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد مهام معلقة ✓</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== APPOINTMENTS ===== */}
            {shouldShow('appointments') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-rose-100 rounded-lg"><Calendar className="w-4 h-4 text-rose-600" /></div>
                            <span className="text-sm font-bold text-gray-800">المواعيد القادمة</span>
                        </div>
                        {upcomingAppts.length > 0 ? (
                            <div className="space-y-1.5">
                                {upcomingAppts.map(appt => (
                                    <div
                                        key={appt.id}
                                        className="flex items-center gap-2 p-2 bg-rose-50/50 rounded-lg hover:bg-rose-100/50 cursor-pointer transition-colors"
                                        onClick={() => appt.location && window.open(`https://www.google.com/maps/search/${encodeURIComponent(appt.location)}`, '_blank')}
                                    >
                                        <div className="text-center min-w-[40px]">
                                            <p className="text-[10px] text-rose-600 font-medium">{format(new Date(appt.date), 'EEE', { locale: ar })}</p>
                                            <p className="text-xs font-bold text-rose-700">{appt.time}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-700 truncate font-medium">{appt.title}</p>
                                            {appt.location && (
                                                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                    <Navigation className="w-2.5 h-2.5" /> {appt.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد مواعيد قادمة</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== SHOPPING (Interactive) ===== */}
            {shouldShow('shopping') && shoppingListSummary && (() => {
                // Get full shopping list for interactive updates
                const shoppingList = JSON.parse(localStorage.getItem('baraka_shopping_list') || '[]');

                const toggleShoppingItem = (itemIndex: number) => {
                    const updatedList = [...shoppingList];
                    updatedList[itemIndex].completed = !updatedList[itemIndex].completed;
                    localStorage.setItem('baraka_shopping_list', JSON.stringify(updatedList));
                    window.location.reload(); // Simple reload to reflect changes
                };

                return (
                    <Card className="border-0 shadow-md bg-white/90">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-orange-100 rounded-lg"><ShoppingCart className="w-4 h-4 text-orange-600" /></div>
                                <span className="text-sm font-bold text-gray-800">قائمة التسوق</span>
                                <Badge variant="outline" className="ml-auto text-[10px]">
                                    {shoppingList.filter((i: any) => i.completed).length}/{shoppingList.length}
                                </Badge>
                            </div>
                            {shoppingList.length > 0 ? (
                                <div className="space-y-1">
                                    {shoppingList.slice(0, 8).map((item: any, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleShoppingItem(idx)}
                                            className="flex items-center gap-2 p-1.5 bg-orange-50/50 rounded-lg hover:bg-orange-100/50 cursor-pointer transition-colors active:scale-[0.98]"
                                        >
                                            <div className={`w-5 h-5 rounded border-2 ${item.completed ? 'bg-green-500 border-green-500' : 'border-orange-300 hover:border-orange-500'} flex items-center justify-center transition-colors`}>
                                                {item.completed && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-xs block ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.name}</span>
                                                <div className="flex gap-2 text-[9px] text-gray-400">
                                                    {item.addedAt && <span>أُضيف: {item.addedAt}</span>}
                                                    {item.deadline && <span className="text-red-400">قبل: {item.deadline}</span>}
                                                </div>
                                            </div>
                                            {item.quantity > 1 && <span className="text-[10px] text-orange-500">×{item.quantity}</span>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">القائمة فارغة</p>
                            )}
                        </CardContent>
                    </Card>
                );
            })()}

            {/* ===== NOTES ===== */}
            {shouldShow('notes') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-yellow-100 rounded-lg"><StickyNote className="w-4 h-4 text-yellow-600" /></div>
                            <span className="text-sm font-bold text-gray-800">الملاحظات</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">{notesHistory?.length || 0}</Badge>
                        </div>
                        {notesHistory && notesHistory.length > 0 ? (
                            <div className="space-y-1.5">
                                {notesHistory.slice(0, 4).map((note: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-yellow-50/50 rounded-lg hover:bg-yellow-100/50 cursor-pointer transition-colors">
                                        <p className="text-xs font-medium text-gray-700 truncate">{note.content?.split('\n')[0]?.substring(0, 40) || 'ملاحظة'}</p>
                                        <p className="text-[9px] text-gray-400 mt-0.5 truncate">{note.content?.substring(0, 60)?.replace(/\n/g, ' ')}...</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد ملاحظات</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== HABITS (Interactive) ===== */}
            {shouldShow('habits') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-pink-100 rounded-lg"><Heart className="w-4 h-4 text-pink-600" /></div>
                            <span className="text-sm font-bold text-gray-800">العادات</span>
                        </div>
                        {habits && habits.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5">
                                {habits.slice(0, 6).map((habit: any) => {
                                    const isCompleted = habit.completedDates?.includes(todayStr);
                                    return (
                                        <div
                                            key={habit.id}
                                            onClick={() => handleToggleHabit(habit.id)}
                                            className={`p-2 rounded-lg text-center cursor-pointer transition-all ${isCompleted
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-pink-50/50 hover:bg-pink-100'
                                                }`}
                                        >
                                            <p className={`text-xs truncate ${isCompleted ? 'font-bold' : 'text-gray-700'}`}>{habit.name}</p>
                                            <p className={`text-[10px] mt-0.5 ${isCompleted ? 'text-pink-100' : 'text-pink-500'}`}>
                                                {isCompleted ? '✓ مكتملة' : `${habit.streak || 0} يوم`}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد عادات</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== MEDICATIONS (Interactive) ===== */}
            {shouldShow('medications') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-cyan-100 rounded-lg"><Pill className="w-4 h-4 text-cyan-600" /></div>
                            <span className="text-sm font-bold text-gray-800">الأدوية</span>
                        </div>
                        {medications && medications.length > 0 ? (
                            <div className="space-y-1.5">
                                {medications.slice(0, 5).map((med: any) => {
                                    const isTaken = med.takenDates?.includes(todayStr);
                                    return (
                                        <div
                                            key={med.id}
                                            onClick={() => !isTaken && handleMedicationTaken(med.id)}
                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${isTaken
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-cyan-50/50 hover:bg-cyan-100'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isTaken ? 'bg-white' : 'border-2 border-cyan-400'}`}>
                                                {isTaken && <Check className="w-3 h-3 text-cyan-500" />}
                                            </div>
                                            <span className={`text-xs flex-1 truncate ${isTaken ? 'line-through opacity-80' : 'text-gray-700'}`}>{med.name}</span>
                                            <span className={`text-[10px] ${isTaken ? 'text-cyan-100' : 'text-cyan-600'}`}>{med.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد أدوية</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== LOCATIONS (Interactive) ===== */}
            {shouldShow('locations') && (
                <Card className="border-0 shadow-md bg-white/90">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-indigo-100 rounded-lg"><MapPin className="w-4 h-4 text-indigo-600" /></div>
                            <span className="text-sm font-bold text-gray-800">المواقع المحفوظة</span>
                        </div>
                        {locations && locations.length > 0 ? (
                            <div className="space-y-1.5">
                                {locations.slice(0, 5).map((loc: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => openLocation(loc)}
                                        className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors group"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-xs text-gray-700 flex-1 truncate">{loc.name || loc.label || loc.title || 'موقع محفوظ'}</span>
                                        <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد مواقع محفوظة</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Footer with actions */}
            <div className="mt-auto pt-2 border-t border-gray-100">
                <div className="flex gap-2 justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-3 h-3 ml-1" />
                        تحديث
                    </Button>
                    <Button
                        size="sm"
                        className="text-[10px] h-7 bg-emerald-600 hover:bg-emerald-700"
                        onClick={openMainApp}
                    >
                        <ExternalLink className="w-3 h-3 ml-1" />
                        فتح التطبيق
                    </Button>
                </div>
                <p className="text-[9px] text-gray-400 font-mono text-center mt-2">Barakah Life Management</p>
            </div>
        </div>
    );
};

export default WidgetPage;
