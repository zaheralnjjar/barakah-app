import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationBell } from '@/components/NotificationBell';
import HolidaysDialog from '@/components/HolidaysDialog';

interface DashboardHeaderProps {
    currentDate?: Date;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentDate = new Date() }) => {
    const [showHolidaysPopup, setShowHolidaysPopup] = useState(false);
    const [showBarakahPopup, setShowBarakahPopup] = useState(false);

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            {/* ===== 1. HEADER ===== */}
            <div className="bg-gradient-to-l from-emerald-50 to-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-6">
                <div className="flex items-center justify-between gap-3">
                    {/* Date Info - Right Side (First in RTL) - CLICKABLE */}
                    <div
                        className="bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2 text-center min-w-[120px] cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => setShowHolidaysPopup(true)}
                    >
                        <span className="text-sm font-bold block">{currentDate.getDate()} {currentDate.toLocaleDateString('ar', { month: 'long' })}</span>
                        <div className="border-t border-emerald-300 my-1"></div>
                        <span className="text-xs block">{hijriDate}</span>
                    </div>

                    {/* Logo - Centered & Larger */}
                    <div className="flex-1 text-center cursor-pointer" onClick={() => setShowBarakahPopup(true)}>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">البركة</h1>
                        <span className="text-xs text-gray-400">Barakah Life</span>
                    </div>

                    {/* Notification Bell - Left Side (Last in RTL) */}
                    <div className="flex items-center">
                        <NotificationBell />
                    </div>
                </div>
            </div>

            {/* Holidays Dialog */}
            <HolidaysDialog open={showHolidaysPopup} onOpenChange={setShowHolidaysPopup} />

            {/* Barakah Credits Popup */}
            <Dialog open={showBarakahPopup} onOpenChange={setShowBarakahPopup}>
                <DialogContent className="w-[85%] max-w-[280px] rounded-xl text-center bg-white/95 backdrop-blur border-emerald-100 !top-32 !translate-y-0 p-4 shadow-xl">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-emerald-700 font-bold text-lg">✨ البركة ✨</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-base font-medium text-gray-700 leading-relaxed font-arabic">
                            "اللهم بارك لنا في أعمالنا وأعمارنا"
                        </p>
                        <div className="w-12 h-1 bg-emerald-100 mx-auto rounded-full"></div>
                        <div className="text-xs text-gray-500">
                            <p>فكرة وتنفيذ</p>
                            <p className="font-bold text-emerald-600 mt-1">محمد زاهر</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DashboardHeader;
