import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
    GraduationCap, BookOpen, Calendar, Clock, Plus, Edit, Trash2,
    CheckCircle, FileText, Target, BookMarked, Award, TrendingUp,
    PenTool, Timer, Star, ChevronDown, ChevronUp, GripVertical, X,
    LayoutList, LayoutDashboard, Download, StickyNote, Library,
    History, Users as UsersIcon, Link as LinkIcon, Settings, Sparkles,
    Printer, Bold, Italic, Underline, Palette, Type, AlignLeft, AlignCenter, AlignRight,
    Share2, Pencil, Trash, FileUp, Copy, Square, Circle, Minus, RectangleHorizontal
} from 'lucide-react';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---
interface SubTask {
    id: string;
    title: string;
    date?: string;
    time?: string;
    completed: boolean;
}

interface ResearchTask {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    subtasks: SubTask[];
}

interface ResearchChapter {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    status: 'pending' | 'in_progress' | 'completed';
    tasks: ResearchTask[];
}

interface ResearchPhase {
    id: string;
    title: string;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chapters: ResearchChapter[];
    tasks: ResearchTask[];
}

interface ResearchCircle {
    id: string;
    title: string;
    date: string;
    location?: string;
    notes?: string;
    completed: boolean;
}

interface ResearchMaterial {
    id: string;
    title: string;
    type: 'book' | 'paper' | 'link' | 'other';
    url?: string;
    status: 'to_read' | 'reading' | 'read';
}

interface ResearchProject {
    title: string;
    description: string;
    supervisor: string;
    institution: string;
    startDate: string;
    deadline: string;
    phases: ResearchPhase[];
    researchCircles: ResearchCircle[];
    materials: ResearchMaterial[];
}

const STORAGE_KEYS = {
    PROJECT: 'my_research_project_v2',
};

export default function AcademicManager() {
    const { toast } = useToast();

    // State
    const [project, setProject] = useState<ResearchProject | null>(null);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isPhaseOpen, setIsPhaseOpen] = useState(false);
    const [isSessionOpen, setIsSessionOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('drafts');

    // Drafting State
    const [editingNode, setEditingNode] = useState<{ phaseId: string, chapterId?: string, taskId?: string } | null>(null);
    const [draftContent, setDraftContent] = useState('');
    const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());

    // Phase/Chapter Add State
    const [newPhaseName, setNewPhaseName] = useState('');
    const [isAutoPlanOpen, setIsAutoPlanOpen] = useState(false);
    const [planText, setPlanText] = useState('');
    const [renamingNode, setRenamingNode] = useState<{ type: 'phase' | 'chapter', id: string, title: string, parentId?: string } | null>(null);
    const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');

    // Export / Internal Editor State
    const [isInternalExportOpen, setIsInternalExportOpen] = useState(false);
    const [exportContent, setExportContent] = useState('');

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECT);
        if (saved) {
            try {
                setProject(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse project", e);
            }
        } else {
            setIsSetupOpen(true);
        }
    }, []);

    // Save data
    useEffect(() => {
        if (project) {
            localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
        }
    }, [project]);

    // --- Handlers ---

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const newProject: ResearchProject = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            supervisor: formData.get('supervisor') as string,
            institution: formData.get('institution') as string,
            startDate: formData.get('startDate') as string,
            deadline: formData.get('deadline') as string,
            phases: [],
            researchCircles: [],
            materials: []
        };

        setProject(newProject);
        setIsSetupOpen(false);
        toast({ title: "✅ تم إنشاء خطة البحث", description: newProject.title });
    };

    const addPhase = () => {
        if (!project || !newPhaseName.trim()) return;
        const newPhase: ResearchPhase = {
            id: `phase-${Date.now()}`,
            title: newPhaseName,
            status: 'pending',
            chapters: [],
            tasks: []
        };
        setProject({ ...project, phases: [...(project.phases || []), newPhase] });
        setNewPhaseName('');
        setIsPhaseOpen(false);
        toast({ title: "✅ تمت إضافة المرحلة" });
    };

    const deletePhase = (phaseId: string) => {
        if (!project) return;
        setProject({ ...project, phases: project.phases.filter(p => p.id !== phaseId) });
    };

    const addChapter = (phaseId: string, title: string) => {
        if (!project || !title.trim()) return;
        const newChapter: ResearchChapter = {
            id: `chapter-${Date.now()}`,
            title,
            status: 'pending',
            tasks: []
        };
        setProject({
            ...project,
            phases: project.phases.map(p =>
                p.id === phaseId ? { ...p, chapters: [...(p.chapters || []), newChapter] } : p
            )
        });
    };

    const updateContent = (phaseId: string, chapterId?: string, taskId?: string, content?: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (p.id !== phaseId) return p;
                if (chapterId && !taskId) {
                    return {
                        ...p,
                        chapters: (p.chapters || []).map(c => c.id === chapterId ? { ...c, content } : c)
                    };
                }
                if (taskId) {
                    if (chapterId) {
                        return {
                            ...p,
                            chapters: (p.chapters || []).map(c => c.id === chapterId ? {
                                ...c,
                                tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, content } : t)
                            } : c)
                        };
                    }
                    return {
                        ...p,
                        tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, content } : t)
                    };
                }
                return p;
            })
        });
    };

    const handlePdfExport = async () => {
        const element = document.getElementById('export-content-area');
        if (!element) return;

        try {
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Research_Project_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast({ title: "✅ تم تحميل ملف PDF" });
        } catch (err) {
            console.error(err);
            toast({ title: "❌ فشل التصدير لـ PDF", variant: "destructive" });
        }
    };

    const handleRename = () => {
        if (!project || !renamingNode) return;
        const { type, id, title, parentId } = renamingNode;

        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (type === 'phase' && p.id === id) return { ...p, title };
                if (type === 'chapter' && parentId === p.id) {
                    return {
                        ...p,
                        chapters: p.chapters.map(c => c.id === id ? { ...c, title } : c)
                    };
                }
                return p;
            })
        });
        setRenamingNode(null);
        toast({ title: "✅ تم تحديث العنوان" });
    };

    const deleteChapter = (phaseId: string, chapterId: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p =>
                p.id === phaseId ? { ...p, chapters: p.chapters.filter(c => c.id !== chapterId) } : p
            )
        });
        toast({ title: "🗑️ تم حذف القسم" });
    };

    const handleShare = (title: string, content: string) => {
        const text = `${title}\n\n${content}`;
        navigator.clipboard.writeText(text);
        toast({ title: "📋 تم نسخ النص", description: "يمكنك لصقه في أي مكان للمشاركة" });
    };

    const handleAutoGeneratePlan = () => {
        if (!project || !planText.trim()) return;

        const lines = planText.split('\n').filter(l => l.trim());
        const newPhases: ResearchPhase[] = [];
        let currentPhase: ResearchPhase | null = null;

        lines.forEach(line => {
            const cleanLine = line.trim();
            const isSub = cleanLine.startsWith('-') || cleanLine.startsWith('•') || cleanLine.startsWith('*');
            const content = cleanLine.replace(/^[-•*]\s*/, '');

            if (isSub && currentPhase) {
                // Add as chapter
                const newChapter: ResearchChapter = {
                    id: `chapter-${Date.now()}-${Math.random()}`,
                    title: content,
                    status: 'pending',
                    tasks: []
                };
                currentPhase.chapters.push(newChapter);
            } else {
                // New Phase
                if (currentPhase) newPhases.push(currentPhase);
                currentPhase = {
                    id: `phase-${Date.now()}-${Math.random()}`,
                    title: content,
                    status: 'pending',
                    chapters: [],
                    tasks: []
                };
            }
        });
        if (currentPhase) newPhases.push(currentPhase);

        if (newPhases.length > 0) {
            setProject({ ...project, phases: [...(project.phases || []), ...newPhases] });
            setPlanText('');
            setIsAutoPlanOpen(false);
            toast({ title: `✅ تم توليد ${newPhases.length} مراحل` });
        }
    };

    const handleOpenExportEditor = () => {
        if (!project) return;

        // Generate Hierarchical HTML for the editor
        let html = `<div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; padding: 40px; color: #1f2937;">`;
        html += `<h1 style="text-align: center; color: #3730a3; margin-bottom: 20px; font-size: 28px; font-weight: 800;">${project.title}</h1>`;
        html += `<p style="text-align: center; color: #6b7280; margin-bottom: 40px; font-size: 14px;">${project.institution} | المشرف: ${project.supervisor}</p>`;
        html += `<hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 30px 0;" />`;

        project.phases.forEach((phase, index) => {
            const selectedChapters = (phase.chapters || []).filter(c => selectedForExport.has(c.id));

            if (selectedChapters.length > 0) {
                html += `<div style="margin-bottom: 40px;">`;
                html += `<h2 style="color: #4f46e5; font-size: 24px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px;">المرحلة ${index + 1}: ${phase.title}</h2>`;
                selectedChapters.forEach((chapter, cIndex) => {
                    html += `<div style="margin-bottom: 30px;">`;
                    html += `<h3 style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 15px;">${cIndex + 1}. ${chapter.title}</h3>`;
                    html += `<div style="font-size: 16px; line-height: 1.8; color: #374151;">${(chapter.content || '(لا يوجد محتوى)').replace(/\n/g, '<br/>')}</div>`;
                    html += `</div>`;
                });
                html += `</div>`;
            }
        });
        html += `</div>`;

        setExportContent(html);
        setIsInternalExportOpen(true);
    };

    const handleWordExport = async () => {
        if (!project) return;

        const children: Paragraph[] = [];

        // Title
        children.push(new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));

        // Metadata
        children.push(new Paragraph({
            children: [
                new TextRun({ text: `المشرف: ${project.supervisor} | المؤسسة: ${project.institution}`, size: 24, color: '666666' })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
        }));

        // Phases and Chapters
        project.phases.forEach((phase, pIndex) => {
            const selectedChapters = (phase.chapters || []).filter(c => selectedForExport.has(c.id));
            if (selectedChapters.length > 0) {
                children.push(new Paragraph({
                    text: `المرحلة ${pIndex + 1}: ${phase.title}`,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));

                selectedChapters.forEach((chapter, cIndex) => {
                    children.push(new Paragraph({
                        text: `${cIndex + 1}. ${chapter.title}`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    }));
                    children.push(new Paragraph({
                        children: [new TextRun({ text: chapter.content || '(لا يوجد محتوى)', size: 24 })],
                        spacing: { after: 300 }
                    }));
                });
            }
        });

        const doc = new Document({
            sections: [{ properties: {}, children }]
        });

        try {
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Research_${format(new Date(), 'yyyy-MM-dd')}.docx`);
            toast({ title: "✅ تم تحميل ملف Word" });
        } catch (err) {
            console.error(err);
            toast({ title: "❌ فشل التصدير", variant: "destructive" });
        }
    };

    const insertShape = (shape: 'square' | 'circle' | 'rect' | 'line') => {
        const shapeHtml: Record<string, string> = {
            square: '<div style="width:60px;height:60px;border:2px solid #4f46e5;display:inline-block;margin:8px;"></div>',
            circle: '<div style="width:60px;height:60px;border:2px solid #4f46e5;border-radius:50%;display:inline-block;margin:8px;"></div>',
            rect: '<div style="width:120px;height:60px;border:2px solid #4f46e5;display:inline-block;margin:8px;"></div>',
            line: '<hr style="border:0;border-top:2px solid #4f46e5;margin:16px 0;width:100%;" />'
        };
        document.execCommand('insertHTML', false, shapeHtml[shape]);
    };

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };


    const calculateProgress = () => {
        if (!project || (project.phases || []).length === 0) return 0;
        let totalItems = 0;
        let completedItems = 0;

        const countInTasks = (tasks: ResearchTask[]) => {
            (tasks || []).forEach(task => {
                if ((task.subtasks || []).length === 0) {
                    totalItems++;
                    if (task.status === 'completed') completedItems++;
                } else {
                    (task.subtasks || []).forEach(sub => {
                        totalItems++;
                        if (sub.completed) completedItems++;
                    });
                }
            });
        };

        (project.phases || []).forEach(phase => {
            countInTasks(phase.tasks);
            (phase.chapters || []).forEach(chapter => countInTasks(chapter.tasks));
        });

        return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    };

    const getChapterOrTaskById = (phaseId: string, chapterId?: string, taskId?: string) => {
        if (!project) return null;
        const phase = project.phases.find(p => p.id === phaseId);
        if (!phase) return null;
        if (chapterId && !taskId) return (phase.chapters || []).find(c => c.id === chapterId);
        if (taskId) {
            if (chapterId) {
                const chapter = (phase.chapters || []).find(c => c.id === chapterId);
                return (chapter?.tasks || []).find(t => t.id === taskId);
            }
            return (phase.tasks || []).find(t => t.id === taskId);
        }
        return null;
    };

    if (!project && !isSetupOpen) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]" dir="rtl">
                <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold mb-2">لا يوجد مشروع بحثي مسجل</h2>
                <p className="text-gray-500 mb-6">ابدأ رحلتك الأكاديمية بتسجيل خطة بحثك</p>
                <Button onClick={() => setIsSetupOpen(true)}>إنشاء خطة بحث جديدة</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-gray-50/30 p-4 sm:p-6" dir="rtl">
            {/* Header section ( restored v1/v2 style) */}
            {project && (
                <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-amber-500 hover:bg-amber-600 border-0">نظام البحث المتكامل</Badge>
                                {(project.phases || []).length > 0 && <Badge variant="outline" className="text-white border-white/20">{(project.phases || []).length} مراحل</Badge>}
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">{project.title}</h2>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-purple-100/70 text-sm">
                                <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {project.supervisor}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {project.institution}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
                            <div className="text-center min-w-[100px]">
                                <span className="text-4xl font-black text-amber-300">{calculateProgress()}%</span>
                                <Progress value={calculateProgress()} className="h-1.5 mt-2 bg-white/20" />
                                <p className="text-[10px] uppercase font-bold tracking-widest text-purple-200 mt-1">الإنجاز الكلي</p>
                            </div>
                            <div className="w-px h-12 bg-white/10 mx-2 hidden md:block"></div>
                            <div className="text-right hidden md:block">
                                <span className="text-sm font-bold block text-purple-100">{format(new Date(project.deadline), 'dd MMM yyyy', { locale: ar })}</span>
                                <span className="text-[10px] text-purple-300">الموعد النهائي</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <Tabs defaultValue="drafts" onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur border border-gray-100 p-2 rounded-2xl shadow-sm mb-6 sticky top-0 z-30">
                    <TabsList className="bg-gray-100/50 p-1 rounded-xl h-auto flex flex-wrap justify-start">
                        <TabsTrigger value="drafts" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <StickyNote className="w-4 h-4" /> معمل النصوص
                        </TabsTrigger>
                        <TabsTrigger value="plan" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <LayoutList className="w-4 h-4" /> هيكل البحث
                        </TabsTrigger>
                        <TabsTrigger value="circles" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <UsersIcon className="w-4 h-4" /> الحلقات الأكاديمية
                        </TabsTrigger>
                        <TabsTrigger value="materials" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <Library className="w-4 h-4" /> المكتبة والمراجع
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <History className="w-4 h-4" /> الجدول الزمني
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        {/* Edit Project Settings Button - Always visible */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsSetupOpen(true)}
                            className="h-10 px-3 rounded-xl gap-1.5"
                        >
                            <Settings className="w-4 h-4" /> تعديل البيانات
                        </Button>

                        {activeTab === 'drafts' && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (project && project.phases && project.phases.length > 0) {
                                            setNewChapterTitle('');
                                            setIsNewChapterOpen(true);
                                        } else {
                                            toast({ title: "⚠️ أضف مرحلة أولاً", description: "اذهب إلى هيكل البحث لإضافة مرحلة" });
                                        }
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 gap-2 h-10 px-4 rounded-xl shadow-lg shadow-purple-200/50"
                                >
                                    <Plus className="w-4 h-4" /> صندوق نص جديد
                                </Button>
                                <Button size="sm" onClick={handleOpenExportEditor} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-4 rounded-xl shadow-lg shadow-emerald-200/50" disabled={selectedForExport.size === 0}>
                                    <PenTool className="w-4 h-4" /> تجميع وتحرير ({selectedForExport.size})
                                </Button>
                            </>
                        )}
                        {activeTab === 'plan' && (
                            <>
                                <Button size="sm" onClick={() => setIsAutoPlanOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-4 rounded-xl shadow-lg shadow-indigo-200/50 mr-2">
                                    <Sparkles className="w-4 h-4 ml-1" /> توليد تلقائي
                                </Button>
                                <Button size="sm" onClick={() => setIsPhaseOpen(true)} className="bg-purple-600 hover:bg-purple-700 h-10 px-4 rounded-xl shadow-lg shadow-purple-200/50">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة مرحلة
                                </Button>
                            </>
                        )}
                        {activeTab === 'circles' && (
                            <Button size="sm" onClick={() => setIsSessionOpen(true)} className="bg-blue-600 h-10 px-4 rounded-xl">
                                <Plus className="w-4 h-4 ml-1" /> تسجيل حلقة
                            </Button>
                        )}
                    </div>
                </div>

                {/* --- Drafts Tab --- */}
                <TabsContent value="drafts" className="mt-0 focus-visible:outline-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(project?.phases || []).map(phase => (
                            <React.Fragment key={phase.id}>
                                {(phase.chapters || []).map(chapter => (
                                    <Card
                                        key={chapter.id}
                                        className={`group relative transition-all hover:scale-[1.02] cursor-pointer border-2 overflow-hidden ${selectedForExport.has(chapter.id) ? 'border-purple-500 bg-purple-50/30' : 'border-transparent bg-white shadow-sm hover:shadow-md'}`}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.export-toggle')) return;
                                            setEditingNode({ phaseId: phase.id, chapterId: chapter.id });
                                            setDraftContent(chapter.content || '');
                                        }}
                                    >
                                        <div className="absolute top-2 left-2 z-20">
                                            <Checkbox
                                                className="export-toggle w-5 h-5 rounded-md"
                                                checked={selectedForExport.has(chapter.id)}
                                                onCheckedChange={(checked) => {
                                                    const newSet = new Set(selectedForExport);
                                                    if (checked) newSet.add(chapter.id);
                                                    else newSet.delete(chapter.id);
                                                    setSelectedForExport(newSet);
                                                }}
                                            />
                                        </div>
                                        <CardHeader className="pb-2 pt-8">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                {chapter.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setRenamingNode({ type: 'chapter', id: chapter.id, title: chapter.title, parentId: phase.id }); }}>
                                                    <Pencil className="w-3 h-3 text-gray-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleShare(chapter.title, chapter.content || ''); }}>
                                                    <Share2 className="w-3 h-3 text-gray-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); deleteChapter(phase.id, chapter.id); }}>
                                                    <Trash className="w-3 h-3 text-rose-500" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{phase.title}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <p className={`text-xs leading-relaxed text-gray-600 line-clamp-5 min-h-[6rem] whitespace-pre-wrap ${!chapter.content ? 'text-gray-300 italic flex items-center justify-center border-dashed border-2 border-gray-100 rounded-lg' : ''}`}>
                                                {chapter.content || 'انقر للكتابة...'}
                                            </p>
                                        </CardContent>
                                        <div className="px-4 py-2 bg-gray-50/50 flex justify-between items-center text-[10px] text-gray-400">
                                            <span>{chapter.content?.length || 0} حرف</span>
                                            <PenTool className="w-3 h-3 group-hover:text-purple-500 transition-colors" />
                                        </div>
                                    </Card>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </TabsContent>

                {/* --- Structure/Plan Tab --- */}
                <TabsContent value="plan" className="space-y-6 focus-visible:outline-none">
                    {(project?.phases || []).length === 0 ? (
                        <div className="text-center py-20 bg-white/50 border-2 border-dashed rounded-3xl">
                            <LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">لم يتم تقسيم البحث إلى مراحل بعد</p>
                            <Button variant="link" onClick={() => setIsPhaseOpen(true)} className="text-purple-600 font-black mt-2 underline">أضف أول مرحلة بحثية الآن</Button>
                        </div>
                    ) : (
                        (project.phases || []).map((phase, pIdx) => (
                            <Card key={phase.id} className="border-0 shadow-sm ring-1 ring-black/[0.05] rounded-2xl overflow-hidden">
                                <div className="bg-gray-50/80 px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                            {pIdx + 1}
                                        </div>
                                        <h3 className="font-black text-gray-800 text-lg">{phase.title}</h3>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => deletePhase(phase.id)} className="text-gray-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                                <div className="bg-gray-50/50 px-4 py-2 flex justify-end gap-2 border-b border-gray-100">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setRenamingNode({ type: 'phase', id: phase.id, title: phase.title })}>
                                        <Pencil className="w-3 h-3" /> تعديل العنوان
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleShare(phase.title, `المرحلة: ${phase.title}\nعدد الأقسام: ${phase.chapters.length}`)}>
                                        <Share2 className="w-3 h-3" /> مشاركة
                                    </Button>
                                </div>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <LayoutDashboard className="w-4 h-4" /> الأجزاء التفصيلية
                                            </h4>
                                            <Button variant="outline" size="sm" onClick={() => addChapter(phase.id, 'قسم جديد')} className="h-7 text-[10px] font-bold">+ إضافة قسم</Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(phase.chapters || []).map(chapter => (
                                                <div key={chapter.id} className="p-4 border rounded-xl hover:border-purple-200 transition-all bg-white group">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><BookMarked className="w-4 h-4 text-purple-600" /></div>
                                                            <div>
                                                                <h5 className="font-bold text-sm text-gray-800">{chapter.title}</h5>
                                                                <p className="text-[10px] text-gray-400">{chapter.status === 'completed' ? '✅ مكتمل' : '⏳ قيد العمل'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                setRenamingNode({ type: 'chapter', id: chapter.id, title: chapter.title, parentId: phase.id });
                                                            }}><Pencil className="w-3.5 h-3.5 text-gray-500" /></Button>

                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                handleShare(chapter.title, chapter.content || '');
                                                            }}><Share2 className="w-3.5 h-3.5 text-gray-500" /></Button>

                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                setEditingNode({ phaseId: phase.id, chapterId: chapter.id });
                                                                setDraftContent(chapter.content || '');
                                                            }}><FileText className="w-3.5 h-3.5 text-indigo-500" /></Button>

                                                            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-rose-50" onClick={() => {
                                                                deleteChapter(phase.id, chapter.id);
                                                            }}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* --- Research Circles Tab --- */}
                <TabsContent value="circles" className="focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(project?.researchCircles || []).length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white border rounded-2xl">
                                <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400">لا يوجد سجل للحلقات الأكاديمية بعد</p>
                            </div>
                        ) : (
                            (project.researchCircles || []).map(circle => (
                                <Card key={circle.id} className="border-0 shadow-sm ring-1 ring-black/5">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">{circle.date}</Badge>
                                            <Checkbox checked={circle.completed} onCheckedChange={(val) => {
                                                setProject({
                                                    ...project,
                                                    researchCircles: project.researchCircles.map(c => c.id === circle.id ? { ...c, completed: !!val } : c)
                                                });
                                            }} />
                                        </div>
                                        <CardTitle className="text-md font-bold mt-2">{circle.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-gray-500 mb-2 font-medium">{circle.location || 'بحث داخلي'}</p>
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-3">{circle.notes}</p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* --- Materials Tab --- */}
                <TabsContent value="materials" className="focus-visible:outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">مكتبة المصادر والمراجع</CardTitle>
                            <CardDescription>نظم الكتب والأبحاث التي تعتمد عليها في دراستك</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="عنوان المرجع أو الكتاب..." id="mat-title" className="h-10 text-sm" />
                                <Select defaultValue="book">
                                    <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="book">كتاب</SelectItem>
                                        <SelectItem value="paper">بحث/ورقة</SelectItem>
                                        <SelectItem value="link">رابط</SelectItem>
                                        <SelectItem value="other">أخرى</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => {
                                    const titleEl = document.getElementById('mat-title') as HTMLInputElement;
                                    const typeEl = document.querySelector('[data-radix-collection-item]') as HTMLElement; // Simplified
                                    if (titleEl.value && project) {
                                        const newMat: ResearchMaterial = {
                                            id: `mat-${Date.now()}`,
                                            title: titleEl.value,
                                            type: 'book', // Simplification for logic
                                            status: 'to_read'
                                        };
                                        setProject({ ...project, materials: [...(project.materials || []), newMat] });
                                        titleEl.value = '';
                                        toast({ title: "✅ تمت الإضافة" });
                                    }
                                }} className="bg-purple-600 h-10"><Plus className="w-4 h-4 ml-1" /> إضافة</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {(project?.materials || []).map(mat => (
                                    <div key={mat.id} className="p-3 border rounded-xl flex items-center justify-between bg-white hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                {mat.type === 'book' ? '📕' : mat.type === 'paper' ? '📄' : '🔗'}
                                            </div>
                                            <span className="font-bold text-sm">{mat.title}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{mat.status === 'read' ? 'قرأت' : 'قيد الانتظار'}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Timeline Tab --- */}
                <TabsContent value="timeline" className="focus-visible:outline-none">
                    <Card className="border-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-lg">الخريطة الزمنية للإنجاز</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-8 relative before:absolute before:right-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                                {(project?.phases || []).map((phase, idx) => (
                                    <div key={phase.id} className="relative pr-16">
                                        <div className="absolute right-5 top-1 w-5 h-5 rounded-full bg-purple-600 border-4 border-white shadow-sm z-10"></div>
                                        <div className="flex flex-col gap-1">
                                            <h4 className="font-black text-slate-800">{phase.title}</h4>
                                            <p className="text-xs text-gray-400 font-medium">المرحلة رقم {idx + 1}</p>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {(phase.chapters || []).map(ch => (
                                                <div key={ch.id} className="text-[11px] p-2 bg-gray-50 rounded-lg flex items-center gap-2 border border-transparent hover:border-purple-100 transition-all">
                                                    <div className={`w-2 h-2 rounded-full ${ch.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                                    <span className="font-bold truncate">{ch.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- Dialogs --- */}

            {/* Editor Dialog */}
            <Dialog open={!!editingNode} onOpenChange={(open) => !open && setEditingNode(null)}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <PenTool className="w-5 h-5 text-amber-500" />
                            <div>
                                <h2 className="text-lg font-black leading-none">محرر البحث الذكي</h2>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-none">
                                    {getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title || 'جاري التحميل...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="block text-[10px] text-slate-500 font-bold uppercase">عدد الكلمات</span>
                                <span className="font-black text-amber-400">{draftContent.split(/\s+/).filter(Boolean).length}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setEditingNode(null)} className="hover:bg-white/10 rounded-full text-white"><X className="w-6 h-6" /></Button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-6 md:p-12">
                        <Textarea
                            className="w-full h-full text-xl leading-[1.8] border-0 focus:ring-0 p-0 resize-none arabic-body placeholder:text-gray-200"
                            placeholder="ابدأ بكتابة مسودة بحثك هنا..."
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setEditingNode(null)} className="h-12 px-6 rounded-2xl font-bold border-gray-200">إلغاء</Button>
                        <Button className="h-12 px-8 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100" onClick={() => {
                            if (editingNode) {
                                updateContent(editingNode.phaseId, editingNode.chapterId, editingNode.taskId, draftContent);
                                setEditingNode(null);
                                toast({ title: "✅ تم الحفظ بنجاح" });
                            }
                        }}>حفظ التغييرات</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Setup Project Dialog */}
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-white text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <GraduationCap className="w-8 h-8 text-amber-300" />
                        </div>
                        <DialogTitle className="text-2xl font-black">إعداد الخطة البحثية 🎓</DialogTitle>
                        <p className="text-indigo-200 text-sm mt-2">سوف نساعدك في تنظيم وإدارة رسالتك العلمية بكفاءة عالية</p>
                    </div>
                    <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-gray-700 text-xs">عنوان الرسالة / البحث</Label>
                            <Input name="title" required placeholder="مثال: تحليل البيانات الضخمة في قطاع..." className="h-12 bg-gray-50 border-0 text-right font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700 text-xs">المشرف الأكاديمي</Label>
                                <Input name="supervisor" placeholder="أ.د. محمد ..." className="h-12 bg-gray-50 border-0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700 text-xs">المؤسسة / الجامعة</Label>
                                <Input name="institution" placeholder="جامعة ..." className="h-12 bg-gray-50 border-0" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700 text-xs">تاريخ البدء</Label>
                                <Input name="startDate" type="date" required className="h-12 bg-gray-50 border-0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700 text-xs">الموعد النهائي</Label>
                                <Input name="deadline" type="date" required className="h-12 bg-gray-50 border-0" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95">بدء البرنامج البحثي 🚀</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Phase Dialog */}
            <Dialog open={isPhaseOpen} onOpenChange={setIsPhaseOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-right">إضافة مرحلة بحثية جديدة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-right block">اسم المرحلة</Label>
                            <Input value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="مثلاً: صياغة الإطار النظري" className="text-right" />
                        </div>
                        <Button onClick={addPhase} className="w-full bg-purple-600">إضافة المرحلة</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Session/Circle Dialog */}
            <Dialog open={isSessionOpen} onOpenChange={setIsSessionOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-right">تسجيل حلقة أكاديمية</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.target as HTMLFormElement);
                        if (!project) return;
                        const newCircle: ResearchCircle = {
                            id: `circle-${Date.now()}`,
                            title: fd.get('title') as string,
                            date: fd.get('date') as string,
                            notes: fd.get('notes') as string,
                            completed: false
                        };
                        setProject({ ...project, researchCircles: [...(project.researchCircles || []), newCircle] });
                        setIsSessionOpen(false);
                        toast({ title: "✅ تم تسجيل الحلقة" });
                    }} className="space-y-4 py-4">
                        <div className="space-y-2"><Label className="text-right block">العنوان</Label><Input name="title" required placeholder="مناقشة الفصل الأول..." className="text-right" /></div>
                        <div className="space-y-2"><Label className="text-right block">التاريخ</Label><Input name="date" type="date" required className="text-right" /></div>
                        <div className="space-y-2"><Label className="text-right block">ملاحظات والتوصيات</Label><Textarea name="notes" placeholder="سجل أهم الملاحظات هنا..." className="text-right min-h-[100px]" /></div>
                        <Button type="submit" className="w-full bg-blue-600">حفظ الحلقة</Button>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Auto Plan Dialog */}
            <Dialog open={isAutoPlanOpen} onOpenChange={setIsAutoPlanOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            توليد الخطة تلقائياً
                        </DialogTitle>
                        <DialogDescription className="text-right">
                            أدخل خطة بحثك هنا (كل سطر جديد سيعتبر مرحلة، والأسطر التي تبدأ بـ - أو • ستعتبر أقساماً تابعة للمرحلة السابقة)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            value={planText}
                            onChange={(e) => setPlanText(e.target.value)}
                            placeholder={`المرحلة الأولى: الأدبيات السابقة\n- جمع المصادر\n- القراءة التحليلية\nالمرحلة الثانية: المنهجية\n- تصميم الاستبيان`}
                            className="text-right min-h-[200px] leading-relaxed font-mono text-sm"
                        />
                        <Button onClick={handleAutoGeneratePlan} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg rounded-xl">
                            <Sparkles className="w-4 h-4 ml-2" />
                            تحليل وتوليد الخطة
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Rename Dialog */}
            <Dialog open={!!renamingNode} onOpenChange={(open) => !open && setRenamingNode(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-right">تعديل العنوان</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            value={renamingNode?.title || ''}
                            onChange={(e) => setRenamingNode(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="text-right"
                        />
                        <Button onClick={handleRename} className="w-full bg-indigo-600">حفظ التغييرات</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Compiled Export Editor Dialog */}
            <Dialog open={isInternalExportOpen} onOpenChange={setIsInternalExportOpen}>
                <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <FileUp className="w-5 h-5 text-emerald-400" />
                            <div>
                                <h2 className="text-lg font-black leading-none">محرر التجميع والمسودة النهائية</h2>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-none">تجميع {selectedForExport.size} عناصر</p>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex bg-white/10 rounded-lg p-1 gap-1">
                            <Button size="sm" variant="ghost" onClick={() => execCmd('bold')} className="hover:bg-white/20 text-white h-8 w-8 p-0"><Bold className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => execCmd('italic')} className="hover:bg-white/20 text-white h-8 w-8 p-0"><Italic className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => execCmd('underline')} className="hover:bg-white/20 text-white h-8 w-8 p-0"><Underline className="w-4 h-4" /></Button>
                            <div className="w-px bg-white/20 mx-1"></div>

                            <Select onValueChange={(val) => execCmd('foreColor', val)}>
                                <SelectTrigger className="h-8 w-24 bg-transparent border-0 text-white hover:bg-white/20 focus:ring-0">
                                    <div className="flex items-center gap-2"><Palette className="w-3 h-3" /> <span className="text-xs">لون</span></div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="#000000">أسود ⚫</SelectItem>
                                    <SelectItem value="#dc2626">أحمر 🔴</SelectItem>
                                    <SelectItem value="#16a34a">أخضر 🟢</SelectItem>
                                    <SelectItem value="#2563eb">أزرق 🔵</SelectItem>
                                    <SelectItem value="#d97706">برتقالي 🟠</SelectItem>
                                    <SelectItem value="#7c3aed">بنفسجي 🟣</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select onValueChange={(val) => execCmd('fontSize', val)}>
                                <SelectTrigger className="h-8 w-24 bg-transparent border-0 text-white hover:bg-white/20 focus:ring-0">
                                    <div className="flex items-center gap-2"><Type className="w-3 h-3" /> <span className="text-xs">حجم</span></div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">صغير</SelectItem>
                                    <SelectItem value="3">عادي</SelectItem>
                                    <SelectItem value="5">كبير</SelectItem>
                                    <SelectItem value="7">ضخم</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="w-px bg-white/20 mx-1"></div>
                            <Button size="sm" variant="ghost" onClick={() => insertShape('square')} className="hover:bg-white/20 text-white h-8 w-8 p-0" title="مربع"><Square className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => insertShape('circle')} className="hover:bg-white/20 text-white h-8 w-8 p-0" title="دائرة"><Circle className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => insertShape('rect')} className="hover:bg-white/20 text-white h-8 w-8 p-0" title="مستطيل"><RectangleHorizontal className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => insertShape('line')} className="hover:bg-white/20 text-white h-8 w-8 p-0" title="خط"><Minus className="w-4 h-4" /></Button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => setIsInternalExportOpen(false)} className="hover:bg-white/10 rounded-full text-white"><X className="w-6 h-6" /></Button>
                    </div>

                    <div className="flex-1 bg-gray-50 overflow-auto p-8 flex justify-center">
                        <div
                            id="export-content-area"
                            contentEditable
                            suppressContentEditableWarning={true}
                            className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg p-[20mm] focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            style={{ direction: 'rtl' }}
                            dangerouslySetInnerHTML={{ __html: exportContent }}
                        />
                    </div>

                    <div className="p-4 bg-white border-t flex justify-between items-center gap-3">
                        <div className="text-xs text-gray-400 font-bold px-4">
                            * التعديلات هنا لا تؤثر على النصوص الأصلية
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                navigator.clipboard.writeText(document.getElementById('export-content-area')?.innerText || '');
                                toast({ title: "✅ تم النسخ" });
                            }} className="h-10 px-4 rounded-xl font-bold border-gray-200">
                                <Copy className="w-4 h-4 ml-2" /> نسخ نص
                            </Button>
                            <Button variant="outline" onClick={handleWordExport} className="h-10 px-4 rounded-xl font-bold border-indigo-100 text-indigo-700 hover:bg-indigo-50">
                                <Download className="w-4 h-4 ml-2" /> Word
                            </Button>
                            <Button onClick={handlePdfExport} className="h-10 px-6 rounded-xl font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100/50">
                                <Printer className="w-4 h-4 ml-2" /> تصدير PDF
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Chapter Title Dialog */}
            <Dialog open={isNewChapterOpen} onOpenChange={setIsNewChapterOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-right">عنوان صندوق النص الجديد</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            placeholder="أدخل العنوان هنا..."
                            className="text-right"
                            autoFocus
                        />
                        <Button
                            onClick={() => {
                                if (newChapterTitle.trim() && project && project.phases.length > 0) {
                                    addChapter(project.phases[0].id, newChapterTitle.trim());
                                    setIsNewChapterOpen(false);
                                    setNewChapterTitle('');
                                }
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={!newChapterTitle.trim()}
                        >
                            إنشاء صندوق النص
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

