import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, MapPin, Navigation, Save, X } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DashboardParking: React.FC = () => {
    const { getParkingOnly, deleteLocation, updateLocation } = useLocations();
    const { toast } = useToast();
    const [parkingDuration, setParkingDuration] = useState<string | null>(null);
    const [latestParking, setLatestParking] = useState<any>(null);

    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Parking Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const spots = getParkingOnly();
            if (spots.length > 0) {
                const latest = spots.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                setLatestParking(latest);

                const start = new Date(latest.createdAt).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                if (diff < 0) {
                    setParkingDuration('00:00:00');
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setParkingDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            } else {
                setParkingDuration(null);
                setLatestParking(null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [getParkingOnly]);

    const handleStopAndNavigate = async () => {
        if (latestParking) {
            const url = latestParking.url || `https://www.google.com/maps/dir/?api=1&destination=${latestParking.lat},${latestParking.lng}`;
            await deleteLocation(latestParking.id);
            setParkingDuration(null);
            setLatestParking(null);
            window.open(url, '_blank');
            toast({ title: '🛑 تم إيقاف المؤقت وفتح الملاحة' });
        }
    };

    const openEditDialog = () => {
        if (latestParking) {
            setEditName(latestParking.title.split(' 202')[0]); // Remove simple timestamp if present
            setEditAddress(latestParking.address || '');
            setEditNotes(latestParking.notes || '');
            setIsEditDialogOpen(true);
        }
    };

    const saveEdit = async () => {
        if (latestParking && editName.trim()) {
            await updateLocation(latestParking.id, {
                title: editName,
                address: editAddress,
                notes: editNotes
            });
            setIsEditDialogOpen(false);
            toast({ title: '✅ تم تحديث بيانات الموقف' });
        }
    };

    if (!parkingDuration || !latestParking) return null;

    return (
        <div id="parking-section" className="mx-2 mb-4 bg-white border border-orange-200 rounded-xl shadow-md animate-fade-in relative overflow-hidden">
            {/* Header / Timer Section */}
            <div className="bg-orange-50 p-3 border-b border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full shadow-sm animate-pulse">
                        <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-xs text-orange-800 font-bold">مدة الوقوف</p>
                        <p className="text-2xl font-mono font-bold text-orange-600 dir-ltr leading-none mt-0.5">{parkingDuration}</p>
                    </div>
                </div>
            </div>

            {/* Address Details */}
            <div className="p-3 bg-white">
                <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{latestParking.title}</p>
                        {latestParking.address && (
                            <p className="text-xs text-gray-500 mt-1">{latestParking.address}</p>
                        )}
                        {latestParking.notes && (
                            <p className="text-xs text-blue-500 mt-1 italic border-r-2 border-blue-200 pr-2 mr-1">{latestParking.notes}</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                    {/* 1. Save / Edit Button */}
                    <Button
                        variant="outline"
                        className="h-10 border-blue-200 hover:bg-blue-50 text-blue-700 flex flex-col items-center justify-center gap-0.5"
                        onClick={openEditDialog}
                    >
                        <Save className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px]">تعديل / حفظ</span>
                    </Button>

                    {/* 2. Stop / Navigate Button */}
                    <Button
                        className="h-10 bg-red-500 hover:bg-red-600 text-white flex flex-col items-center justify-center gap-0.5 shadow-sm"
                        onClick={handleStopAndNavigate}
                    >
                        <Navigation className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px]">إيقاف وملاحة</span>
                    </Button>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل اسم الموقع</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم الموقع</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="مثال: السيارة صف ثاني"
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>العنوان (الشارع، الرقم)</Label>
                            <Input
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                placeholder="مثال: شارع الملك فهد، ٤٥"
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="مثال: الطابق الثاني، رقم الموقف B4"
                                className="text-right"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={saveEdit}>حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
