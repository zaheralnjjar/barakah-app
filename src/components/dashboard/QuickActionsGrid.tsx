import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    FileText, ShoppingCart, MapPin, DollarSign, Sparkles,
    CalendarPlus, CheckSquare, Target, Navigation
} from 'lucide-react';

interface QuickActionsGridProps {
    onOpenAddDialog: (type: 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal') => void;
    onQuickParking?: () => void;
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onOpenAddDialog, onQuickParking }) => {
    const [showEventMenu, setShowEventMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [showSavedLocations, setShowSavedLocations] = useState(false);

    return (
        <>
            {/* ===== 3. QUICK ACTIONS ===== */}
            <div className="grid grid-cols-5 gap-2 mb-6">
                {[
                    { icon: FileText, label: 'ملاحظة', color: 'bg-yellow-100 text-yellow-600', action: () => onOpenAddDialog('note') },
                    { icon: ShoppingCart, label: 'للتسوق', color: 'bg-pink-100 text-pink-600', action: () => onOpenAddDialog('shopping') },
                    { icon: MapPin, label: 'موقع', color: 'bg-green-100 text-green-600', action: () => setShowLocationMenu(true) },
                    { icon: DollarSign, label: 'مصروف', color: 'bg-red-100 text-red-600', action: () => onOpenAddDialog('expense') },
                    { icon: Sparkles, label: 'حدث', color: 'bg-purple-100 text-purple-600', action: () => setShowEventMenu(true) },
                ].map((item, idx) => (
                    <button
                        key={idx}
                        onClick={item.action}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl ${item.color} hover:scale-105 transition-transform`}
                    >
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Event Type Selection Menu */}
            <Dialog open={showEventMenu} onOpenChange={setShowEventMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">اختر نوع الحدث</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-4">
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('appointment'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-orange-100 text-orange-600 hover:scale-105 transition-transform"
                        >
                            <CalendarPlus className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">موعد</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('task'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                        >
                            <CheckSquare className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">مهمة</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('goal'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-emerald-100 text-emerald-600 hover:scale-105 transition-transform"
                        >
                            <Target className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">هدف</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Location Type Selection Menu */}
            <Dialog open={showLocationMenu} onOpenChange={setShowLocationMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            الموقع
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 py-4">
                        <button
                            onClick={() => { setShowLocationMenu(false); if (onQuickParking) onQuickParking(); }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-orange-100 text-orange-700 hover:scale-105 transition-transform"
                        >
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <span className="text-xl">🅿️</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold">حفظ موقف سريع</span>
                                <span className="text-[10px] text-orange-600/80">حفظ مكان السيارة وبدء المؤقت</span>
                            </div>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setShowLocationMenu(false); onOpenAddDialog('location'); }}
                                className="flex flex-col items-center p-3 rounded-xl bg-green-100 text-green-600 hover:scale-105 transition-transform"
                            >
                                <Navigation className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">خريطة</span>
                            </button>
                            <button
                                onClick={() => { setShowLocationMenu(false); setShowSavedLocations(true); }}
                                className="flex flex-col items-center p-3 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                            >
                                <MapPin className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">المواقع</span>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Saved Locations List Dialog */}
            <Dialog open={showSavedLocations} onOpenChange={setShowSavedLocations}>
                <DialogContent className="sm:max-w-[450px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            المواقع المحفوظة
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[50vh]">
                        {(() => {
                            const savedLocations = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
                            if (savedLocations.length === 0) {
                                return (
                                    <div className="text-center py-8 text-gray-500">
                                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>لا توجد مواقع محفوظة</p>
                                        <Button
                                            className="mt-4 bg-green-500 hover:bg-green-600"
                                            onClick={() => { setShowSavedLocations(false); onOpenAddDialog('location'); }}
                                        >
                                            إضافة موقع جديد
                                        </Button>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2">
                                    {savedLocations.map((loc: any) => (
                                        <div key={loc.id} className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${loc.category === 'mosque' ? 'bg-emerald-100 text-emerald-600' :
                                                    loc.category === 'home' ? 'bg-blue-100 text-blue-600' :
                                                        loc.category === 'work' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{loc.title}</h4>
                                                    <p className="text-xs text-gray-500">{loc.category === 'mosque' ? 'مسجد' : loc.category === 'home' ? 'منزل' : loc.category === 'work' ? 'عمل' : 'آخر'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={loc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                >
                                                    <Navigation className="w-4 h-4" />
                                                </a>
                                                {/* Delete button could be added here later if needed */}
                                                {/* <button className="p-2 text-red-400 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QuickActionsGrid;
