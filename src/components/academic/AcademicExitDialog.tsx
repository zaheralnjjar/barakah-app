import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileDown, LogOut, Save } from 'lucide-react';

interface AcademicExitDialogProps {
    isOpen: boolean;
    onClose: () => void; // Stay
    onExitOnly: () => void; // Sync & Exit
    onExportAndExit: () => void; // Export & Exit
}

export const AcademicExitDialog: React.FC<AcademicExitDialogProps> = ({
    isOpen,
    onClose,
    onExitOnly,
    onExportAndExit
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-right flex items-center gap-2 justify-end">
                        <span>تأكيد الخروج</span>
                        <LogOut className="w-5 h-5 text-red-500" />
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right" dir="rtl">
                        عند الخروج، يتم حفظ ومزامنة بياناتك تلقائياً.
                        <br />
                        هل ترغب في تصدير نسخة احتياطية (WORD/PDF) من أبحاثك قبل المغادرة؟
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                    <Button
                        onClick={(e) => { e.preventDefault(); onExportAndExit(); }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        تصدير وخروج
                    </Button>

                    <Button
                        variant="outline"
                        onClick={(e) => { e.preventDefault(); onExitOnly(); }}
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50 gap-2"
                    >
                        <Save className="w-4 h-4" />
                        مزامنة وخروج
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={(e) => { e.preventDefault(); onClose(); }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        إلغاء
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
