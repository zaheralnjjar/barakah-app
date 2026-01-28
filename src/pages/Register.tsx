import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Register = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">إنشاء حساب</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500">
                    صفحة إنشاء حساب (قيد التطوير)
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
