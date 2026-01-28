import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">تسجيل الدخول</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500">
                    صفحة تسجيل الدخول (قيد التطوير)
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
