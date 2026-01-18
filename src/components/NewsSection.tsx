import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NewsSection = () => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">آخر الأخبار</CardTitle>
                <Badge variant="outline" className="text-xs">اليوم</Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">لا توجد أخبار جديدة حالياً.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default NewsSection;
