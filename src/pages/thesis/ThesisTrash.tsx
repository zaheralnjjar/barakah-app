import { useState, useEffect } from 'react';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisProject } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TrashedProject extends ThesisProject {
    days_in_trash: number;
}

export default function ThesisTrash() {
    const [projects, setProjects] = useState<TrashedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadTrash();
    }, []);

    const loadTrash = async () => {
        try {
            setLoading(true);
            const data = await ThesisService.getTrashedProjects();
            setProjects(data as TrashedProject[]);
        } catch (error) {
            console.error('Failed to load trash:', error);
            toast.error('فشل تحميل سلة المهملات');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string, name: string) => {
        if (!confirm(`هل تريد استعادة المشروع "${name}"؟`)) return;

        try {
            await ThesisService.restoreProject(id);
            toast.success('تمت الاستعادة بنجاح ✓');
            loadTrash();
        } catch (error) {
            console.error('Failed to restore:', error);
            toast.error('فشلت الاستعادة');
        }
    };

    const handlePermanentDelete = async (id: string, name: string) => {
        if (!confirm(`⚠️ تحذير: سيتم حذف المشروع "${name}" نهائياً!\n\nهذا الإجراء لا يمكن التراجع عنه.\n\nهل أنت متأكد؟`)) return;

        try {
            await ThesisService.permanentDeleteProject(id);
            toast.success('تم الحذف النهائي ✓');
            loadTrash();
        } catch (error) {
            console.error('Failed to permanently delete:', error);
            toast.error('فشل الحذف النهائي');
        }
    };

    const handleEmptyTrash = async () => {
        if (projects.length === 0) return;
        if (!confirm(`⚠️ تحذير: سيتم حذف جميع المشاريع (${projects.length}) نهائياً!\n\nهذا الإجراء لا يمكن التراجع عنه.\n\nهل أنت متأكد؟`)) return;

        try {
            for (const project of projects) {
                await ThesisService.permanentDeleteProject(project.id);
            }
            toast.success('تم إفراغ سلة المهملات ✓');
            loadTrash();
        } catch (error) {
            console.error('Failed to empty trash:', error);
            toast.error('فشل إفراغ سلة المهملات');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Trash2 className="w-8 h-8 text-destructive" />
                    <div>
                        <h1 className="text-3xl font-bold">سلة المهملات</h1>
                        <p className="text-muted-foreground">
                            {projects.length > 0
                                ? `${projects.length} مشروع محذوف`
                                : 'لا توجد مشاريع محذوفة'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/thesis')}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للمشاريع
                    </Button>
                    {projects.length > 0 && (
                        <Button variant="destructive" onClick={handleEmptyTrash}>
                            <Trash2 className="w-4 h-4 ml-2" />
                            إفراغ سلة المهملات
                        </Button>
                    )}
                </div>
            </div>

            {/* Warning */}
            {projects.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                            تنبيه: المشاريع المحذوفة ستُحذف نهائياً بعد 30 يوم
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            يمكنك استعادة المشاريع في أي وقت قبل انتهاء المهلة
                        </p>
                    </div>
                </div>
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Trash2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-xl font-medium text-muted-foreground">
                            سلة المهملات فارغة
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            لا توجد مشاريع محذوفة حالياً
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {projects.map(project => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {project.title || project.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {project.description || 'بدون وصف'}
                                        </CardDescription>
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                        محذوف منذ {project.days_in_trash} يوم
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        تاريخ الحذف: {new Date(project.deleted_at!).toLocaleDateString('ar-SA')}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRestore(project.id, project.title || project.name)}
                                        >
                                            <RotateCcw className="w-4 h-4 ml-2" />
                                            استعادة
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handlePermanentDelete(project.id, project.title || project.name)}
                                        >
                                            <Trash2 className="w-4 h-4 ml-2" />
                                            حذف نهائي
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
