import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronLeft } from 'lucide-react';

interface QuadrantNotesProps {
    notes: any[];
}

export const QuadrantNotes: React.FC<QuadrantNotesProps> = ({ notes }) => {
    return (
        <Card className="h-full border-amber-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-amber-800 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    الملاحظات
                </h3>
            </div>
            <CardContent className="p-0 h-[calc(100%-45px)] overflow-y-auto custom-scrollbar">
                {notes.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        لا توجد ملاحظات حالية
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notes.slice(0, 10).map((note, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{note.title || 'بدون عنوان'}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(note.updated_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
