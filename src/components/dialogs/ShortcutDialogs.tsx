import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, AlertTriangle, Phone, Save } from 'lucide-react';

export const ShortcutDialogs = () => {
    const { toast } = useToast();

    // Distraction Dialog State
    const [showDistraction, setShowDistraction] = useState(false);
    const [distractionReason, setDistractionReason] = useState('');

    // Medical Profile State
    const [showMedical, setShowMedical] = useState(false);
    const [medicalProfile, setMedicalProfile] = useState<any>(null);

    // Initial load of medical profile
    useEffect(() => {
        if (showMedical) {
            const fetchProfile = async () => {
                const { data } = await supabase.from('medical_profile').select('*').single();
                setMedicalProfile(data);
            };
            fetchProfile();
        }
    }, [showMedical]);


    useEffect(() => {
        const handleOpenDistraction = () => setShowDistraction(true);
        const handleOpenMedical = () => setShowMedical(true);

        window.addEventListener('open-distraction-dialog', handleOpenDistraction);
        window.addEventListener('open-medical-profile', handleOpenMedical);

        return () => {
            window.removeEventListener('open-distraction-dialog', handleOpenDistraction);
            window.removeEventListener('open-medical-profile', handleOpenMedical);
        };
    }, []);

    const handleSaveDistraction = async () => {
        if (!distractionReason.trim()) return;

        const { error } = await supabase.from('distraction_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            reason: distractionReason
        });

        if (!error) {
            toast({ title: 'تم التسجيل', description: 'تم تسجيل سبب التشتت بنجاح' });
            setShowDistraction(false);
            setDistractionReason('');
        } else {
            toast({ title: 'خطأ', description: 'فشل التسجيل', variant: 'destructive' });
        }
    };

    return (
        <>
            {/* Distraction Dialog */}
            <Dialog open={showDistraction} onOpenChange={setShowDistraction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            تسجيل تشتت
                        </DialogTitle>
                        <DialogDescription>
                            ما الذي يشتت انتباهك الآن؟ الاعتراف بالمشكلة هو أول خطوة للحل.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={distractionReason}
                            onChange={(e) => setDistractionReason(e.target.value)}
                            placeholder="مثال: تصفح فيسبوك، ضجيج، مكالمة هاتفية..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDistraction(false)}>إلغاء</Button>
                        <Button onClick={handleSaveDistraction}>حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Medical / Emergency Dialog */}
            <Dialog open={showMedical} onOpenChange={setShowMedical}>
                <DialogContent className="border-red-500 border-2 bg-red-50/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Heart className="w-6 h-6 fill-red-600 animate-pulse" />
                            بطاقة الطوارئ الطبية
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-right">
                        {medicalProfile ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                                        <Label className="text-gray-500 text-xs">فصيلة الدم</Label>
                                        <p className="text-2xl font-bold text-red-700">{medicalProfile.blood_type || 'غير محدد'}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                                        <Label className="text-gray-500 text-xs">حساسية</Label>
                                        <p className="font-semibold">{medicalProfile.allergies || 'لا يوجد'}</p>
                                    </div>
                                </div>

                                <div className="bg-red-100/50 p-4 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="w-4 h-4 text-red-600" />
                                        <h4 className="font-bold text-red-800">جهة اتصال للطوارئ</h4>
                                    </div>
                                    <p className="text-lg font-semibold">{medicalProfile.emergency_contact_name}</p>
                                    <a href={`tel:${medicalProfile.emergency_contact_phone}`} className="text-xl font-bold text-blue-600 block mt-1 dir-ltr text-right">
                                        {medicalProfile.emergency_contact_phone}
                                    </a>
                                </div>

                                {medicalProfile.notes && (
                                    <div className="bg-white p-3 rounded-lg border">
                                        <Label className="text-gray-500 text-xs">ملاحظات طبية</Label>
                                        <p>{medicalProfile.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>لم يتم إعداد الملف الطبي بعد.</p>
                                <Button variant="link" className="text-blue-600">إعداد الآن</Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowMedical(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
