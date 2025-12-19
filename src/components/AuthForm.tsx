import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AuthFormProps {
    onSignIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    onSignUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSignIn, onSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSignUp) {
            await onSignUp(email, password);
        } else {
            await onSignIn(email, password);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm arabic-body mb-2">البريد الإلكتروني</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg arabic-body"
                    required
                />
            </div>
            <div>
                <label className="block text-sm arabic-body mb-2">كلمة المرور</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border rounded-lg arabic-body"
                    required
                />
            </div>
            <Button type="submit" className="w-full btn-islamic arabic-body">
                {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full arabic-body"
            >
                {isSignUp ? 'لديك حساب؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
            </Button>
        </form>
    );
};

export default AuthForm;
