import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IslamicContent = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">المحتوى الإسلامي</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">محتوى إسلامي يومي (أذكار، قرآن، حديث) - قريباً</p>
            </CardContent>
        </Card>
    );
};

export default IslamicContent;
