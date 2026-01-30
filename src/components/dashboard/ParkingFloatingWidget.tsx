import React, { useState, useEffect } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { Car, X, Save, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export const ParkingFloatingWidget: React.FC = () => {
    const { activeParking, cancelActiveParking, finalizeActiveParking } = useLocations();
    const { toast } = useToast();
    const [elapsed, setElapsed] = useState('00:00');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [customName, setCustomName] = useState('');

    useEffect(() => {
        if (!activeParking) return;

        const update = () => {
            const diffSec = Math.floor((new Date().getTime() - new Date(activeParking.createdAt).getTime()) / 1000);
            const hours = Math.floor(diffSec / 3600);
            const mins = Math.floor((diffSec % 3600) / 60);
            const secs = diffSec % 60;
            if (hours > 0) {
                setElapsed(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            } else {
                setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [activeParking]);

    if (!activeParking) return null;

    const handleCancel = () => {
        cancelActiveParking();
        toast({ title: 'تم إلغاء الموقف', description: 'لم يتم حفظ الموقع.' });
    };

    const handleSave = () => {
        setCustomName(activeParking.title || '');
        setShowSaveDialog(true);
    };

    const handleNavigate = () => {
        if (activeParking.lat && activeParking.lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeParking.lat},${activeParking.lng}`, '_blank');
        } else {
            toast({ title: 'الموقع غير متوفر', description: 'لا يمكن بدء الملاحة' });
        }
    };

    const handleFinalizeSave = () => {
        finalizeActiveParking(customName || activeParking.title);
        setShowSaveDialog(false);
        toast({ title: 'تم حفظ الموقف ✅', description: 'يمكنك الوصول إليه من قائمة المواقع.' });
    };

    const parkingTime = new Date(activeParking.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="fixed bottom-20 left-2 right-2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-blue-600 text-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 border border-blue-400">
                    {/* Icon */}
                    <div className="bg-white/20 p-2 rounded-xl shrink-0">
                        <Car className="w-6 h-6" />
                    </div>

                    {/* Close/Abort Button (Top Left) */}
                    <button
                        onClick={handleCancel}
                        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-50"
                        title="إلغاء الموقف"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{activeParking.title}</span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">{parkingTime}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span className="text-xl font-mono font-black tracking-wider">{elapsed}</span>
                        </div>
                        {activeParking.address && (
                            <p className="text-[10px] opacity-70 truncate mt-0.5 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {activeParking.address}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-white text-blue-700 hover:bg-blue-50 h-8 px-3 text-xs font-bold shadow"
                        >
                            <Save className="w-3 h-3 ml-1" />
                            حفظ
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleNavigate}
                            className="text-white/80 hover:bg-white/10 h-7 px-2 text-[10px]"
                        >
                            <Navigation className="w-3 h-3 ml-1" />
                            ملاحة
                        </Button>
                    </div>
                </div>
            </div>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-sm" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-blue-600" />
                            حفظ موقف السيارة
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">اسم الموقع</label>
                            <Input
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="مثال: أمام المجمع التجاري"
                                className="text-right"
                            />
                        </div>
                        {activeParking.address && (
                            <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600">
                                <p className="font-bold mb-1">العنوان:</p>
                                <p>{activeParking.address}</p>
                            </div>
                        )}
                        <Button onClick={handleFinalizeSave} className="w-full bg-blue-600 hover:bg-blue-700">
                            حفظ الموقف
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
