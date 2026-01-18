import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';

const FamilyManager = () => {
    return (
        <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">إدارة العائلة</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">متابعة المهام العائلية واحتياجات المنزل - قيد التطوير</p>
            </CardContent>
        </Card>
    );
};

export default FamilyManager;
