import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryManager from './CategoryManager';
import { NoteSidebar } from './notes/NoteSidebar';
import { useBuckets } from '@/hooks/useBuckets';

export const UnifiedCategoryManager: React.FC = () => {
    const { buckets, addBucket, deleteBucket, iconMap } = useBuckets();

    return (
        <div className="w-full" dir="rtl">
            <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="notes">تصنيفات الملاحظات</TabsTrigger>
                    <TabsTrigger value="finance">فئات المالية</TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-0">
                    <div className="bg-white rounded-xl border p-4">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>🗂️</span> إدارة تصنيفات الملاحظات
                        </h3>
                        {/* We reuse the internal logic of NoteSidebar's management but as a standalone view */}
                        <NoteSidebar
                            activeBucket=""
                            onSelectBucket={() => { }}
                            buckets={buckets}
                            addBucket={addBucket}
                            deleteBucket={deleteBucket}
                            iconMap={iconMap}
                            onSelectTag={() => { }}
                            selectedTag={null}
                            isStandaloneManager={true}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="finance" className="mt-0">
                    <CategoryManager />
                </TabsContent>
            </Tabs>
        </div>
    );
};
