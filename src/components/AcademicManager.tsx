import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    PenTool, Timer, Star, ChevronDown, ChevronUp, ChevronRight, GripVertical, X,
    LayoutList, LayoutDashboard, Download, StickyNote, Library,
    History, Users as UsersIcon, Link as LinkIcon, Settings, Sparkles,
    Printer, Bold, Italic, Underline, Strikethrough, Palette, Type, AlignLeft, AlignCenter, AlignRight,
    Share2, Pencil, Trash, FileUp, Copy, Square, Circle, Minus, RectangleHorizontal,
    Folder, FolderOpen, CheckSquare, Undo, Redo, AlignJustify, LayoutGrid, MessageSquare, Footprints
} from 'lucide-react';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { AcademicService } from '@/services/AcademicService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, BarChart2 } from 'lucide-react';
import { GlobalSearch } from './academic/GlobalSearch';
import { StatsDashboard } from './academic/StatsDashboard';

// --- Types ---
export interface SubTask {
    id: string;
    title: string;
    date?: string;
    time?: string;
    completed: boolean;
}

export interface ResearchTask {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    subtasks: SubTask[];
}

export interface ResearchChapter {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    status: 'pending' | 'in_progress' | 'completed';
    tasks: ResearchTask[];
    tags?: string[];
}

export interface ResearchPhase {
    id: string;
    title: string;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chapters: ResearchChapter[];
    tasks: ResearchTask[];
    tags?: string[];
}

export interface ResearchCircle {
    id: string;
    title: string;
    date: string;
    location?: string;
    notes?: string;
    completed: boolean;
}

export interface ResearchMaterial {
    id: string;
    title: string;
    type: 'book' | 'paper' | 'link' | 'other';
    url?: string;
    status: 'to_read' | 'reading' | 'read';
    author?: string;
    publisher?: string;
    year?: string;
    deathDate?: string;
    tags?: string[];
}

export interface ResearchProject {
    id?: string; // Optional for new creation
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
    const queryClient = useQueryClient();

    // -- Queries --
    const { data: projects, isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery({
        queryKey: ['academic-projects'],
        queryFn: () => AcademicService.getProjects()
    });

    // Debugging logs
    useEffect(() => {
        console.log("AcademicManager - projects list updated:", projects);
        if (projects) {
            console.log(`AcademicManager - total projects found: ${projects.length}`);
            if (projects.length > 0) {
                console.log("AcademicManager - active project selected:", projects[0]);
            }
        }
    }, [projects]);

    // Determine active project (default to first one for now)
    const project = projects && projects.length > 0 ? projects[0] : null;

    const handleRefresh = async () => {
        toast({ title: "جاري التحديث..." });
        await refetchProjects();
        toast({ title: "تم تحديث البيانات" });
    };

    // State
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isPhaseOpen, setIsPhaseOpen] = useState(false);
    const [isSessionOpen, setIsSessionOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('drafts');

    // Drafting State
    const [editingNode, setEditingNode] = useState<{ phaseId: string, chapterId?: string, taskId?: string } | null>(null);
    const [draftContent, setDraftContent] = useState('');
    const [draftTags, setDraftTags] = useState<string[]>([]);
    const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());

    // Phase/Chapter Add State
    const [newPhaseName, setNewPhaseName] = useState('');
    const [isAutoPlanOpen, setIsAutoPlanOpen] = useState(false);
    const [planText, setPlanText] = useState('');
    const [renamingNode, setRenamingNode] = useState<{ type: 'phase' | 'chapter', id: string, title: string, parentId?: string } | null>(null);
    const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

    // Editor state
    const [editorZoom, setEditorZoom] = useState(100);
    const [lineSpacing, setLineSpacing] = useState(1.8);
    const [showComments, setShowComments] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [formatPainterActive, setFormatPainterActive] = useState(false);
    const [painterStyles, setPainterStyles] = useState<any>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
    const [currentPage, setCurrentPage] = useState(1);

    // Page dimensions in mm (converted to pixels at 96 DPI)
    const pageSizes = {
        A4: { width: 210, height: 297, pxHeight: 1123 }, // 297mm * 3.78
        A5: { width: 148, height: 210, pxHeight: 794 },
        Letter: { width: 216, height: 279, pxHeight: 1056 }
    };

    // Editor refs
    const editorRef = useRef<HTMLDivElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const lastEditingNodeId = useRef<string | null>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);

    // Initialize editor content when editingNode changes
    useEffect(() => {
        if (editingNode && editorRef.current) {
            const currentId = editingNode.chapterId || editingNode.taskId || '';
            if (lastEditingNodeId.current !== currentId) {
                editorRef.current.innerHTML = draftContent;
                lastEditingNodeId.current = currentId;
            }
        }
    }, [editingNode, draftContent]);

    // Auto-pagination: Check if content exceeds page height
    useEffect(() => {
        if (!editorRef.current) return;

        const checkPageOverflow = () => {
            const editor = editorRef.current;
            if (!editor) return;

            const pageHeight = pageSizes[pageSize].pxHeight - 100; // Subtract margins
            const contentHeight = editor.scrollHeight;
            const calculatedPages = Math.ceil(contentHeight / pageHeight);

            if (calculatedPages !== currentPage) {
                setCurrentPage(Math.max(1, calculatedPages));
            }
        };

        // Use MutationObserver to watch for content changes
        const observer = new MutationObserver(checkPageOverflow);
        observer.observe(editorRef.current, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Initial check
        checkPageOverflow();

        return () => observer.disconnect();
    }, [pageSize, currentPage]);

    // Toggle folder open/close
    const toggleFolder = (phaseId: string) => {
        setOpenFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phaseId)) newSet.delete(phaseId);
            else newSet.add(phaseId);
            return newSet;
        });
    };

    // Select all chapters in a phase
    const selectAllInPhase = (phaseId: string) => {
        if (!project) return;
        const phase = project.phases.find(p => p.id === phaseId);
        if (!phase) return;
        const chapterIds = phase.chapters.map(c => c.id);
        const allSelected = chapterIds.every(id => selectedForExport.has(id));

        const newSet = new Set(selectedForExport);
        if (allSelected) {
            chapterIds.forEach(id => newSet.delete(id));
        } else {
            chapterIds.forEach(id => newSet.add(id));
        }
        setSelectedForExport(newSet);
    };

    // Select all chapters globally
    const selectAllChapters = () => {
        if (!project) return;
        const allIds = project.phases.flatMap(p => p.chapters.map(c => c.id));
        const allSelected = allIds.every(id => selectedForExport.has(id));

        if (allSelected) {
            setSelectedForExport(new Set());
        } else {
            setSelectedForExport(new Set(allIds));
        }
    };

    const updatePhaseMutation = useMutation({
        mutationFn: (data: { id: string; updates: Partial<ResearchPhase> }) => AcademicService.updatePhase(data.id, data.updates), // Assuming service method exists, else need to add it or skip
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
        }
    });

    const updateCircleMutation = useMutation({
        mutationFn: (data: { id: string; updates: Partial<ResearchCircle> }) => AcademicService.updateCircle(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
        }
    });

    // Export / Internal Editor State
    const [isInternalExportOpen, setIsInternalExportOpen] = useState(false);
    const [exportContent, setExportContent] = useState('');

    // Open setup if no project exists
    useEffect(() => {
        if (!isLoadingProjects && !project) {
            setIsSetupOpen(true);
        }
    }, [project, isLoadingProjects]);

    // Deadline Reminder
    useEffect(() => {
        if (project && project.deadline) {
            const daysLeft = differenceInDays(parseISO(project.deadline), new Date());
            if (daysLeft <= 7 && daysLeft >= 0) {
                toast({ title: `⏳ تذكير`, description: `بقي ${daysLeft} أيام على الموعد النهائي للمشروع`, duration: 5000 });
            }
        }
    }, [project]);

    // -- Mutations --
    const createProjectMutation = useMutation({
        mutationFn: AcademicService.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            setIsSetupOpen(false);
            toast({ title: "✅ تم إنشاء خطة البحث" });
        }
    });

    const createPhaseMutation = useMutation({
        mutationFn: (data: { projectId: string; title: string; index: number }) => AcademicService.createPhase(data.projectId, data.title, data.index),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            setNewPhaseName('');
            setIsPhaseOpen(false);
            toast({ title: "✅ تمت إضافة المرحلة" });
        }
    });

    const deletePhaseMutation = useMutation({
        mutationFn: AcademicService.deletePhase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            toast({ title: "🗑️ تم حذف المرحلة" });
        }
    });

    const createChapterMutation = useMutation({
        mutationFn: (data: { phaseId: string; title: string }) => AcademicService.createChapter(data.phaseId, data.title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            toast({ title: "✅ تم إنشاء صندوق النص" });
        }
    });

    const updateChapterMutation = useMutation({
        mutationFn: (data: { id: string; updates: Partial<ResearchChapter> }) => AcademicService.updateChapter(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
        }
    });

    const deleteChapterMutation = useMutation({
        mutationFn: AcademicService.deleteChapter,
        onSuccess: (_data, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            // Close editor if the deleted chapter was being edited
            if (editingNode?.chapterId === deletedId) {
                setEditingNode(null);
            }
            toast({ title: "🗑️ تم حذف الصندوق" });
        },
        onError: (error) => {
            toast({ title: "❌ خطأ في الحذف", description: String(error) });
        }
    });

    const addMaterialMutation = useMutation({
        mutationFn: (material: Omit<ResearchMaterial, 'id'>) => AcademicService.addMaterial(project!.id, material),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            toast({ title: "✅ تمت إضافة المرجع" });
        }
    });

    const deleteMaterialMutation = useMutation({
        mutationFn: AcademicService.deleteMaterial,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            toast({ title: "🗑️ تم حذف المرجع" });
        }
    });


    const updateTaskContentMutation = useMutation({
        mutationFn: (data: { phaseId: string; chapterId?: string; taskId?: string; content: string; tags?: string[] }) =>
            AcademicService.updateChapter(data.chapterId!, { content: data.content, tags: data.tags }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
        }
    });

    // --- Material Mutations ---
    const updateMaterialMutation = useMutation({
        mutationFn: (data: { id: string; updates: Partial<ResearchMaterial> }) => AcademicService.updateMaterial(data.id, data.updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-projects'] })
    });


    // --- Circle Mutations ---
    const createCircleMutation = useMutation({
        mutationFn: (circle: Omit<ResearchCircle, 'id'>) => AcademicService.addCircle(project!.id, circle),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
        }
    });

    // --- Handlers ---

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "⏳ جاري البدء...", description: "بدأنا معالجة طلبك" }); // Diagnostic logging

        const formData = new FormData(e.target as HTMLFormElement);
        const title = formData.get('title') as string;
        const startDate = formData.get('startDate') as string;
        const deadline = formData.get('deadline') as string;

        // Manual Validation (Redundant but safe if browser tooltips fail)
        if (!title || !startDate || !deadline) {
            toast({ title: "⚠️ يرجى تعبئة الحقول الأساسية", description: "العنوان وتاريخ البدء والموعد النهائي مطلوبة", variant: "destructive" });
            return;
        }

        try {
            console.log("Submitting project creation...");
            const newProject = await createProjectMutation.mutateAsync({
                title,
                description: formData.get('description') as string || '',
                supervisor: formData.get('supervisor') as string || '',
                institution: formData.get('institution') as string || '',
                startDate,
                deadline,
            });

            console.log("Project created:", newProject);

            if (newProject && newProject.id && selectedTemplate && selectedTemplate !== 'none') {
                toast({ title: "🛠️ جاري تطبيق القالب...", description: `تطبيق قالب: ${selectedTemplate}` });
                const phases = {
                    'masters': ['المقدمة والإطار العام', 'الإطار النظري والدراسات السابقة', 'منهجية البحث', 'تحليل النتائج', 'الخاتمة والتوصيات'],
                    'phd': ['الإطار العام للدراسة', 'الإطار النظري', 'الدراسات السابقة', 'بناء النموذج البحثي', 'منهجية الدراسة', 'عرض وتحليل النتائج', 'مناقشة النتائج', 'الخاتمة']
                }[selectedTemplate];

                if (phases) {
                    for (let i = 0; i < phases.length; i++) {
                        await AcademicService.createPhase(newProject.id, phases[i], i);
                    }
                    queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
                    toast({ title: "✅ تم تطبيق القالب البحثي بنجاح" });
                }
            }
        } catch (error: any) {
            console.error("Project creation error:", error);
            toast({
                title: "❌ فشل إنشاء المشروع",
                description: error.data?.message || (typeof error.message === 'string' ? error.message : "تأكد من اتصال الإنترنت ومن تسجيل دخولك"),
                variant: "destructive",
                duration: 7000
            });
        }
    };

    const handleDownloadBackup = () => {
        if (!project) return;
        const data = JSON.stringify(project, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        saveAs(blob, `Academic_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
        toast({ title: "✅ تم تحميل النسخة الاحتياطية" });
    };

    const addPhase = () => {
        if (!project || !newPhaseName.trim()) return;
        createPhaseMutation.mutate({
            projectId: project.id, // Assuming ID is present
            title: newPhaseName,
            index: (project.phases || []).length
        });
    };

    const deletePhase = (phaseId: string) => {
        if (!project) return;
        if (confirm("هل أنت متأكد من حذف هذه المرحلة وجميع محتوياتها؟")) {
            deletePhaseMutation.mutate(phaseId);
        }
    };

    const addChapter = (phaseId: string, title: string) => {
        if (!title.trim()) return;
        createChapterMutation.mutate({ phaseId, title });
    };

    const updateContent = (phaseId: string, chapterId?: string, taskId?: string, content?: string) => {
        if (!project) return;
        // This function is primarily for local state updates in the editor.
        // The actual persistence should happen via saveContent or on blur.
        // For now, we'll just call saveContent directly if chapterId is present.
        if (chapterId) {
            saveContent(chapterId, content || '');
        }
        // If tasks were to be updated, a separate mutation would be needed.
        // For now, we're focusing on chapter content.
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

    // Auto-save draft content with debounce (handled by Effect + Mutation if we wanted auto-save, 
    // but for now keeping explicit save or blur save might be safer for quota, 
    // let's stick to update on blur or a 'Save' button for content)

    // Actually, let's implement a simple auto-save effect or function
    const saveContent = (chapterId: string, content: string) => {
        updateChapterMutation.mutate({ id: chapterId, updates: { content } });
    };

    const handleRename = () => {
        if (!renamingNode) return;
        if (renamingNode.type === 'phase') {
            // Not implementing Phase rename API yet in service, skipping or need to add it
            // Let's rely on local consistency for now or add updatePhase to service
            updatePhaseMutation.mutate({ id: renamingNode.id, updates: { title: renamingNode.title } });
        } else {
            updateChapterMutation.mutate({
                id: renamingNode.id,
                updates: { title: renamingNode.title }
            });
        }
        setRenamingNode(null);
        toast({ title: "✅ تم تحديث العنوان" });
    };

    const deleteChapter = (phaseId: string, chapterId: string) => {
        if (confirm("هل أنت متأكد من حذف صندوق النص؟")) {
            deleteChapterMutation.mutate(chapterId);
        }
    };

    const handleShare = (title: string, content: string) => {
        const text = `${title}\n\n${content}`;
        navigator.clipboard.writeText(text);
        toast({ title: "📋 تم نسخ النص", description: "يمكنك لصقه في أي مكان للمشاركة" });
    };

    const handleAutoGeneratePlan = async () => {
        if (!project || !planText.trim()) return;

        const lines = planText.split('\n').filter(l => l.trim());
        const newPhasesToCreate: { title: string; chapters: string[] }[] = [];
        let currentPhaseIndex = -1;

        lines.forEach(line => {
            const cleanLine = line.trim();
            const isSub = cleanLine.startsWith('-') || cleanLine.startsWith('•') || cleanLine.startsWith('*');
            const content = cleanLine.replace(/^[-•*]\s*/, '');

            if (isSub && currentPhaseIndex !== -1) {
                // Add as chapter to the current phase
                newPhasesToCreate[currentPhaseIndex].chapters.push(content);
            } else {
                // New Phase
                newPhasesToCreate.push({ title: content, chapters: [] });
                currentPhaseIndex = newPhasesToCreate.length - 1;
            }
        });

        if (newPhasesToCreate.length > 0) {
            for (const phaseData of newPhasesToCreate) {
                // Create phase
                const newPhase = await AcademicService.createPhase(project.id, phaseData.title, (project.phases || []).length + newPhasesToCreate.indexOf(phaseData));
                if (newPhase && newPhase.id) {
                    // Create chapters for the phase
                    for (const chapterTitle of phaseData.chapters) {
                        await AcademicService.createChapter(newPhase.id, chapterTitle);
                    }
                }
            }
            queryClient.invalidateQueries({ queryKey: ['academic-projects'] });
            setPlanText('');
            setIsAutoPlanOpen(false);
            toast({ title: `✅ تم توليد ${newPhasesToCreate.length} مراحل` });
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

    if (isLoadingProjects) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]" dir="rtl">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-500">جاري تحميل البيانات الأكاديمية...</p>
            </div>
        );
    }

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
        <div className="space-y-4 bg-gray-50/30 p-2 sm:p-4" dir="rtl">
            {/* Header section (Mobile Optimized) */}
            {project && (
                <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-xl p-3 sm:p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex flex-col gap-3 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className="bg-amber-500 hover:bg-amber-600 border-0 text-[10px] px-2 py-0.5">نظام البحث</Badge>
                                {(project.phases || []).length > 0 && <Badge variant="outline" className="text-white border-white/20 text-[10px] px-2 py-0.5">{(project.phases || []).length} مراحل</Badge>}
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight line-clamp-2">{project.title}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-purple-100/70 text-[10px] sm:text-xs">
                                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {project.supervisor}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {project.institution}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-white/10 p-2 rounded-xl border border-white/10">
                            <div className="text-center flex-1">
                                <span className="text-2xl font-black text-amber-300">{calculateProgress()}%</span>
                                <Progress value={calculateProgress()} className="h-1 mt-1 bg-white/20" />
                                <p className="text-[8px] uppercase font-bold tracking-widest text-purple-200 mt-0.5">الإنجاز</p>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2"></div>
                            <div className="text-center flex-1">
                                <span className="text-xs font-bold block text-purple-100">{format(new Date(project.deadline), 'dd/MM/yy', { locale: ar })}</span>
                                <span className="text-[8px] text-purple-300">الموعد النهائي</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs (Mobile Optimized) */}
            <Tabs defaultValue="drafts" onValueChange={setActiveTab} className="w-full">
                <div className="bg-white/80 backdrop-blur border border-gray-100 p-1.5 rounded-xl shadow-sm mb-4 sticky top-0 z-30">
                    <div className="overflow-x-auto scrollbar-thin">
                        <TabsList className="bg-gray-100/50 p-0.5 rounded-lg h-auto flex flex-nowrap justify-start min-w-max gap-0.5">
                            <TabsTrigger value="drafts" className="gap-1 px-2 py-1.5 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <StickyNote className="w-3 h-3" /> النصوص
                            </TabsTrigger>
                            <TabsTrigger value="plan" className="gap-1 px-2 py-1.5 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <LayoutList className="w-3 h-3" /> الهيكل
                            </TabsTrigger>

                            <TabsTrigger value="materials" className="gap-1 px-2 py-1.5 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <Library className="w-3 h-3" /> المكتبة
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className="gap-1 px-2 py-1.5 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <History className="w-3 h-3" /> الجدول
                            </TabsTrigger>
                            <TabsTrigger value="stats" className="gap-1 px-2 py-1.5 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-amber-700 bg-amber-50/50">
                                <BarChart2 className="w-3 h-3" /> إحصائيات
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Action Buttons (Compact) */}
                    <div className="flex gap-1 mt-1.5 flex-wrap">
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

                    </div>
                </div>

                {/* --- Drafts Tab (Folder View) --- */}
                <TabsContent value="drafts" className="mt-0 focus-visible:outline-none">
                    {/* Select All Button */}
                    <div className="flex justify-between items-center mb-4 bg-white/80 p-3 rounded-xl border border-gray-100">
                        <span className="text-sm font-bold text-gray-600">
                            {selectedForExport.size} / {project?.phases.reduce((acc, p) => acc + p.chapters.length, 0) || 0} محدد
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={selectAllChapters}
                            className="h-8 gap-2 text-xs"
                        >
                            <CheckSquare className="w-3 h-3" />
                            {project?.phases.flatMap(p => p.chapters).every(c => selectedForExport.has(c.id)) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                        </Button>
                    </div>

                    {/* Folders (Phases) */}
                    <div className="space-y-4">
                        {(project?.phases || []).map(phase => {
                            const isOpen = openFolders.has(phase.id);
                            const phaseChapterIds = phase.chapters.map(c => c.id);
                            const allPhaseSelected = phaseChapterIds.length > 0 && phaseChapterIds.every(id => selectedForExport.has(id));
                            const somePhaseSelected = phaseChapterIds.some(id => selectedForExport.has(id));

                            return (
                                <div key={phase.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Folder Header */}
                                    <div
                                        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-colors"
                                        onClick={() => toggleFolder(phase.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isOpen ? <FolderOpen className="w-5 h-5 text-indigo-600" /> : <Folder className="w-5 h-5 text-indigo-500" />}
                                            <div>
                                                <h3 className="font-bold text-gray-800">{phase.title}</h3>
                                                <p className="text-[10px] text-gray-500">{phase.chapters.length} صندوق نص</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={allPhaseSelected ? 'default' : 'outline'}
                                                className={`h-7 text-[10px] gap-1 ${allPhaseSelected ? 'bg-indigo-600' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); selectAllInPhase(phase.id); }}
                                            >
                                                <CheckSquare className="w-3 h-3" />
                                                {allPhaseSelected ? 'إلغاء' : 'تحديد الكل'}
                                            </Button>
                                            <Badge variant="outline" className={somePhaseSelected ? 'bg-purple-100 text-purple-700' : ''}>
                                                {phaseChapterIds.filter(id => selectedForExport.has(id)).length}/{phaseChapterIds.length}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Folder Contents */}
                                    {isOpen && (
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {phase.chapters.map(chapter => (
                                                <Card
                                                    key={chapter.id}
                                                    className={`group relative transition-all hover:scale-[1.02] cursor-pointer border-2 overflow-hidden ${selectedForExport.has(chapter.id) ? 'border-purple-500 bg-purple-50/30' : 'border-transparent bg-gray-50 hover:bg-white'}`}
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).closest('.export-toggle')) return;
                                                        setEditingNode({ phaseId: phase.id, chapterId: chapter.id });
                                                        setDraftContent(chapter.content || '');
                                                        setDraftTags(chapter.tags || []);
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
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className={`text-xs leading-relaxed text-gray-600 line-clamp-3 min-h-[4rem] whitespace-pre-wrap ${!chapter.content ? 'text-gray-300 italic' : ''}`}>
                                                            {chapter.content || 'انقر للكتابة...'}
                                                        </p>
                                                    </CardContent>
                                                    <div className="px-4 py-2 bg-gray-100/50 flex justify-between items-center text-[10px] text-gray-400">
                                                        <span>{chapter.content?.length || 0} حرف</span>
                                                        <PenTool className="w-3 h-3 group-hover:text-purple-500 transition-colors" />
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {(project?.phases || []).length === 0 && (
                        <div className="text-center py-20 bg-white/50 border-2 border-dashed rounded-3xl">
                            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">لا توجد مجلدات بعد</p>
                            <Button variant="link" onClick={() => setIsPhaseOpen(true)} className="text-purple-600 font-black mt-2 underline">أضف أول مرحلة بحثية الآن</Button>
                        </div>
                    )}
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
                                                updateCircleMutation.mutate({ id: circle.id, updates: { completed: !!val } });
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
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">مكتبة المصادر والمراجع</CardTitle>
                            <CardDescription>نظم الكتب والأبحاث التي تعتمد عليها في دراستك</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Material Form */}
                            <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                                <h4 className="font-bold text-sm text-gray-700">إضافة مرجع جديد</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input placeholder="عنوان الكتاب / المرجع" id="mat-title" className="h-10 text-sm" />
                                    <Input placeholder="اسم المؤلف" id="mat-author" className="h-10 text-sm" />
                                    <Input placeholder="الدار الناشرة" id="mat-publisher" className="h-10 text-sm" />
                                    <Input placeholder="سنة الطبع" id="mat-year" className="h-10 text-sm" />
                                    <Input placeholder="تاريخ وفاة المؤلف (هـ)" id="mat-death" className="h-10 text-sm" />
                                    <Input placeholder="الوسوم (مثلاً: فقه, تاريخ)" id="mat-tags" className="h-10 text-sm" />
                                    <Select defaultValue="book">
                                        <SelectTrigger className="h-10" id="mat-type">
                                            <SelectValue placeholder="نوع المرجع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="book">كتاب</SelectItem>
                                            <SelectItem value="paper">بحث/ورقة</SelectItem>
                                            <SelectItem value="link">رابط</SelectItem>
                                            <SelectItem value="other">أخرى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => {
                                    const titleEl = document.getElementById('mat-title') as HTMLInputElement;
                                    const authorEl = document.getElementById('mat-author') as HTMLInputElement;
                                    const publisherEl = document.getElementById('mat-publisher') as HTMLInputElement;
                                    const yearEl = document.getElementById('mat-year') as HTMLInputElement;
                                    const deathEl = document.getElementById('mat-death') as HTMLInputElement;
                                    const tagsEl = document.getElementById('mat-tags') as HTMLInputElement;

                                    if (titleEl.value && project) {
                                        const newMat: Omit<ResearchMaterial, 'id'> = {
                                            title: titleEl.value,
                                            author: authorEl.value || undefined,
                                            publisher: publisherEl.value || undefined,
                                            year: yearEl.value || undefined,
                                            deathDate: deathEl.value || undefined,
                                            tags: tagsEl.value ? tagsEl.value.split(',').map(t => t.trim()) : [],
                                            type: 'book',
                                            status: 'to_read'
                                        };
                                        addMaterialMutation.mutate(newMat);
                                        titleEl.value = '';
                                        authorEl.value = '';
                                        publisherEl.value = '';
                                        yearEl.value = '';
                                        deathEl.value = '';
                                    }
                                }} className="bg-purple-600 hover:bg-purple-700 h-10 w-full md:w-auto">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة مرجع
                                </Button>
                            </div>

                            {/* Materials List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(project?.materials || []).map(mat => (
                                    <Card key={mat.id} className="border border-gray-100 hover:border-purple-200 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg">
                                                        {mat.type === 'book' ? '📕' : mat.type === 'paper' ? '📄' : '🔗'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-800">{mat.title}</h4>
                                                        {mat.author && <p className="text-xs text-gray-500">{mat.author} {mat.deathDate ? `(ت: ${mat.deathDate})` : ''}</p>}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] ${mat.status === 'read' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {mat.status === 'read' ? '✅ قرأت' : '⏳ قيد الانتظار'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                                                {mat.publisher && <span className="bg-gray-100 px-2 py-1 rounded">🏛️ {mat.publisher}</span>}
                                                {mat.year && <span className="bg-gray-100 px-2 py-1 rounded">📅 {mat.year}</span>}
                                            </div>
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => {
                                                    const newStatus = mat.status === 'read' ? 'to_read' : 'read';
                                                    updateMaterialMutation.mutate({ id: mat.id, updates: { status: newStatus } });
                                                }}>
                                                    {mat.status === 'read' ? 'إعادة للانتظار' : 'تم القراءة'}
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500 hover:bg-rose-50" onClick={() => {
                                                    if (confirm("هل أنت متأكد من حذف المرجع؟")) {
                                                        deleteMaterialMutation.mutate(mat.id);
                                                    }
                                                }}>
                                                    <Trash className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {(project?.materials || []).length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Library className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>لا توجد مراجع مسجلة بعد</p>
                                </div>
                            )}
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

                {/* --- Statistics Tab --- */}
                <TabsContent value="stats" className="focus-visible:outline-none">
                    <StatsDashboard project={project} />
                </TabsContent>
            </Tabs >

            {/* --- Dialogs --- */}

            {/* Editor Dialog - Full Screen Professional Layout */}
            <GlobalSearch />
            {editingNode && (
                <div className="fixed inset-0 z-[200] bg-slate-800 flex flex-row-reverse animate-in fade-in">
                    {/* Hidden PDF Input */}
                    <input
                        type="file"
                        ref={pdfInputRef}
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                toast({ title: `تم تحميل: ${file.name}`, description: "سيتم استخراج النص من PDF" });
                                // For now just show the file name - full PDF parsing would require a library
                                const reader = new FileReader();
                                reader.onload = () => {
                                    document.execCommand('insertHTML', false, `<p style="color:#6366f1;font-style:italic;">[محتوى PDF: ${file.name}]</p>`);
                                };
                                reader.readAsText(file);
                            }
                            e.target.value = '';
                        }}
                    />

                    {/* Sidebar Toggle Button - Floating */}
                    {!sidebarVisible && (
                        <button
                            onClick={() => setSidebarVisible(true)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-xl transition-all hover:scale-110"
                            title="إظهار الشريط الجانبي"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Main Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Full-Width Toolbar - 2 Rows */}
                        <div className="bg-gradient-to-b from-indigo-900 to-slate-800 p-3 shrink-0 border-b border-indigo-700" dir="rtl">
                            {/* Row 1: Undo/Redo, Font, Size, Zoom, Spacing, Format Painter */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" title="تراجع" onClick={() => document.execCommand('undo')}><Undo className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" title="إعادة" onClick={() => document.execCommand('redo')}><Redo className="w-4 h-4" /></Button>
                                <div className="w-px h-6 bg-white/20" />
                                {/* Arabic Fonts */}
                                <Select defaultValue="Traditional Arabic" onValueChange={(val) => document.execCommand("fontName", false, val)}>
                                    <SelectTrigger className="w-40 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue placeholder="خط عربي" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Traditional Arabic">Traditional Arabic (تقليدي)</SelectItem>
                                        <SelectItem value="Amiri">Amiri (أميري)</SelectItem>
                                        <SelectItem value="Cairo">Cairo (القاهرة)</SelectItem>
                                        <SelectItem value="Tajawal">Tajawal (تجوّل)</SelectItem>
                                        <SelectItem value="Almarai">Almarai (المراعي)</SelectItem>
                                        <SelectItem value="Noto Naskh Arabic">Noto Naskh Arabic</SelectItem>
                                        <SelectItem value="Scheherazade New">Scheherazade New</SelectItem>
                                        <SelectItem value="Reem Kufi">Reem Kufi (ريم كوفي)</SelectItem>
                                        <SelectItem value="Aref Ruqaa">Aref Ruqaa (عارف رقعة)</SelectItem>
                                        <SelectItem value="El Messiri">El Messiri (المسيري)</SelectItem>
                                        <SelectItem value="Mada">Mada (مدى)</SelectItem>
                                        <SelectItem value="Lemonada">Lemonada (ليموناضة)</SelectItem>
                                        <SelectItem value="Katibeh">Katibeh (كاتبة)</SelectItem>
                                        <SelectItem value="Harmattan">Harmattan</SelectItem>
                                        <SelectItem value="Lateef">Lateef</SelectItem>
                                        <SelectItem value="Mirza">Mirza</SelectItem>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                    </SelectContent>
                                </Select>
                                {/* Font Size */}
                                <Select defaultValue="14" onValueChange={(val) => document.execCommand('fontSize', false, val)}>
                                    <SelectTrigger className="w-14 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue placeholder="14" /></SelectTrigger>
                                    <SelectContent>
                                        {[10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="w-px h-6 bg-white/20" />
                                {/* Zoom Control */}
                                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-white/70" onClick={() => setEditorZoom(Math.max(50, editorZoom - 10))}><Minus className="w-3 h-3" /></Button>
                                    <span className="text-xs text-white/80 w-10 text-center">{editorZoom}%</span>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-white/70" onClick={() => setEditorZoom(Math.min(200, editorZoom + 10))}><Plus className="w-3 h-3" /></Button>
                                </div>
                                {/* Page Size Selector */}
                                <Select value={pageSize} onValueChange={(val: 'A4' | 'A5' | 'Letter') => setPageSize(val)}>
                                    <SelectTrigger className="w-16 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="A5">A5</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                    </SelectContent>
                                </Select>
                                {/* Page Counter */}
                                <span className="text-xs text-white/60 px-2">صفحة {currentPage}</span>
                                {/* Line Spacing */}
                                <Select value={String(lineSpacing)} onValueChange={(val) => setLineSpacing(parseFloat(val))}>
                                    <SelectTrigger className="w-14 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1.0</SelectItem>
                                        <SelectItem value="1.5">1.5</SelectItem>
                                        <SelectItem value="1.8">1.8</SelectItem>
                                        <SelectItem value="2">2.0</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="w-px h-6 bg-white/20" />
                                {/* Format Painter */}
                                <Button
                                    variant={formatPainterActive ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-8 px-2 text-xs ${formatPainterActive ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white'}`}
                                    onClick={() => {
                                        if (!formatPainterActive) {
                                            const selection = window.getSelection();
                                            if (selection && selection.rangeCount > 0) {
                                                const node = selection.anchorNode?.parentElement;
                                                if (node) {
                                                    setPainterStyles({
                                                        fontFamily: window.getComputedStyle(node).fontFamily,
                                                        fontSize: window.getComputedStyle(node).fontSize,
                                                        color: window.getComputedStyle(node).color,
                                                        fontWeight: window.getComputedStyle(node).fontWeight,
                                                        fontStyle: window.getComputedStyle(node).fontStyle,
                                                    });
                                                    setFormatPainterActive(true);
                                                    toast({ title: "✓ تم نسخ التنسيق. حدد نصاً لتطبيقه." });
                                                }
                                            }
                                        } else {
                                            setFormatPainterActive(false);
                                        }
                                    }}
                                    title="ناسخ التنسيق"
                                >
                                    <Pencil className="w-3 h-3 ml-1" /> ناسخ التنسيق
                                </Button>
                            </div>
                            {/* Row 2: Text Formatting */}
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                {/* Bold, Italic, Underline, Strikethrough */}
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('bold')} title="غامق"><Bold className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('italic')} title="مائل"><Italic className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('underline')} title="تسطير"><Underline className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('strikeThrough')} title="يتوسطه خط"><Strikethrough className="w-4 h-4" /></Button>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                                {/* Text Color & Highlight */}
                                <div className="flex items-center gap-1 bg-white/10 rounded px-1">
                                    <Type className="w-3 h-3 text-white/50" />
                                    <input type="color" className="w-6 h-6 rounded cursor-pointer border-0" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} title="لون النص" />
                                </div>
                                <div className="flex items-center gap-1 bg-white/10 rounded px-1">
                                    <Palette className="w-3 h-3 text-white/50" />
                                    <input type="color" className="w-6 h-6 rounded cursor-pointer border-0" defaultValue="#FFFF00" onChange={(e) => document.execCommand('hiliteColor', false, e.target.value)} title="تمييز" />
                                </div>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                                {/* Alignment */}
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('justifyRight')} title="محاذاة يمين"><AlignRight className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('justifyCenter')} title="توسيط"><AlignCenter className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('justifyLeft')} title="محاذاة يسار"><AlignLeft className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => document.execCommand('justifyFull')} title="ضبط"><AlignJustify className="w-4 h-4" /></Button>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                                {/* Lists - Fixed RTL */}
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => {
                                    document.execCommand('insertHTML', false, '<ul style="list-style-type:disc;padding-right:20px;margin:8px 0;direction:rtl;"><li>عنصر جديد</li></ul>');
                                }} title="قائمة نقطية"><LayoutList className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white" onClick={() => {
                                    document.execCommand('insertHTML', false, '<ol style="list-style-type:decimal;padding-right:20px;margin:8px 0;direction:rtl;"><li>عنصر أول</li></ol>');
                                }} title="قائمة مرقمة"><LayoutGrid className="w-4 h-4" /></Button>
                                <div className="w-px h-6 bg-white/20 mx-1" />

                                {/* Table with dropdown for row/column operations */}
                                <div className="relative group">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" title="جدول">
                                        <LayoutGrid className="w-3 h-3 ml-1" /> جدول ▾
                                    </Button>
                                    <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                        <button className="w-full text-right px-3 py-2 text-xs text-white/80 hover:bg-white/10" onClick={() => {
                                            const table = `<table style="width:100%;border-collapse:collapse;margin:16px 0;direction:rtl;"><tr><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td></tr><tr><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td></tr></table>`;
                                            document.execCommand('insertHTML', false, table);
                                            toast({ title: "✅ تم إدراج جدول 3×2" });
                                        }}>➕ إدراج جدول جديد</button>
                                        <button className="w-full text-right px-3 py-2 text-xs text-white/80 hover:bg-white/10" onClick={() => {
                                            const sel = window.getSelection();
                                            const cell = sel?.anchorNode?.parentElement?.closest('td');
                                            if (cell) {
                                                const row = cell.parentElement as HTMLTableRowElement;
                                                const table = row?.parentElement;
                                                if (table) {
                                                    const newRow = row.cloneNode(true) as HTMLTableRowElement;
                                                    Array.from(newRow.cells).forEach(c => c.innerHTML = '&nbsp;');
                                                    row.after(newRow);
                                                    toast({ title: "✅ تم إضافة صف" });
                                                }
                                            } else {
                                                toast({ title: "⚠️ ضع المؤشر داخل الجدول أولاً" });
                                            }
                                        }}>➕ إضافة صف</button>
                                        <button className="w-full text-right px-3 py-2 text-xs text-white/80 hover:bg-white/10" onClick={() => {
                                            const sel = window.getSelection();
                                            const cell = sel?.anchorNode?.parentElement?.closest('td');
                                            if (cell && cell.parentElement) {
                                                const row = cell.parentElement as HTMLTableRowElement;
                                                if (row.parentElement && row.parentElement.children.length > 1) {
                                                    row.remove();
                                                    toast({ title: "✅ تم حذف الصف" });
                                                } else {
                                                    toast({ title: "⚠️ لا يمكن حذف آخر صف" });
                                                }
                                            }
                                        }}>➖ حذف صف</button>
                                        <button className="w-full text-right px-3 py-2 text-xs text-white/80 hover:bg-white/10" onClick={() => {
                                            const sel = window.getSelection();
                                            const cell = sel?.anchorNode?.parentElement?.closest('td') as HTMLTableCellElement;
                                            if (cell) {
                                                const table = cell.closest('table');
                                                if (table) {
                                                    const cellIndex = cell.cellIndex;
                                                    Array.from(table.rows).forEach(row => {
                                                        const newCell = row.insertCell(cellIndex + 1);
                                                        newCell.style.cssText = 'border:1px solid #6366f1;padding:12px;';
                                                        newCell.innerHTML = '&nbsp;';
                                                    });
                                                    toast({ title: "✅ تم إضافة عمود" });
                                                }
                                            }
                                        }}>➕ إضافة عمود</button>
                                        <button className="w-full text-right px-3 py-2 text-xs text-white/80 hover:bg-white/10" onClick={() => {
                                            const sel = window.getSelection();
                                            const cell = sel?.anchorNode?.parentElement?.closest('td') as HTMLTableCellElement;
                                            if (cell) {
                                                const table = cell.closest('table');
                                                if (table && table.rows[0].cells.length > 1) {
                                                    const cellIndex = cell.cellIndex;
                                                    Array.from(table.rows).forEach(row => row.deleteCell(cellIndex));
                                                    toast({ title: "✅ تم حذف العمود" });
                                                } else {
                                                    toast({ title: "⚠️ لا يمكن حذف آخر عمود" });
                                                }
                                            }
                                        }}>➖ حذف عمود</button>
                                    </div>
                                </div>

                                {/* PDF Insert */}
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-rose-400 hover:bg-rose-500/20" onClick={() => pdfInputRef.current?.click()} title="إدراج PDF"><FileUp className="w-3 h-3 ml-1" /> PDF</Button>

                                {/* Footnote - Enhanced with bottom section */}
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                    const content = editorRef.current?.innerHTML || '';
                                    const footnoteCount = (content.match(/class="footnote-marker"/g) || []).length + 1;
                                    // Add marker in text
                                    document.execCommand('insertHTML', false, `<sup class="footnote-marker" style="color:#d97706;cursor:pointer;font-weight:bold;">[${footnoteCount}]</sup>`);
                                    // Check if footnotes section exists, if not create it
                                    if (editorRef.current && !editorRef.current.querySelector('.footnotes-section')) {
                                        const footnotesSection = document.createElement('div');
                                        footnotesSection.className = 'footnotes-section';
                                        footnotesSection.style.cssText = 'margin-top:40px;padding-top:20px;border-top:2px dashed #ccc;';
                                        footnotesSection.innerHTML = `<p style="font-weight:bold;color:#6366f1;margin-bottom:10px;">── الحواشي ──</p><p class="footnote-item" style="font-size:14px;color:#666;">[${footnoteCount}] <span contenteditable="true" style="color:#333;">أدخل نص الحاشية هنا</span></p>`;
                                        editorRef.current.appendChild(footnotesSection);
                                    } else if (editorRef.current) {
                                        const section = editorRef.current.querySelector('.footnotes-section');
                                        if (section) {
                                            const newFootnote = document.createElement('p');
                                            newFootnote.className = 'footnote-item';
                                            newFootnote.style.cssText = 'font-size:14px;color:#666;';
                                            newFootnote.innerHTML = `[${footnoteCount}] <span contenteditable="true" style="color:#333;">أدخل نص الحاشية هنا</span>`;
                                            section.appendChild(newFootnote);
                                        }
                                    }
                                    toast({ title: `✅ تم إضافة حاشية [${footnoteCount}]` });
                                }} title="حاشية"><Footprints className="w-3 h-3 ml-1" /> حاشية</Button>

                                {/* Page Break - Creates independent pages */}
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                    const pageBreak = `<div style="page-break-after:always;margin:40px 0;text-align:center;"><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/><span style="background:#f1f5f9;padding:4px 12px;border-radius:4px;font-size:12px;color:#64748b;">── فاصل صفحات ──</span><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/></div><p>&nbsp;</p>`;
                                    document.execCommand('insertHTML', false, pageBreak);
                                    // Scroll to the new page
                                    setTimeout(() => {
                                        const sel = window.getSelection();
                                        if (sel && sel.focusNode) {
                                            (sel.focusNode as HTMLElement).scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                                        }
                                    }, 100);
                                    toast({ title: "✅ تم إضافة صفحة جديدة" });
                                }} title="فاصل صفحات"><Minus className="w-3 h-3 ml-1" /> صفحة جديدة</Button>

                                {/* Add Comment */}
                                <Button variant="ghost" size="sm" className={`h-8 px-2 text-xs ${showComments ? 'text-amber-400 bg-amber-500/20' : 'text-white/70 hover:text-white'}`} onClick={() => {
                                    const selection = window.getSelection();
                                    if (selection && selection.toString().trim()) {
                                        const selectedText = selection.toString();
                                        const comment = prompt('أدخل تعليقك:');
                                        if (comment) {
                                            document.execCommand('insertHTML', false, `<mark style="background:linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);padding:2px 4px;border-radius:2px;cursor:help;" title="💬 ${comment}">${selectedText}</mark>`);
                                            toast({ title: "✅ تم إضافة التعليق" });
                                        }
                                    } else {
                                        setShowComments(!showComments);
                                        toast({ title: showComments ? "تم إخفاء التعليقات" : "حدد نصاً لإضافة تعليق" });
                                    }
                                }} title="إضافة تعليق"><MessageSquare className="w-3 h-3 ml-1" /> تعليق</Button>
                            </div>
                        </div>

                        {/* Page Container with Bottom Toolbar */}
                        <div className="flex-1 bg-gradient-to-br from-amber-100/60 via-stone-200 to-slate-300 overflow-auto flex flex-col items-center p-8 pb-20 relative">
                            {/* Bottom Floating Toolbar - Separate Buttons */}
                            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-row gap-3 z-40 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-200">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-10 h-10 bg-white shadow-lg border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
                                    title="إضافة صفحة جديدة"
                                    onClick={() => {
                                        const pageBreak = `<div style="page-break-after:always;margin:40px 0;text-align:center;"><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/><span style="background:#f1f5f9;padding:4px 12px;border-radius:4px;font-size:12px;color:#64748b;">── فاصل صفحات ──</span><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/></div><p>&nbsp;</p>`;
                                        document.execCommand('insertHTML', false, pageBreak);
                                        toast({ title: "✅ تم إضافة صفحة جديدة" });
                                    }}
                                >
                                    <Plus className="w-5 h-5 text-indigo-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-10 h-10 bg-white shadow-lg border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                                    title="إدراج جدول"
                                    onClick={() => {
                                        const table = `<table style="width:100%;border-collapse:collapse;margin:16px 0;direction:rtl;"><tr><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;background:#f8fafc;">&nbsp;</td></tr><tr><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td><td style="border:1px solid #6366f1;padding:12px;">&nbsp;</td></tr></table>`;
                                        document.execCommand('insertHTML', false, table);
                                        toast({ title: "✅ تم إدراج جدول" });
                                    }}
                                >
                                    <LayoutGrid className="w-5 h-5 text-emerald-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-10 h-10 bg-white shadow-lg border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                                    title="إضافة حاشية"
                                    onClick={() => {
                                        const content = editorRef.current?.innerHTML || '';
                                        const footnoteCount = (content.match(/class="footnote-marker"/g) || []).length + 1;
                                        document.execCommand('insertHTML', false, `<sup class="footnote-marker" style="color:#d97706;cursor:pointer;font-weight:bold;">[${footnoteCount}]</sup>`);
                                        if (editorRef.current && !editorRef.current.querySelector('.footnotes-section')) {
                                            const footnotesSection = document.createElement('div');
                                            footnotesSection.className = 'footnotes-section';
                                            footnotesSection.style.cssText = 'margin-top:40px;padding-top:20px;border-top:2px dashed #ccc;';
                                            footnotesSection.innerHTML = `<p style="font-weight:bold;color:#6366f1;margin-bottom:10px;">── الحواشي ──</p><p class="footnote-item" style="font-size:14px;color:#666;">[${footnoteCount}] <span contenteditable="true" style="color:#333;">أدخل نص الحاشية هنا</span></p>`;
                                            editorRef.current.appendChild(footnotesSection);
                                        } else if (editorRef.current) {
                                            const section = editorRef.current.querySelector('.footnotes-section');
                                            if (section) {
                                                const newFootnote = document.createElement('p');
                                                newFootnote.className = 'footnote-item';
                                                newFootnote.style.cssText = 'font-size:14px;color:#666;';
                                                newFootnote.innerHTML = `[${footnoteCount}] <span contenteditable="true" style="color:#333;">أدخل نص الحاشية هنا</span>`;
                                                section.appendChild(newFootnote);
                                            }
                                        }
                                        toast({ title: `✅ تم إضافة حاشية [${footnoteCount}]` });
                                    }}
                                >
                                    <Footprints className="w-5 h-5 text-amber-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-10 h-10 bg-white shadow-lg border-slate-200 hover:bg-rose-50 hover:border-rose-300"
                                    title="إضافة تعليق"
                                    onClick={() => {
                                        const selection = window.getSelection();
                                        if (selection && selection.toString().trim()) {
                                            const selectedText = selection.toString();
                                            const comment = prompt('أدخل تعليقك:');
                                            if (comment) {
                                                document.execCommand('insertHTML', false, `<mark style="background:linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);padding:2px 4px;border-radius:2px;cursor:help;" title="💬 ${comment}">${selectedText}</mark>`);
                                                toast({ title: "✅ تم إضافة التعليق" });
                                            }
                                        } else {
                                            toast({ title: "⚠️ حدد نصاً أولاً" });
                                        }
                                    }}
                                >
                                    <MessageSquare className="w-5 h-5 text-rose-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-10 h-10 bg-white shadow-lg border-slate-200 hover:bg-purple-50 hover:border-purple-300"
                                    title="إدراج PDF"
                                    onClick={() => pdfInputRef.current?.click()}
                                >
                                    <FileUp className="w-5 h-5 text-purple-600" />
                                </Button>
                            </div>

                            {/* Page Area */}
                            <div className="flex-1 flex justify-center">
                                <div ref={pagesContainerRef} style={{ transform: `scale(${editorZoom / 100})`, transformOrigin: 'top center' }} className="transition-transform duration-200">
                                    {/* Dynamic Page Size */}
                                    <div
                                        className="bg-white shadow-2xl relative"
                                        style={{
                                            width: `${pageSizes[pageSize].width}mm`,
                                            minHeight: `${pageSizes[pageSize].height}mm`,
                                            padding: '25mm',
                                            direction: 'rtl',
                                            boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
                                        }}
                                    >
                                        {/* Editable Content */}
                                        <div
                                            ref={editorRef}
                                            id="editor-content"
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            className="outline-none text-justify min-h-[200mm] focus:outline-none"
                                            dir="rtl"
                                            onInput={(e) => setDraftContent(e.currentTarget.innerHTML)}
                                            onKeyDown={(e) => {
                                                // Keyboard shortcuts
                                                if (e.ctrlKey || e.metaKey) {
                                                    switch (e.key.toLowerCase()) {
                                                        case 'b':
                                                            e.preventDefault();
                                                            document.execCommand('bold');
                                                            break;
                                                        case 'i':
                                                            e.preventDefault();
                                                            document.execCommand('italic');
                                                            break;
                                                        case 'u':
                                                            e.preventDefault();
                                                            document.execCommand('underline');
                                                            break;
                                                        case 's':
                                                            e.preventDefault();
                                                            // Save
                                                            if (editingNode) {
                                                                const targetPhaseId = editingNode.phaseId;
                                                                const targetId = editingNode.chapterId || editingNode.taskId;
                                                                if (targetPhaseId && targetId) {
                                                                    if (editingNode.chapterId) {
                                                                        updateTaskContentMutation.mutate({ phaseId: targetPhaseId, chapterId: targetId, content: draftContent, tags: draftTags });
                                                                    } else if (editingNode.taskId) {
                                                                        updateTaskContentMutation.mutate({ phaseId: targetPhaseId, taskId: targetId, content: draftContent, tags: draftTags });
                                                                    }
                                                                    toast({ title: "✅ تم الحفظ (Ctrl+S)" });
                                                                }
                                                            }
                                                            break;
                                                        case 'z':
                                                            if (e.shiftKey) {
                                                                e.preventDefault();
                                                                document.execCommand('redo');
                                                            } else {
                                                                e.preventDefault();
                                                                document.execCommand('undo');
                                                            }
                                                            break;
                                                        case 'y':
                                                            e.preventDefault();
                                                            document.execCommand('redo');
                                                            break;
                                                    }
                                                }
                                            }}
                                            style={{
                                                fontFamily: 'Traditional Arabic, serif',
                                                fontSize: '18px',
                                                lineHeight: lineSpacing,
                                                textAlign: 'justify',
                                                direction: 'rtl',
                                                unicodeBidi: 'bidi-override',
                                                caretColor: '#d97706'
                                            }}
                                        />
                                        {/* Page Number */}
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-400">- 1 -</div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Bar - Unified with all actions */}
                            <div className="p-2 bg-slate-800 border-t border-slate-600 flex justify-between items-center shrink-0" dir="rtl">
                                {/* Right side - Action icons */}
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={async () => {
                                        const textContent = draftContent.replace(/<[^>]*>/g, '');
                                        if (navigator.share) {
                                            try {
                                                await navigator.share({
                                                    title: getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title || 'مسودة',
                                                    text: textContent.substring(0, 500),
                                                });
                                            } catch { /* cancelled */ }
                                        } else {
                                            navigator.clipboard.writeText(textContent);
                                            toast({ title: "✅ تم النسخ للمشاركة" });
                                        }
                                    }} title="مشاركة">
                                        <Share2 className="w-4 h-4 ml-1" />
                                        <span className="hidden sm:inline">مشاركة</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                        const title = getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title || 'مسودة';
                                        const content = editorRef.current?.innerHTML || draftContent;
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { size: ${pageSize}; margin: 20mm; }
* { box-sizing: border-box; }
body { 
    font-family: 'Traditional Arabic', 'Arial', serif; 
    font-size: 14pt; 
    line-height: ${lineSpacing}; 
    direction: rtl; 
    text-align: justify;
    margin: 0;
    padding: 20px;
}
h1, h2, h3 { text-align: center; margin: 20px 0; }
table { border-collapse: collapse; width: 100%; margin: 15px 0; }
td, th { border: 1px solid #333; padding: 10px; text-align: right; }
th { background: #f5f5f5; }
.footnotes-section { 
    margin-top: 40px; 
    padding-top: 15px; 
    border-top: 2px dashed #666; 
    font-size: 12pt;
}
.footnote-marker { color: #d97706; font-weight: bold; }
mark { background-color: #fef3c7; padding: 2px 4px; }
ul, ol { padding-right: 25px; margin: 10px 0; }
@media print {
    body { padding: 0; }
}
</style>
</head>
<body>${content}</body>
</html>`);
                                            printWindow.document.close();
                                            setTimeout(() => { printWindow.print(); }, 500);
                                        }
                                    }} title="تصدير PDF">
                                        <FileText className="w-4 h-4 ml-1" />
                                        <span className="hidden sm:inline">PDF</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                        const title = getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title || 'مسودة';
                                        const content = editorRef.current?.innerHTML || draftContent;
                                        const docContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { size: ${pageSize}; margin: 2.5cm; }
body { 
    font-family: 'Traditional Arabic', 'Arial', serif; 
    font-size: 14pt; 
    line-height: 1.8; 
    direction: rtl; 
    text-align: justify;
    mso-bidi-font-family: 'Traditional Arabic';
}
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #000; padding: 8px; }
.footnotes-section { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; }
mark { background-color: #ffff00; }
</style>
</head>
<body>${content}</body>
</html>`;
                                        const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${title}.doc`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        toast({ title: "✅ تم تصدير Word", description: "افتح الملف في Microsoft Word" });
                                    }} title="تصدير Word">
                                        <FileUp className="w-4 h-4 ml-1" />
                                        <span className="hidden sm:inline">Word</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                        const textContent = draftContent.replace(/<[^>]*>/g, '');
                                        navigator.clipboard.writeText(textContent);
                                        toast({ title: "✅ تم النسخ", description: `${textContent.split(/\s+/).filter(Boolean).length} كلمة` });
                                    }} title="نسخ">
                                        <Copy className="w-4 h-4 ml-1" />
                                        <span className="hidden sm:inline">نسخ</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                                        window.print();
                                    }} title="طباعة">
                                        <Printer className="w-4 h-4 ml-1" />
                                        <span className="hidden sm:inline">طباعة</span>
                                    </Button>
                                </div>

                                {/* Center - Word count */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">كلمات: <span className="text-amber-400 font-bold">{draftContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</span></span>
                                    {!sidebarVisible && (
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-indigo-400" onClick={() => setSidebarVisible(true)}>
                                            <LayoutList className="w-3 h-3 ml-1" /> الهيكل
                                        </Button>
                                    )}
                                </div>

                                {/* Left side - Cancel & Save */}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => setEditingNode(null)}>
                                        <X className="w-3 h-3 ml-1" /> إلغاء
                                    </Button>
                                    <Button size="sm" className="h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => {
                                        if (editingNode) {
                                            const targetPhaseId = editingNode.phaseId;
                                            const targetId = editingNode.chapterId || editingNode.taskId;
                                            if (!targetPhaseId || !targetId) return;
                                            if (editingNode.chapterId) {
                                                updateTaskContentMutation.mutate({ phaseId: targetPhaseId, chapterId: targetId, content: editorRef.current?.innerHTML || draftContent, tags: draftTags });
                                            } else if (editingNode.taskId) {
                                                updateTaskContentMutation.mutate({ phaseId: targetPhaseId, taskId: targetId, content: editorRef.current?.innerHTML || draftContent, tags: draftTags });
                                            }
                                            setEditingNode(null);
                                            toast({ title: "✅ تم الحفظ" });
                                        }
                                    }}>
                                        <CheckCircle className="w-3 h-3 ml-1" /> حفظ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar on Right - Document Structure */}
                    <div className={`bg-indigo-950 text-white flex flex-col shrink-0 transition-all duration-300 ${sidebarVisible ? 'w-[250px]' : 'w-0 overflow-hidden'}`}>
                        {/* Sidebar Header with Pin */}
                        <div className="p-3 border-b border-indigo-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-sm">الهيكل البحثي</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 ${sidebarPinned ? 'text-amber-400' : 'text-white/40'} hover:text-amber-400`}
                                    onClick={() => setSidebarPinned(!sidebarPinned)}
                                    title={sidebarPinned ? 'إلغاء التثبيت' : 'تثبيت الشريط'}
                                >
                                    <Star className={`w-3 h-3 ${sidebarPinned ? 'fill-amber-400' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/60 hover:text-white" onClick={() => setSidebarVisible(false)}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Document Structure */}
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {project?.phases.map((phase) => (
                                    <div key={phase.id} className="space-y-0.5">
                                        <div className="flex items-center gap-2 p-2 rounded bg-indigo-900/50 text-xs font-bold">
                                            <Folder className="w-3 h-3 text-amber-400" />
                                            {phase.title}
                                        </div>
                                        {phase.chapters?.map((chapter) => (
                                            <div
                                                key={chapter.id}
                                                className={`flex items-center gap-2 p-2 mr-3 rounded text-[10px] cursor-pointer transition ${editingNode?.chapterId === chapter.id ? 'bg-amber-500 text-black font-bold' : 'hover:bg-indigo-800'}`}
                                                onClick={() => {
                                                    setEditingNode({ phaseId: phase.id, chapterId: chapter.id });
                                                    setDraftContent(chapter.content || '');
                                                    setDraftTags(chapter.tags || []);
                                                }}
                                            >
                                                <FileText className="w-3 h-3" />
                                                {chapter.title}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Sidebar Footer - Simplified */}
                        <div className="p-3 border-t border-indigo-800 text-center">
                            <p className="text-[10px] text-white/40">انقر على أي فصل للتحرير</p>
                        </div>
                    </div>
                </div>
            )}


            {/* Setup Project Dialog */}
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-white text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <GraduationCap className="w-8 h-8 text-amber-300" />
                        </div>
                        <DialogTitle className="text-2xl font-black">{project ? 'إعدادات المشروع' : 'إعداد الخطة البحثية 🎓'}</DialogTitle>
                        <p className="text-indigo-200 text-sm mt-2">سوف نساعدك في تنظيم وإدارة رسالتك العلمية بكفاءة عالية</p>
                    </div>
                    <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-gray-700 text-xs">عنوان الرسالة / البحث</Label>
                            <Input name="title" placeholder="مثال: تحليل البيانات الضخمة في قطاع..." className="h-12 bg-gray-50 border-0 text-right font-bold" />
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
                                <Input name="startDate" type="date" className="h-12 bg-gray-50 border-0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700 text-xs">الموعد النهائي</Label>
                                <Input name="deadline" type="date" className="h-12 bg-gray-50 border-0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-gray-700 text-xs">قالب المشروع (اختياري)</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger className="h-12 bg-gray-50 border-0 text-right">
                                    <SelectValue placeholder="اختر نوع القالب..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">فارغ (مخصص)</SelectItem>
                                    <SelectItem value="masters">رسالة ماجستير (5 فصول)</SelectItem>
                                    <SelectItem value="phd">أطروحة دكتوراه (8 فصول)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                disabled={createProjectMutation.isPending}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70"
                            >
                                {createProjectMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    project ? 'حفظ التعديلات' : 'بدء البرنامج البحثي 🚀'
                                )}
                            </Button>
                            {project && (
                                <Button type="button" variant="outline" onClick={handleDownloadBackup} className="w-full h-12 rounded-2xl border-dashed border-2 border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50">
                                    <Download className="w-4 h-4 ml-2" /> تحميل نسخة احتياطية (JSON)
                                </Button>
                            )}
                        </div>
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
                        const newCircle = {
                            title: fd.get('title') as string,
                            date: fd.get('date') as string,
                            notes: fd.get('notes') as string,
                            completed: false
                        };
                        createCircleMutation.mutate(newCircle);
                        setIsSessionOpen(false);
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
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4" dir="rtl">
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
                <DialogContent className="w-[95vw] sm:max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl p-4" dir="rtl">
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
                <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto flex flex-col p-0 rounded-3xl border-0 shadow-2xl" dir="rtl">
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
                <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4" dir="rtl">
                    <DialogHeader><DialogTitle className="text-right">عنوان صندوق النص الجديد</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            className="text-right"
                            placeholder="العنوان..."
                        />
                        <Button onClick={() => {
                            if (project && project.phases && project.phases.length > 0) {
                                addChapter(project.phases[0].id, newChapterTitle || 'صندوق نص جديد');
                                setIsNewChapterOpen(false);
                            }
                        }} className="w-full bg-indigo-600">إضافة</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

