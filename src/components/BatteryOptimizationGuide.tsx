import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Battery } from 'lucide-react';

export function BatteryOptimizationGuide() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 px-4 border-orange-200 hover:bg-orange-50 hover:text-orange-700 bg-white shadow-sm transition-all">
                    <div className="bg-orange-100 p-2 rounded-full">
                        <Battery className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-right flex-1">
                        <div className="font-semibold text-sm mb-0.5">مشكلة توقف الأذان؟</div>
                        <div className="text-xs text-muted-foreground font-normal">اضغط هنا لحل مشكلة خمول البطارية</div>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" dir="rtl" aria-describedby={undefined}>
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Battery className="h-6 w-6 text-orange-500" />
                        <span>ضمان عمل الأذان في الخلفية</span>
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        تمنع بعض أنظمة الأندرويد (مثل Samsung و Xiaomi) التطبيقات من العمل في الخلفية لتوفير البطارية، مما قد يمنع صوت الأذان من الانطلاق في وقته.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-sm mt-2">
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-700 mb-2 text-base">📱 أجهزة سامسونج (Samsung)</h4>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pr-2">
                            <li>اذهب إلى <b>الضبط (Settings)</b> ← <b>التطبيقات (Apps)</b>.</li>
                            <li>ابحث عن تطبيق <b>بركة</b>.</li>
                            <li>اختر <b>البطارية (Battery)</b>.</li>
                            <li>غيّر الإعداد إلى <b>غير مقيد (Unrestricted)</b>.</li>
                        </ol>
                    </div>

                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-700 mb-2 text-base">📱 أجهزة شاومي (Xiaomi/Redmi)</h4>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pr-2">
                            <li>اضغط مطولاً على أيقونة التطبيق.</li>
                            <li>اختر <b>معلومات التطبيق (App Info)</b>.</li>
                            <li>اختر <b>موفر البطارية (Battery Saver)</b>.</li>
                            <li>اختر <b>لا توجد قيود (No restrictions)</b>.</li>
                            <li>فعّل خيار <b>التشغيل التلقائي (Autostart)</b> إن وجد.</li>
                        </ol>
                    </div>

                    <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                        <h4 className="font-bold text-green-700 mb-2 text-base">📱 أجهزة أخرى (Pixel/Generic)</h4>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pr-2">
                            <li>الإعدادات ← البطارية ← تحسين البطارية.</li>
                            <li>غيّر القائمة لعرض "كل التطبيقات".</li>
                            <li>ابحث عن بركة واختر <b>عدم التحسين (Don't optimize)</b>.</li>
                        </ol>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
