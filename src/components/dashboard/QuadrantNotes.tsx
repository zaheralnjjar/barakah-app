import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronLeft } from 'lucide-react';

interface QuadrantNotesProps {
    notes: any[];
    onOpenNote?: (note: any) => void;
}

export const QuadrantNotes: React.FC<QuadrantNotesProps> = ({ notes, onOpenNote }) => {
    return (
        <Card className="h-full border-amber-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-1.5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-amber-800 flex items-center gap-1.5 text-[10px]">
                    <FileText className="w-3.5 h-3.5" />
                    الملاحظات
                </h3>
            </div>
            <CardContent className="p-0 h-[calc(100%-30px)] overflow-y-auto custom-scrollbar">
                {notes.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs text-[10px]">
                        لا توجد ملاحظات
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notes.slice(0, 10).map((note, idx) => (
                            <div
                                key={idx}
                                className="p-2 flex items-center justify-between hover:bg-gray-100/50 transition-colors group cursor-pointer"
                                onClick={() => onOpenNote?.(note)}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-800 truncate">{note.title || 'بدون عنوان'}</p>
                                        <p className="text-[8px] text-gray-400 leading-none">
                                            {new Date(note.updated_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                <ChevronLeft className="w-3 h-3 text-gray-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
