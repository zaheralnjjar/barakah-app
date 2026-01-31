import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, Mic, FolderOpen } from 'lucide-react';

const PERMISSIONS_REQUESTED_KEY = 'baraka_permissions_requested';

const PermissionsRequest = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState({
        location: 'prompt',
        camera: 'prompt',
        microphone: 'prompt'
    });

    useEffect(() => {
        // Check if we already requested permissions
        const alreadyRequested = localStorage.getItem(PERMISSIONS_REQUESTED_KEY);
        if (!alreadyRequested) {
            setShowDialog(true);
        }
    }, []);

    const requestAllPermissions = async () => {
        // Request Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => setPermissionStatus(prev => ({ ...prev, location: 'granted' })),
                () => setPermissionStatus(prev => ({ ...prev, location: 'denied' })),
                { enableHighAccuracy: true }
            );
        }

        // Request Camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionStatus(prev => ({ ...prev, camera: 'granted' }));
        } catch (e) {
            setPermissionStatus(prev => ({ ...prev, camera: 'denied' }));
        }

        // Request Microphone
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionStatus(prev => ({ ...prev, microphone: 'granted' }));
        } catch (e) {
            setPermissionStatus(prev => ({ ...prev, microphone: 'denied' }));
        }

        // Mark as requested
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');

        // Close dialog after a short delay
        setTimeout(() => setShowDialog(false), 1500);
    };

    const skipPermissions = () => {
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
        setShowDialog(false);
    };

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-md text-right" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">
                        🔐 أذونات التطبيق
                    </DialogTitle>
                    <DialogDescription className="text-center text-base mt-2">
                        يحتاج التطبيق إلى بعض الأذونات لعمل جميع الميزات بشكل صحيح
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-bold text-sm">الموقع الجغرافي</p>
                            <p className="text-xs text-gray-500">لحفظ المواقع والتنقل</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Camera className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-bold text-sm">الكاميرا</p>
                            <p className="text-xs text-gray-500">لمسح الباركود والمستندات</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Mic className="w-5 h-5 text-orange-600" />
                        <div>
                            <p className="font-bold text-sm">الميكروفون</p>
                            <p className="text-xs text-gray-500">للتسجيل الصوتي والملاحظات</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <FolderOpen className="w-5 h-5 text-purple-600" />
                        <div>
                            <p className="font-bold text-sm">الملفات</p>
                            <p className="text-xs text-gray-500">لحفظ واستيراد المستندات</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button variant="outline" onClick={skipPermissions}>
                        لاحقاً
                    </Button>
                    <Button onClick={requestAllPermissions} className="bg-green-600 hover:bg-green-700">
                        السماح للكل
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PermissionsRequest;
