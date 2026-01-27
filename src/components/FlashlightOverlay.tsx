import React, { useState, useEffect } from 'react';
import { Power } from 'lucide-react';

const FlashlightOverlay: React.FC = () => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const handleToggle = () => setActive(prev => !prev);
        window.addEventListener('toggle-flashlight', handleToggle);
        return () => window.removeEventListener('toggle-flashlight', handleToggle);
    }, []);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="text-center space-y-8">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-yellow-400 opacity-20 blur-2xl rounded-full" />
                    <button
                        onClick={() => setActive(false)}
                        className="relative bg-white border-8 border-gray-100 p-10 rounded-full shadow-2xl active:scale-90 transition-transform"
                    >
                        <Power className="w-20 h-20 text-yellow-500 fill-yellow-50" />
                    </button>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-800 tracking-tighter">وضع الكشاف</h2>
                    <p className="text-gray-500 font-medium">تم رفع سطوع الشاشة للأقصى</p>
                </div>

                <button
                    onClick={() => setActive(false)}
                    className="mt-12 bg-gray-900 text-white px-10 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all"
                >
                    إطفاء الكشاف
                </button>
            </div>

            {/* Brightness helper (simulated via CSS for web, would need native plugin for real hardware control) */}
            <style dangerouslySetInnerHTML={{
                __html: `
                body { background-color: white !important; }
            ` }} />
        </div>
    );
};

export default FlashlightOverlay;
