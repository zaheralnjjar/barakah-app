import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    GraduationCap, BookOpen, Calendar, Clock, ChevronDown, ChevronUp,
    FileText, Target, TrendingUp, Eye, Library, Users as UsersIcon,
    RefreshCw, X, CheckCircle, Circle, Loader2
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { AcademicService } from '@/services/AcademicService';
import { useToast } from '@/hooks/use-toast';
import type {
    ResearchProject,
    ResearchPhase,
    ResearchChapter,
    ResearchCircle,
    ResearchMaterial
} from '@/types/academic';

interface AcademicLiteViewProps {
    onClose?: () => void;
    onOpenFullEditor?: () => void;
}

/**
 * نسخة خفيفة من المدير الأكاديمي للموبايل
 * للعرض فقط - بدون تحرير أو ميزات ثقيلة
 */
export default function AcademicLiteView({ onClose, onOpenFullEditor }: AcademicLiteViewProps) {
    const { toast } = useToast();
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
    const [selectedChapter, setSelectedChapter] = useState<ResearchChapter | null>(null);

    // جلب المشاريع
    const { data: projects, isLoading, refetch } = useQuery({
        queryKey: ['academic-projects'],
        queryFn: () => AcademicService.getProjects()
    });

    const project = projects && projects.length > 0 ? projects[0] : null;

    // حساب التقدم الإجمالي
    const calculateProgress = () => {
        if (!project?.phases?.length) return 0;
        let completed = 0;
        let total = 0;
        project.phases.forEach(phase => {
            phase.chapters?.forEach(chapter => {
                total++;
                if (chapter.status === 'completed') completed++;
            });
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    // حساب الأيام المتبقية
    const getDaysRemaining = () => {
        if (!project?.deadline) return null;
        return differenceInDays(parseISO(project.deadline), new Date());
    };

    // تبديل توسيع المرحلة
    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phaseId)) newSet.delete(phaseId);
            else newSet.add(phaseId);
            return newSet;
        });
    };

    // عدد الكلمات
    const countWords = (html: string) => {
        const text = html?.replace(/<[^>]*>/g, ' ').trim() || '';
        return text.split(/\s+/).filter(w => w.length > 0).length;
    };

    // إحصائيات سريعة
    const stats = {
        phases: project?.phases?.length || 0,
        chapters: project?.phases?.reduce((sum, p) => sum + (p.chapters?.length || 0), 0) || 0,
        materials: project?.materials?.length || 0,
        circles: project?.researchCircles?.length || 0,
        progress: calculateProgress(),
        daysRemaining: getDaysRemaining(),
        totalWords: project?.phases?.reduce((sum, p) =>
            sum + (p.chapters?.reduce((cs, c) => cs + countWords(c.content || ''), 0) || 0), 0) || 0
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4">
                <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
                <GraduationCap className="w-16 h-16 mb-4 opacity-50" />
                <h2 className="text-xl font-bold mb-2">لا يوجد مشروع بحثي</h2>
                <p className="text-white/60 text-center mb-4">
                    استخدم تطبيق الويب أو سطح المكتب لإنشاء مشروع جديد
                </p>
                <Button variant="outline" onClick={onClose}>
                    إغلاق
                </Button>
            </div>
        );
    }

    // عرض محتوى الفصل
    if (selectedChapter) {
        return (
            <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 p-3 flex items-center gap-2 z-10">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedChapter(null)} className="text-white">
                        <ChevronDown className="w-4 h-4 rotate-90" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{selectedChapter.title}</h3>
                        <p className="text-xs text-white/50">{countWords(selectedChapter.content || '')} كلمة</p>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-4">
                    <div
                        className="prose prose-invert prose-sm max-w-none"
                        style={{ direction: 'rtl', textAlign: 'right' }}
                        dangerouslySetInnerHTML={{ __html: selectedChapter.content || '<p class="text-white/50">لا يوجد محتوى</p>' }}
                    />
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 p-3 z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-amber-400" />
                        <h2 className="font-bold text-white">المدير الأكاديمي</h2>
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                            للعرض فقط
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-white/70 h-8 w-8">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Project Info */}
                <h3 className="text-lg font-bold text-white mb-1">{project.title}</h3>
                {project.institution && (
                    <p className="text-xs text-white/50">{project.institution}</p>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2">
                        <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-3 text-center">
                                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
                                <p className="text-lg font-bold text-white">{stats.progress}%</p>
                                <p className="text-[10px] text-white/50">التقدم</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-3 text-center">
                                <FileText className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                                <p className="text-lg font-bold text-white">{stats.totalWords.toLocaleString()}</p>
                                <p className="text-[10px] text-white/50">كلمة</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-3 text-center">
                                <Calendar className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                                <p className="text-lg font-bold text-white">
                                    {stats.daysRemaining !== null ? stats.daysRemaining : '-'}
                                </p>
                                <p className="text-[10px] text-white/50">يوم متبقي</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/70">التقدم الإجمالي</span>
                            <span className="text-xs font-bold text-white">{stats.progress}%</span>
                        </div>
                        <Progress value={stats.progress} className="h-2" />
                    </div>

                    {/* Phases */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            المراحل ({stats.phases})
                        </h4>

                        {project.phases?.map((phase, index) => (
                            <Collapsible
                                key={phase.id}
                                open={expandedPhases.has(phase.id)}
                                onOpenChange={() => togglePhase(phase.id)}
                            >
                                <Card className="bg-white/5 border-white/10 overflow-hidden">
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="p-3 cursor-pointer hover:bg-white/5 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                                                        {index + 1}
                                                    </span>
                                                    <CardTitle className="text-sm text-white">{phase.title}</CardTitle>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                                                        {phase.chapters?.length || 0} فصل
                                                    </Badge>
                                                    {expandedPhases.has(phase.id) ? (
                                                        <ChevronUp className="w-4 h-4 text-white/50" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-white/50" />
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="p-3 pt-0 space-y-2">
                                            {phase.chapters?.map(chapter => (
                                                <div
                                                    key={chapter.id}
                                                    onClick={() => setSelectedChapter(chapter)}
                                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                                >
                                                    {chapter.status === 'completed' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                                    ) : chapter.status === 'in_progress' ? (
                                                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-white/30 shrink-0" />
                                                    )}
                                                    <span className="text-sm text-white/80 flex-1 truncate">{chapter.title}</span>
                                                    <Eye className="w-4 h-4 text-white/30" />
                                                </div>
                                            ))}
                                            {(!phase.chapters || phase.chapters.length === 0) && (
                                                <p className="text-xs text-white/40 text-center py-2">لا توجد فصول</p>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        ))}
                    </div>

                    {/* Research Circles */}
                    {project.researchCircles && project.researchCircles.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                حلقات البحث ({stats.circles})
                            </h4>
                            <div className="space-y-2">
                                {project.researchCircles.slice(0, 3).map(circle => (
                                    <Card key={circle.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${circle.completed ? 'bg-green-400' : 'bg-amber-400'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{circle.title}</p>
                                                <p className="text-xs text-white/50">{circle.date}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Materials */}
                    {project.materials && project.materials.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                <Library className="w-4 h-4" />
                                المراجع ({stats.materials})
                            </h4>
                            <div className="space-y-2">
                                {project.materials.slice(0, 5).map(material => (
                                    <Card key={material.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                                                <p className="text-sm text-white/80 truncate">{material.title}</p>
                                            </div>
                                            {material.author && (
                                                <p className="text-xs text-white/40 mr-6">{material.author}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Note */}
                    <div className="text-center py-4">
                        <p className="text-xs text-white/40">
                            💡 للتحرير والميزات الكاملة، استخدم تطبيق الويب أو سطح المكتب
                        </p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
