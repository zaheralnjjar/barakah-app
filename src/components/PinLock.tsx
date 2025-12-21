import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Delete, CheckCircle } from 'lucide-react';

interface PinLockProps {
    onUnlock: () => void;
    isSetupMode?: boolean;
    onSetupComplete?: (pin: string) => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock, isSetupMode, onSetupComplete }) => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const PIN_LENGTH = 4;

    const handleNumberPress = (num: string) => {
        if (pin.length < PIN_LENGTH) {
            const newPin = pin + num;
            setPin(newPin);
            setError('');

            // Auto-submit when PIN is complete
            if (newPin.length === PIN_LENGTH) {
                setTimeout(() => {
                    if (isSetupMode) {
                        handleSetupPin(newPin);
                    } else {
                        handleVerifyPin(newPin);
                    }
                }, 200);
            }
        }
    };

    const handleSetupPin = (enteredPin: string) => {
        if (step === 'enter') {
            setConfirmPin(enteredPin);
            setPin('');
            setStep('confirm');
        } else {
            if (enteredPin === confirmPin) {
                localStorage.setItem('baraka_pin', enteredPin);
                localStorage.setItem('baraka_pin_enabled', 'true');
                onSetupComplete?.(enteredPin);
            } else {
                setError('الرمز غير متطابق');
                triggerShake();
                setPin('');
                setStep('enter');
                setConfirmPin('');
            }
        }
    };

    const handleVerifyPin = (enteredPin: string) => {
        const savedPin = localStorage.getItem('baraka_pin');
        if (enteredPin === savedPin) {
            onUnlock();
        } else {
            setError('رمز خاطئ');
            triggerShake();
            setPin('');
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-green-700 flex flex-col items-center justify-center z-[10000]">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">نظام بركة</h1>
                <p className="text-white/80">
                    {isSetupMode
                        ? (step === 'enter' ? 'أدخل رمز جديد' : 'أكد الرمز')
                        : 'أدخل رمز PIN'
                    }
                </p>
            </div>

            {/* PIN Dots */}
            <div className={`flex gap-4 mb-6 ${shake ? 'animate-pulse' : ''}`}>
                {[...Array(PIN_LENGTH)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length
                                ? 'bg-white scale-110'
                                : 'bg-white/30'
                            }`}
                    />
                ))}
            </div>

            {error && (
                <p className="text-red-300 text-sm mb-4">{error}</p>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-4 w-64">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => (
                    <Button
                        key={i}
                        variant="ghost"
                        className={`h-16 text-2xl font-bold rounded-full transition-all ${key === '' ? 'invisible' : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                        onClick={() => {
                            if (key === 'del') handleDelete();
                            else if (key) handleNumberPress(key);
                        }}
                        disabled={key === ''}
                    >
                        {key === 'del' ? <Delete className="w-6 h-6" /> : key}
                    </Button>
                ))}
            </div>
        </div>
    );
};

// Hook to manage PIN lock state
export const usePinLock = () => {
    const [isLocked, setIsLocked] = useState(true);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    useEffect(() => {
        const enabled = localStorage.getItem('baraka_pin_enabled') === 'true';
        const hasPin = !!localStorage.getItem('baraka_pin');
        setPinEnabled(enabled && hasPin);
        setIsLocked(enabled && hasPin);
    }, []);

    const unlock = () => setIsLocked(false);

    const enablePin = () => setShowSetup(true);

    const disablePin = () => {
        localStorage.removeItem('baraka_pin');
        localStorage.removeItem('baraka_pin_enabled');
        setPinEnabled(false);
        setIsLocked(false);
    };

    const onSetupComplete = () => {
        setPinEnabled(true);
        setShowSetup(false);
        setIsLocked(false);
    };

    return {
        isLocked,
        pinEnabled,
        showSetup,
        unlock,
        enablePin,
        disablePin,
        onSetupComplete,
        setShowSetup,
    };
};

export default PinLock;
