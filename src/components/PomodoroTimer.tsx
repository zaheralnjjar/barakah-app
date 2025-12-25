import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, Save, Timer, Watch, Plus, X } from 'lucide-react';

interface Preset {
    id: number;
    name: string;
    durationMinutes: number;
}

interface PomodoroTimerProps {
    compact?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact = true }) => {
    // Mode: 'timer' (countdown) or 'stopwatch' (countup)
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
    const [isRunning, setIsRunning] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Timer state
    const [targetMinutes, setTargetMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    // Stopwatch state
    const [elapsedTime, setElapsedTime] = useState(0);

    // Presets
    const [presets, setPresets] = useState<Preset[]>([
        { id: 1, name: 'تركيز', durationMinutes: 25 },
        { id: 2, name: 'راحة قصيرة', durationMinutes: 5 },
        { id: 3, name: 'راحة طويلة', durationMinutes: 15 },
    ]);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load presets from local storage on mount
    useEffect(() => {
        const savedPresets = localStorage.getItem('pomodoro_presets');
        if (savedPresets) {
            setPresets(JSON.parse(savedPresets));
        }
    }, []);

    // Save presets when changed
    useEffect(() => {
        localStorage.setItem('pomodoro_presets', JSON.stringify(presets));
    }, [presets]);

    // Timer Logic
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                if (mode === 'timer') {
                    setTimeLeft((prev) => {
                        if (prev <= 0) {
                            clearInterval(intervalRef.current!);
                            setIsRunning(false);
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('انتهى الوقت!', { body: 'أحسنت! خذ قسطاً من الراحة.' });
                            }
                            toast({ title: '⏰ انتهى الوقت!', description: 'أحسنت!' });
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setElapsedTime(prev => prev + 1);
                }
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, mode]);

    // Format time (MM:SS or HH:MM:SS)
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        if (mode === 'timer') {
            setTimeLeft(targetMinutes * 60);
        } else {
            setElapsedTime(0);
        }
    };

    const handleDurationChange = (minutes: number) => {
        setTargetMinutes(minutes);
        setTimeLeft(minutes * 60);
        setIsRunning(false);
    };

    const loadPreset = (preset: Preset) => {
        setMode('timer');
        handleDurationChange(preset.durationMinutes);
    };

    const savePreset = () => {
        if (!newPresetName.trim()) return;

        const newPreset = {
            id: Date.now(),
            name: newPresetName,
            durationMinutes: targetMinutes
        };

        setPresets([...presets, newPreset]);
        setNewPresetName('');
        setShowSavePreset(false);
        toast({ title: 'تم حفظ المؤقت', description: `${newPreset.name} (${targetMinutes} دقيقة)` });
    };

    const startTimerAndClose = () => {
        setIsRunning(true);
        setShowDialog(false);
    };

    const currentTime = mode === 'timer' ? timeLeft : elapsedTime;

    // ===== COMPACT VIEW (When NOT running or as initial state) =====
    if (compact && !isRunning) {
        return (
            <>
                {/* Compact Shortcut Button */}
                <div
                    className="mx-2 mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    onClick={() => setShowDialog(true)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full">
                                <Timer className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-800">مؤقت التركيز</p>
                                <p className="text-xs text-indigo-500">اضغط لبدء جلسة تركيز</p>
                            </div>
                        </div>
                        <div className="text-2xl font-mono font-bold text-indigo-600/50">
                            {formatTime(targetMinutes * 60)}
                        </div>
                    </div>
                </div>

                {/* Timer Setup Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="text-right flex items-center gap-2">
                                <Timer className="w-5 h-5 text-indigo-500" /> إعداد المؤقت
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5 py-4">
                            {/* Mode Selector */}
                            <div className="flex justify-center bg-indigo-50 rounded-lg p-1">
                                <button
                                    onClick={() => setMode('timer')}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'timer' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-indigo-400 hover:text-indigo-600'}`}
                                >
                                    <Timer className="w-4 h-4 inline mr-1" /> مؤقت
                                </button>
                                <button
                                    onClick={() => setMode('stopwatch')}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'stopwatch' ? 'bg-white shadow text-pink-700 font-bold' : 'text-indigo-400 hover:text-indigo-600'}`}
                                >
                                    <Watch className="w-4 h-4 inline mr-1" /> ساعة إيقاف
                                </button>
                            </div>

                            {/* Timer Mode Settings */}
                            {mode === 'timer' && (
                                <div className="space-y-4">
                                    {/* Duration Input */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">المدة (دقيقة):</span>
                                        <Input
                                            type="number"
                                            value={targetMinutes}
                                            onChange={(e) => handleDurationChange(Number(e.target.value))}
                                            className="h-10 text-center font-mono text-lg"
                                            min={1}
                                            max={180}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowSavePreset(!showSavePreset)}
                                            title="حفظ كقالب"
                                        >
                                            <Plus className="w-4 h-4 text-indigo-500" />
                                        </Button>
                                    </div>

                                    {/* Save Preset Input */}
                                    {showSavePreset && (
                                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                                            <Input
                                                placeholder="اسم القالب (مثال: قراءة)"
                                                value={newPresetName}
                                                onChange={(e) => setNewPresetName(e.target.value)}
                                                className="h-9 text-right text-xs"
                                            />
                                            <Button size="sm" onClick={savePreset} disabled={!newPresetName.trim()} className="h-9 px-3">
                                                <Save className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Presets */}
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {presets.map(preset => (
                                            <Badge
                                                key={preset.id}
                                                variant={targetMinutes === preset.durationMinutes ? 'default' : 'outline'}
                                                className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 transition-colors py-1.5 px-3"
                                                onClick={() => loadPreset(preset)}
                                            >
                                                {preset.name} ({preset.durationMinutes}د)
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Start Button */}
                            <Button
                                className="w-full h-12 text-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                onClick={startTimerAndClose}
                            >
                                <Play className="w-5 h-5 ml-2 fill-white" /> بدء
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ===== ACTIVE TIMER VIEW (When running) =====
    return (
        <div className="mx-2 mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 rounded-xl p-4 shadow-lg animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-200">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                    style={{ width: mode === 'timer' ? `${((targetMinutes * 60 - timeLeft) / (targetMinutes * 60)) * 100}%` : '100%' }}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${isRunning ? 'bg-indigo-200 animate-pulse' : 'bg-indigo-100'}`}>
                        {mode === 'timer' ? <Timer className="w-5 h-5 text-indigo-600" /> : <Watch className="w-5 h-5 text-pink-600" />}
                    </div>
                    <div>
                        <p className="text-xs text-indigo-800 font-bold">{mode === 'timer' ? 'مؤقت التركيز' : 'ساعة الإيقاف'}</p>
                        <p className={`text-3xl font-mono font-bold tracking-wider ${isRunning ? 'text-indigo-700 animate-pulse' : 'text-gray-600'}`}>
                            {formatTime(currentTime)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant={isRunning ? 'destructive' : 'default'}
                        className={`rounded-full w-12 h-12 shadow-lg ${!isRunning ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        onClick={toggleTimer}
                    >
                        {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full w-10 h-10 border-2"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-10 h-10"
                        onClick={() => {
                            setIsRunning(false);
                            resetTimer();
                        }}
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;
