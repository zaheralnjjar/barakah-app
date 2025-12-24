import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { toast } = useToast();
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to notify the user they can add to home screen
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Additional check: If running in standalone mode (already installed), hide it
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast({ title: "جاري تثبيت التطبيق..." });
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible && !isIOS) return null;

    // iOS Instructions (Since prompt doesn't work on iOS)
    if (isIOS && !((navigator as any).standalone)) {
        return (
            <div className="p-4 bg-slate-100 rounded-lg text-sm text-center border border-slate-200">
                <p className="font-bold mb-2">لتثبيت التطبيق على الآيفون:</p>
                <p className="flex items-center justify-center gap-1">
                    اضغط على <ShareIcon className="w-4 h-4 inline" /> ثم اختر "إضافة إلى الصفحة الرئيسية"
                </p>
            </div>
        );
    }

    if (!isVisible) return null;

    return (
        <Button
            onClick={handleInstall}
            className="w-full justify-start gap-3 h-auto py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all"
        >
            <div className="bg-white/20 p-2 rounded-full">
                <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="text-right flex-1">
                <div className="font-bold text-sm mb-0.5">تثبيت التطبيق</div>
                <div className="text-xs text-blue-100 font-normal">إضافة للشاشة الرئيسية كأنّه تطبيق أصلي</div>
            </div>
            <Download className="h-4 w-4 opacity-50" />
        </Button>
    );
}

function ShareIcon(props: any) {
    return (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 2V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 7L12 2L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
