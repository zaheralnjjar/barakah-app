import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, Save, Timer, Watch, Plus } from 'lucide-react';

interface Preset {
    id: number;
    name: string;
    durationMinutes: number;
}

const PomodoroTimer: React.FC = () => {
    // Mode: 'timer' (countdown) or 'stopwatch' (countup)
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
    const [isRunning, setIsRunning] = useState(false);

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
                            // Play sound or notification here
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('انتهى الوقت!', { body: 'أحسنت! خذ قسطاً من الراحة.' });
                            }
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

    // Format time (MM:SS)
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
        setMode('timer'); // Verify mode
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

    const deletePreset = (id: number) => {
        setPresets(presets.filter(p => p.id !== id));
    };

    // Calculate progress for circle (only for timer)
    const progress = mode === 'timer'
        ? ((targetMinutes * 60 - timeLeft) / (targetMinutes * 60)) * 100
        : 0;

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50/50 to-white backdrop-blur-sm overflow-hidden mb-6 relative">
            <div className="absolute top-0 right-0 w-full h-1 bg-indigo-500/20">
                <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${mode === 'timer' ? (100 - progress) : 100}%` }}
                />
            </div>

            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                    <Timer className="w-5 h-5" /> مؤقت التركيز
                </CardTitle>
                <div className="flex bg-indigo-100/50 rounded-lg p-1">
                    <button
                        onClick={() => { setMode('timer'); setIsRunning(false); }}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'timer' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-indigo-400 hover:text-indigo-600'}`}
                    >
                        مؤقت
                    </button>
                    <button
                        onClick={() => { setMode('stopwatch'); setIsRunning(false); }}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'stopwatch' ? 'bg-white shadow text-pink-700 font-bold' : 'text-indigo-400 hover:text-indigo-600'}`}
                    >
                        ساعة إيقاف
                    </button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
                {/* Time Display */}
                <div className="flex flex-col items-center justify-center">
                    <div className={`text-6xl font-mono font-bold tracking-wider mb-2 ${isRunning ? 'animate-pulse text-indigo-600' : 'text-gray-700'}`}>
                        {formatTime(mode === 'timer' ? timeLeft : elapsedTime)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-2">
                        <Button
                            size="lg"
                            className={`rounded-full w-14 h-14 shadow-lg ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            onClick={toggleTimer}
                        >
                            {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-10 h-10 border-2"
                            onClick={resetTimer}
                        >
                            <RotateCcw className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                </div>

                {/* Timer Settings (Only visible in Timer mode) */}
                {mode === 'timer' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Custom Duration Input */}
                        {!isRunning && (
                            <div className="flex items-center gap-2 px-4">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">المدة (دقيقة):</span>
                                <Input
                                    type="number"
                                    value={targetMinutes}
                                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                                    className="h-8 text-center font-mono"
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
                        )}

                        {/* Save Preset Input */}
                        {showSavePreset && (
                            <div className="flex gap-2 px-4 animate-in slide-in-from-top-2">
                                <Input
                                    placeholder="اسم القالب (مثال: قراءة)"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className="h-8 text-right text-xs"
                                />
                                <Button size="sm" onClick={savePreset} disabled={!newPresetName.trim()} className="h-8 px-2">
                                    <Save className="w-3 h-3" />
                                </Button>
                            </div>
                        )}

                        {/* Presets Chips */}
                        <div className="flex flex-wrap justify-center gap-2 px-2">
                            {presets.map(preset => (
                                <Badge
                                    key={preset.id}
                                    variant={targetMinutes === preset.durationMinutes ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 transition-colors py-1 px-3"
                                    onClick={() => loadPreset(preset)}
                                >
                                    {preset.name} ({preset.durationMinutes}د)
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PomodoroTimer;
