import React from 'react';

const NotesHeaderSimple: React.FC = () => {
    const currentDate = new Date();

    const spanishDate = currentDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
    });

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-b-3xl p-4 shadow-sm border-b border-emerald-100 flex items-center justify-between" dir="ltr">
            <div className="flex items-center gap-2">
            </div>

            <div className="flex flex-col items-center">
                <h1 className="font-extrabold text-gray-900 tracking-tight font-arabic text-2xl">ملاحظاتي</h1>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">المفكرة الذكية</span>
            </div>

            <div className="flex flex-col items-end text-right">
                <span className="font-bold text-gray-600 leading-none text-sm">{spanishDate}</span>
                <span className="text-gray-400 leading-none text-[10px] mt-1">{hijriDate}</span>
            </div>
        </div>
    );
};

export default NotesHeaderSimple;
