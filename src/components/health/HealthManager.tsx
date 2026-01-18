import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from 'lucide-react';

const HealthManager = () => {
    return (
        <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">الصحة واللياقة</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">متابعة النشاط والرياضة والتغذية - قيد التطوير</p>
            </CardContent>
        </Card>
    );
};

export default HealthManager;
