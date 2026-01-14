import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AcademicEditorToolbar } from './academic/AcademicEditorToolbar';
import { Button } from '@/components/ui/button';
import mammoth from 'mammoth';
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
    PenTool, Timer, Star, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, GripVertical, X,
    LayoutList, LayoutDashboard, Download, StickyNote, Library,
    History, Users as UsersIcon, Link as LinkIcon, Settings, Sparkles,
    Printer, Bold, Italic, Underline, Strikethrough, Palette, Type, AlignLeft, AlignCenter, AlignRight,
    Share2, Pencil, Trash, FileUp, Copy, Square, Circle, Minus, RectangleHorizontal,
    Folder, FolderOpen, CheckSquare, Undo, Redo, AlignJustify, LayoutGrid, MessageSquare, Footprints
} from 'lucide-react';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { useToast } from '@/hooks/use-toast';
import { QuickNotes } from '@/components/logistics/QuickNotes';
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
import { Capacitor } from '@capacitor/core';
import {
    ResearchProject,
    ResearchPhase,
    ResearchChapter,
    ResearchTask,
    SubTask,
    ResearchCircle,
    ResearchMaterial
} from '@/types/academic';
import { AddMaterialDialog } from './academic/AddMaterialDialog';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



function SortablePhaseItem({ id, children }: { id: string; children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-1 group/sortable">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="mt-2 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 p-1 transition-colors">
                <GripVertical className="w-4 h-4" />
            </div>
            {/* Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}


const STORAGE_KEYS = {
    PROJECT: 'my_research_project_v2',
};

export default function AcademicManager({ onClose }: { onClose?: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isAndroid = Capacitor.getPlatform() === 'android';

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
    const [editingNote, setEditingNote] = useState<{ id: number; originContent: string } | null>(null);
    const { updateNote } = useQuickNotes();
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
    const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
    const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
    const [exportFilename, setExportFilename] = useState('');

    // Editor state
    const [editorZoom, setEditorZoom] = useState(100);
    const [lineSpacing, setLineSpacing] = useState(1.8);
    const [showComments, setShowComments] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [formatPainterActive, setFormatPainterActive] = useState(false);
    const [painterStyles, setPainterStyles] = useState<any>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
    const [pages, setPages] = useState<string[]>(['']); // Array of page contents
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [textDirection, setTextDirection] = useState<'rtl' | 'ltr' | 'auto'>('auto');

    // Page dimensions in mm (converted to pixels at 96 DPI)
    const pageSizes = {
        A4: { width: 210, height: 297, pxHeight: 1000 },
        A5: { width: 148, height: 210, pxHeight: 700 },
        Letter: { width: 216, height: 279, pxHeight: 950 }
    };

    // Editor refs
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const wordInputRef = useRef<HTMLInputElement>(null);
    const lastEditingNodeId = useRef<string | null>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);

    // Alias for compatibility
    const editorRef = { current: pageRefs.current[activePageIndex] || null };
    const currentPage = pages.length;

    // Initialize editor content when editingNode changes
    useEffect(() => {
        if (editingNode && pageRefs.current[0]) {
            const currentId = editingNode.chapterId || editingNode.taskId || '';
            if (lastEditingNodeId.current !== currentId) {
                // Load content into first page
                setPages([draftContent || '']);
                setActivePageIndex(0);
                lastEditingNodeId.current = currentId;
            }
        }
    }, [editingNode, draftContent]);

    // Function to add a new page
    const addNewPage = () => {
        setPages(prev => [...prev, '']);
        const newIndex = pages.length;
        setActivePageIndex(newIndex);
        setTimeout(() => {
            const pageEl = document.getElementById(`editor-page-${newIndex}`);
            if (pageEl) {
                pageEl.focus();
                // Move cursor to start
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(pageEl, 0);
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 50);
        toast({ title: `✅ تم إضافة صفحة ${newIndex + 1}` });
    };

    const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });

            if (result.value) {
                const importedContent = result.value;
                // Add as a new chapter in the first phase
                if (project && project.phases.length > 0) {
                    const phaseId = project.phases[0].id;
                    const chapterTitle = file.name.replace('.docx', '').replace('.doc', '') || 'ملف مستورد';

                    // Call the addChapter logic (assuming addChapterMutation is used inside addChapter wrapper or direct mutation)
                    // Since addChapter is a function wrapper in this file:
                    addChapter(phaseId, chapterTitle, importedContent); // Assuming addChapter accepts content
                    toast({ title: "✅ تم استيراد ملف Word بنجاح" });
                } else {
                    toast({ title: "⚠️ لا توجد مراحل لإضافة الملف إليها" });
                }
            }
        } catch (error) {
            console.error(error);
            toast({ title: "❌ فشل استيراد ملف Word", variant: "destructive" });
        }

        // Reset input
        e.target.value = '';
    };

    // Ref to keep track of pages for sync operations
    const pagesRef = useRef<string[]>(pages);
    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    const pagintationTimeoutRef = useRef<NodeJS.Timeout>();

    // --- Pagination Logic ---
    const checkOverflowAndPaginate = (startPageIndex: number, currentPages: string[]) => {
        const maxHeight = pageSizes[pageSize].pxHeight - 80; // Subtract padding
        let updatedPages = [...currentPages];
        let hasChanges = false;

        const maxPagesToCheck = 50;
        const measureDiv = document.createElement('div');
        measureDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${pageSizes[pageSize].width}mm; 
            font-family: 'Traditional Arabic', serif;
            font-size: 18px;
            line-height: ${lineSpacing};
            padding: 20mm;
            direction: rtl;
            box-sizing: border-box;
        `;
        document.body.appendChild(measureDiv);

        try {
            for (let i = startPageIndex; i < updatedPages.length && i < startPageIndex + maxPagesToCheck; i++) {
                const content = updatedPages[i];
                measureDiv.innerHTML = content;
                if (measureDiv.scrollHeight > maxHeight) {
                    hasChanges = true;
                    const elements = content.split(/(<\/p>|<\/div>|<br\s*\/?>)/gi);
                    let fitContent = '';
                    let moveContent = '';
                    let overflowDetected = false;
                    measureDiv.innerHTML = '';
                    for (const el of elements) {
                        if (!el) continue;
                        if (!overflowDetected) {
                            const prevHtml = measureDiv.innerHTML;
                            measureDiv.innerHTML += el;
                            if (measureDiv.scrollHeight > maxHeight) {
                                overflowDetected = true;
                                measureDiv.innerHTML = prevHtml;
                                fitContent = prevHtml;
                                moveContent = el;
                            }
                        } else {
                            moveContent += el;
                        }
                    }
                    if (overflowDetected && moveContent) {
                        updatedPages[i] = fitContent;
                        if (i === updatedPages.length - 1) {
                            updatedPages.push(moveContent);
                        } else {
                            updatedPages[i + 1] = moveContent + (updatedPages[i + 1] || '');
                        }
                    }
                }
            }
        } finally {
            document.body.removeChild(measureDiv);
        }

        if (hasChanges) {
            setPages(updatedPages);
            const allContent = updatedPages.join('<div style="page-break-after:always;"></div>');
            setDraftContent(allContent);
        }
    };

    // --- Smart Footnote System (Per-Page Numbering) ---
    const reorderFootnotes = useCallback(() => {
        // Iterate through all pages and reorder footnotes for each page independently
        pageRefs.current.forEach((editor, pageIdx) => {
            if (!editor) return;

            // 1. Find all markers in this specific page
            const markers = Array.from(editor.querySelectorAll('.footnote-marker'));
            const footnotesSection = editor.querySelector('.footnotes-section');

            if (markers.length === 0) {
                if (footnotesSection) footnotesSection.remove();
                return;
            }

            // 2. Ensure footnotes section exists for this page
            let section = footnotesSection as HTMLElement;
            if (!section) {
                section = document.createElement('div');
                section.className = 'footnotes-section';
                section.style.cssText = 'margin-top:auto;padding-top:12px;border-top:1px solid #444;direction:rtl;margin-top:25px;';
                section.innerHTML = '<p style="font-weight:bold;color:#1a237e;font-size:11px;margin-bottom:5px;border-bottom:1px solid #eee;padding-bottom:2px;opacity:0.6;">الحواشي</p>';
                editor.appendChild(section);
            }

            // Save contents to prevent data loss
            const noteContents: { [key: string]: string } = {};
            section.querySelectorAll('.footnote-item').forEach(item => {
                const id = item.getAttribute('data-note-id');
                const span = item.querySelector('.note-text');
                if (id && span) noteContents[id] = span.innerHTML;
            });

            // Clear items but keep header
            section.innerHTML = '<p style="font-weight:bold;color:#1a237e;font-size:11px;margin-bottom:5px;border-bottom:1px solid #eee;padding-bottom:2px;opacity:0.6;">الحواشي</p>';

            // 3. Re-number and link per page (always start from 1)
            markers.forEach((marker, idx) => {
                const num = idx + 1;
                const noteId = marker.getAttribute('data-note-id') || `note-${pageIdx}-${num}-${Math.random().toString(36).substr(2, 4)}`;

                // Update marker
                marker.setAttribute('data-note-id', noteId);
                marker.setAttribute('id', `ref-${noteId}`);
                marker.innerHTML = `[${num}]`;
                (marker as HTMLElement).style.cssText = 'color:#d97706;cursor:pointer;font-weight:bold;font-size:0.8em;vertical-align:super;margin:0 1px;';

                // Direct jump to bottom note
                (marker as HTMLElement).onclick = (e) => {
                    e.preventDefault();
                    document.getElementById(`bottom-${noteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };

                // Add to section
                const item = document.createElement('div');
                item.className = 'footnote-item';
                item.id = `bottom-${noteId}`;
                item.setAttribute('data-note-id', noteId);
                item.style.cssText = 'font-size:11px;color:#333;margin-bottom:2px;display:flex;gap:5px;line-height:1.4;';

                const numBtn = document.createElement('span');
                numBtn.innerHTML = `[${num}]`;
                numBtn.style.cssText = 'font-weight:bold;color:#d97706;cursor:pointer;min-width:18px;';
                numBtn.onclick = () => {
                    document.getElementById(`ref-${noteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };

                const textSpan = document.createElement('span');
                textSpan.className = 'note-text';
                textSpan.contentEditable = 'true';
                textSpan.style.cssText = 'flex:1;outline:none;border-bottom:1px hidden #eee;';
                textSpan.innerHTML = noteContents[noteId] || 'نص الحاشية...';

                item.appendChild(numBtn);
                item.appendChild(textSpan);
                section.appendChild(item);
            });
        });
    }, []);

    // --- Core Sync and Pagination ---
    const handlePageInput = useCallback((index: number, content: string) => {
        const newPages = [...pagesRef.current];
        newPages[index] = content;

        // Update pages state
        setPages(newPages);

        // Sync with comprehensive draft content (combined pages)
        const allContent = newPages.join('<div style="page-break-after:always;"></div>');
        setDraftContent(allContent);

        // Debounce heavy operations (Pagination & Footnote Reordering)
        if (pagintationTimeoutRef.current) clearTimeout(pagintationTimeoutRef.current);
        pagintationTimeoutRef.current = setTimeout(() => {
            checkOverflowAndPaginate(index, newPages);
            reorderFootnotes();
        }, 500);
    }, [reorderFootnotes]);


    const insertFootnote = () => {
        const uniqueId = `note-${activePageIndex}-${Date.now()}`;
        const marker = `<sup class="footnote-marker" data-note-id="${uniqueId}">[?]</sup>`;
        document.execCommand('insertHTML', false, marker);
        // Small delay to ensure marker is in DOM
        setTimeout(reorderFootnotes, 10);
        toast({ title: "✅ تمت إضافة حاشية جديدة" });
    };


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
        mutationFn: (data: { phaseId: string; title: string; content?: string }) => AcademicService.createChapter(data.phaseId, data.title, data.content),
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

    const addChapter = (phaseId: string, title: string, content?: string) => {
        if (!title.trim()) return;
        createChapterMutation.mutate({ phaseId, title, content });
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
        // Use print-based export for better quality, margins, and footnotes
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({ title: "⚠️ تم حظر النافذة المنبثقة", description: "اسمح بالنوافذ المنبثقة للتصدير", variant: "destructive" });
            return;
        }
        const title = exportFilename || project?.title || 'Research Project';

        printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { size: A4; margin: 2.5cm; }
body { 
    font-family: 'Traditional Arabic', 'Arial', serif; 
    font-size: 14pt; 
    line-height: 1.8; 
    direction: rtl; 
    text-align: justify;
    margin: 0;
    padding: 20px;
    color: #000;
}
h1 { font-size: 24pt; text-align: center; margin-bottom: 40px; }
h2 { font-size: 18pt; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }
h3 { font-size: 16pt; margin-top: 20px; color: #333; }
p { margin-bottom: 15px; }
.footnotes-section { 
    margin-top: 50px; 
    padding-top: 20px; 
    border-top: 1px solid #000; 
    font-size: 10pt;
}
@media print {
    body { padding: 0; }
    button { display: none; }
}
</style>
</head>
<body>
    ${exportContent}
    <script>
        window.onload = function() { 
            setTimeout(function() { 
                window.print(); 
                // Optional: window.close(); 
            }, 800); 
        };
    </script>
</body>
</html>`);
        printWindow.document.close();
        toast({ title: "✅ تم تجهيز ملف PDF", description: "سيظهر مربع حوار الطباعة..." });
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

        // Default to ALL chapters if none selected
        const exportAll = selectedForExport.size === 0;

        // Generate Hierarchical HTML for the editor
        let html = `<div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; padding: 40px; color: #1f2937;">`;
        html += `<h1 style="text-align: center; color: #3730a3; margin-bottom: 20px; font-size: 28px; font-weight: 800;">${project.title}</h1>`;
        html += `<p style="text-align: center; color: #6b7280; margin-bottom: 40px; font-size: 14px;">${project.institution} | المشرف: ${project.supervisor}</p>`;
        html += `<hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 30px 0;" />`;

        project.phases.forEach((phase, index) => {
            const selectedChapters = (phase.chapters || []).filter(c => exportAll || selectedForExport.has(c.id));

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
        setExportFilename(project.title || 'Research_Project');
        setIsInternalExportOpen(true);
    };

    const handleWordExport = async () => {
        if (!project) {
            toast({ title: "❌ لا يوجد مشروع للتصدير", variant: "destructive" });
            return;
        }

        // Get content from export preview if available, otherwise use project content
        const exportPreviewContent = document.getElementById('export-content-area')?.innerHTML;
        const useExportPreview = exportPreviewContent && exportPreviewContent.trim().length > 0;

        const exportAll = selectedForExport.size === 0;
        const children: Paragraph[] = [];

        // Title
        children.push(new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 400 }
        }));

        // Metadata
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: `المشرف: ${project.supervisor} | المؤسسة: ${project.institution}`,
                    size: 24,
                    color: '666666',
                    rightToLeft: true
                })
            ],
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 600 }
        }));

        // If using export preview, extract text from it
        if (useExportPreview) {
            // Convert HTML to paragraphs more intelligently
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = exportPreviewContent || '';

            // Extract text by processing each element
            const processElement = (element: HTMLElement) => {
                const tagName = element.tagName?.toLowerCase();
                const text = element.textContent?.trim() || '';

                if (!text) return;

                if (tagName === 'h1' || tagName === 'h2') {
                    children.push(new Paragraph({
                        text: text,
                        heading: tagName === 'h1' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                        bidirectional: true,
                        spacing: { before: 300, after: 150 }
                    }));
                } else if (tagName === 'h3') {
                    children.push(new Paragraph({
                        text: text,
                        heading: HeadingLevel.HEADING_3,
                        bidirectional: true,
                        spacing: { before: 200, after: 100 }
                    }));
                } else if (tagName === 'p' || tagName === 'div') {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: text, size: 24, rightToLeft: true })],
                        bidirectional: true,
                        spacing: { after: 200 }
                    }));
                }
            };

            // Process all children
            Array.from(tempDiv.querySelectorAll('h1, h2, h3, p, div')).forEach(el => {
                processElement(el as HTMLElement);
            });

            // If no structured content found, use plain text
            if (children.length <= 2) {
                const plainText = tempDiv.textContent?.trim() || '';
                if (plainText) {
                    // Split by newlines and create paragraphs
                    plainText.split(/\n+/).filter(p => p.trim()).forEach(para => {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: para.trim(), size: 24, rightToLeft: true })],
                            bidirectional: true,
                            spacing: { after: 200 }
                        }));
                    });
                }
            }
        } else {
            // Use project phases and chapters directly
            project.phases.forEach((phase, pIndex) => {
                const selectedChapters = (phase.chapters || []).filter(c => exportAll || selectedForExport.has(c.id));
                if (selectedChapters.length > 0) {
                    children.push(new Paragraph({
                        text: `المرحلة ${pIndex + 1}: ${phase.title}`,
                        heading: HeadingLevel.HEADING_1,
                        bidirectional: true,
                        spacing: { before: 400, after: 200 }
                    }));

                    selectedChapters.forEach((chapter, cIndex) => {
                        children.push(new Paragraph({
                            text: `${cIndex + 1}. ${chapter.title}`,
                            heading: HeadingLevel.HEADING_2,
                            bidirectional: true,
                            spacing: { before: 200, after: 100 }
                        }));

                        // Better HTML to Text conversion
                        const htmlContent = chapter.content || '';
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = htmlContent;

                        // Extract text preserving some structure
                        const cleanText = tempDiv.textContent?.trim() || '(لا يوجد محتوى نصي)';

                        // Split into paragraphs
                        cleanText.split(/\n+/).filter(p => p.trim()).forEach(para => {
                            children.push(new Paragraph({
                                children: [new TextRun({ text: para.trim(), size: 24, rightToLeft: true })],
                                bidirectional: true,
                                spacing: { after: 200 }
                            }));
                        });
                    });
                }
            });
        }

        // Check if we have any content
        if (children.length <= 2) {
            toast({ title: "⚠️ لا يوجد محتوى للتصدير", description: "يرجى إضافة محتوى أولاً", variant: "destructive" });
            return;
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440, // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children
            }]
        });

        try {
            const blob = await Packer.toBlob(doc);
            // Generate proper filename with fallback
            const baseFilename = (exportFilename?.trim() || project.title || 'بحث_أكاديمي')
                .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
                .trim();
            const fileName = baseFilename.endsWith('.docx') ? baseFilename : `${baseFilename}.docx`;

            saveAs(blob, fileName);
            toast({ title: "✅ تم تحميل ملف Word", description: fileName });
        } catch (err) {
            console.error('Word export error:', err);
            toast({ title: "❌ فشل التصدير", description: "تحقق من المحتوى وحاول مجدداً", variant: "destructive" });
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
        <div className="space-y-4 bg-gray-50/30 p-2 sm:p-4 pb-32" dir="rtl">
            {/* Header section (Mobile Optimized) */}
            {project && (
                <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-xl p-3 sm:p-4 text-white shadow-lg relative overflow-hidden">
                    {/* Header Controls */}
                    <div className="absolute top-2 left-2 z-20 flex gap-2">
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                <Button size="sm" onClick={() => wordInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4 rounded-xl shadow-lg shadow-emerald-200/50 mr-2">
                                    <FileUp className="w-4 h-4 ml-1" /> استيراد Word
                                </Button>
                            </>
                        )}

                    </div>
                </div>

                {/* --- Drafts Tab (Folder View) --- */}
                <TabsContent value="drafts" className="mt-0 focus-visible:outline-none pb-32">
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
                                                            {chapter.content
                                                                ? chapter.content.replace(/<[^>]*>/g, '').substring(0, 200) + (chapter.content.length > 200 ? '...' : '')
                                                                : 'انقر للكتابة...'}
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
                <TabsContent value="plan" className="space-y-6 focus-visible:outline-none pb-32">
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
                {/* --- Library Tab --- */}
                <TabsContent value="materials" className="focus-visible:outline-none pb-24">
                    <Card className="border-0 shadow-sm ring-1 ring-black/5 min-h-[60vh] bg-gray-50/50">
                        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Library className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-none">المكتبة والمراجع</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">إدارة المصادر والمراجع العلمية ({project?.materials.length || 0})</p>
                                </div>
                            </div>
                            <Button onClick={() => setIsAddMaterialOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4 rounded-xl shadow-lg shadow-indigo-200/50">
                                <Plus className="w-4 h-4 ml-2" /> إضافة مرجع
                            </Button>
                        </CardHeader>

                        <CardContent className="p-4">
                            {(project?.materials || []).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(project?.materials || []).map((mat) => (
                                        <div key={mat.id} className="group bg-white rounded-xl border border-gray-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all p-4 flex flex-col relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{mat.type === 'book' ? '📕' : mat.type === 'paper' ? '📄' : '🔗'}</span>
                                                    <Badge variant="outline" className="text-[10px] bg-gray-50">{mat.type === 'book' ? 'كتاب' : mat.type === 'paper' ? 'ورقة' : 'موقع'}</Badge>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 -mt-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                                    if (confirm('حذف المرجع؟')) deleteMaterialMutation.mutate(mat.id);
                                                }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <h4 className="font-bold text-gray-800 leading-snug mb-1 line-clamp-2" title={mat.title}>{mat.title}</h4>
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{mat.author} {mat.year && `(${mat.year})`}</p>

                                            <div className="flex flex-wrap gap-1 mt-auto">
                                                {mat.publisher && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{mat.publisher}</span>}
                                                <Badge variant={mat.status === 'read' ? 'default' : 'secondary'} className={`text-[9px] h-5 cursor-pointer ${mat.status === 'read' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-gray-200'}`} onClick={() => {
                                                    updateMaterialMutation.mutate({ id: mat.id, updates: { status: mat.status === 'read' ? 'to_read' : 'read' } });
                                                }}>
                                                    {mat.status === 'read' ? 'تمت القراءة' : 'قيد الانتظار'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                                        <Library className="w-10 h-10 text-indigo-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">مكتبة البحث فارغة</h3>
                                    <p className="text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">قم بإضافة المراجع والكتب والأوراق البحثية لتنظيم مصادرك والاقتباس منها بسهولة أثناء الكتابة.</p>
                                    <Button onClick={() => setIsAddMaterialOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-full shadow-lg shadow-indigo-100">
                                        <Plus className="w-4 h-4 ml-2" /> إضافة أول مرجع
                                    </Button>
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

                {/* Bottom Navigation Bar - Inside Tabs to ensure sync */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-[100] flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe-area">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('drafts')}
                        className={`flex flex-col items-center gap-0.5 h-12 px-3 rounded-xl transition-all ${activeTab === 'drafts' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <StickyNote className={`w-5 h-5 ${activeTab === 'drafts' ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">النصوص</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('plan')}
                        className={`flex flex-col items-center gap-0.5 h-12 px-3 rounded-xl transition-all ${activeTab === 'plan' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutList className={`w-5 h-5 ${activeTab === 'plan' ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">الهيكل</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('materials')}
                        className={`flex flex-col items-center gap-0.5 h-12 px-3 rounded-xl transition-all ${activeTab === 'materials' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Library className={`w-5 h-5 ${activeTab === 'materials' ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">المكتبة</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('timeline')}
                        className={`flex flex-col items-center gap-0.5 h-12 px-3 rounded-xl transition-all ${activeTab === 'timeline' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <History className={`w-5 h-5 ${activeTab === 'timeline' ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">الجدول</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('stats')}
                        className={`flex flex-col items-center gap-0.5 h-12 px-3 rounded-xl transition-all ${activeTab === 'stats' ? 'text-amber-600 bg-amber-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <BarChart2 className={`w-5 h-5 ${activeTab === 'stats' ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">الإحصائيات</span>
                    </Button>
                </div>
            </Tabs >




            {/* --- Dialogs --- */}

            {/* Editor Dialog - Full Screen Professional Layout */}
            {/* Other Dialogs */}
            <AddMaterialDialog
                isOpen={isAddMaterialOpen}
                onClose={() => setIsAddMaterialOpen(false)}
                onAdd={(material) => {
                    addMaterialMutation.mutate(material);
                }}
            />
            <GlobalSearch />
            {editingNode && (
                /* Unified Full Editor for All Devices */
                <div className="fixed inset-0 z-[200] bg-slate-800 flex flex-row-reverse animate-in fade-in" dir="rtl">
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
                    {/* Word Input - Moved to top for reliability */}
                    <input
                        type="file"
                        ref={wordInputRef}
                        onChange={handleWordImport}
                        className="hidden"
                        accept=".docx"
                    />

                    {/* Sidebar Toggle Button - Always visible at top right */}
                    <button
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                        className="fixed right-4 top-20 z-[100] bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg shadow-xl transition-all hover:scale-105"
                        title={sidebarVisible ? "إخفاء الشريط الجانبي" : "إظهار الشريط الجانبي"}
                    >
                        {sidebarVisible ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* Main Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Full-Width Toolbar - Always fills available width */}
                        <AcademicEditorToolbar
                            sidebarVisible={sidebarVisible}
                            formatPainterActive={formatPainterActive}
                            setFormatPainterActive={setFormatPainterActive}
                            setPainterStyles={setPainterStyles}
                            editorZoom={editorZoom}
                            setEditorZoom={setEditorZoom}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            currentPage={currentPage}
                            lineSpacing={lineSpacing}
                            setLineSpacing={setLineSpacing}
                            pdfInputRef={pdfInputRef}
                            addNewPage={addNewPage}
                            insertFootnote={insertFootnote}
                            showComments={showComments}
                            setShowComments={setShowComments}
                            setIsQuickNotesOpen={setIsQuickNotesOpen}
                            textDirection={textDirection}
                            setTextDirection={setTextDirection}
                        />

                        {/* Page Container with Bottom Toolbar */}
                        <div className="flex-1 bg-gradient-to-br from-amber-100/60 via-stone-200 to-slate-300 overflow-auto flex flex-col items-center p-8 pb-20 relative">



                            {/* Page Area - Multiple Pages */}
                            <div className="flex-1 flex flex-col items-center gap-8 py-4">
                                <div ref={pagesContainerRef} style={{ transform: `scale(${editorZoom / 100})`, transformOrigin: 'top center' }} className="transition-transform duration-200 flex flex-col gap-8">
                                    {pages.map((pageContent, pageIndex) => (
                                        <div key={pageIndex} className="relative">
                                            {/* Page Separator Label */}
                                            {pageIndex > 0 && (
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                                                    ── صفحة {pageIndex + 1} ──
                                                </div>
                                            )}
                                            {/* A4 Page Box */}
                                            <div
                                                className={`bg-white shadow-2xl relative cursor-text ${activePageIndex === pageIndex ? 'ring-2 ring-indigo-400' : ''}`}
                                                style={{
                                                    width: `${pageSizes[pageSize].width}mm`,
                                                    minHeight: `${pageSizes[pageSize].height}mm`,
                                                    maxHeight: `${pageSizes[pageSize].height}mm`,
                                                    padding: '20mm',
                                                    direction: 'rtl',
                                                    boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
                                                    overflow: 'hidden'
                                                }}
                                                onClick={() => setActivePageIndex(pageIndex)}
                                            >
                                                {/* Editable Content */}
                                                <div
                                                    ref={el => pageRefs.current[pageIndex] = el}
                                                    id={`editor-page-${pageIndex}`}
                                                    contentEditable={true}
                                                    suppressContentEditableWarning={true}
                                                    dangerouslySetInnerHTML={{ __html: pageContent }}
                                                    className="outline-none h-full focus:outline-none overflow-hidden flex flex-col"
                                                    dir="rtl"
                                                    style={{
                                                        direction: 'rtl',
                                                        textAlign: 'right',
                                                        writingMode: 'horizontal-tb',
                                                        caretColor: '#d97706',
                                                        lineHeight: lineSpacing,
                                                        fontFamily: "'Amiri', 'Traditional Arabic', 'Tajawal', 'Arial', serif",
                                                        fontSize: '18px',
                                                    }}


                                                    onFocus={() => setActivePageIndex(pageIndex)}

                                                    onInput={(e) => {
                                                        handlePageInput(pageIndex, e.currentTarget.innerHTML);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.ctrlKey || e.metaKey) {
                                                            switch (e.key.toLowerCase()) {
                                                                case 'b': e.preventDefault(); document.execCommand('bold', false, null as any); break;
                                                                case 'i': e.preventDefault(); document.execCommand('italic', false, null as any); break;
                                                                case 'u': e.preventDefault(); document.execCommand('underline', false, null as any); break;
                                                                case 's':
                                                                    e.preventDefault();
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
                                                                    e.preventDefault();
                                                                    document.execCommand(e.shiftKey ? 'redo' : 'undo', false);
                                                                    break;
                                                                case 'y': e.preventDefault(); document.execCommand('redo', false); break;
                                                                case '=':
                                                                case '+': e.preventDefault(); setEditorZoom(z => Math.min(200, z + 10)); break;
                                                                case '-': e.preventDefault(); setEditorZoom(z => Math.max(50, z - 10)); break;
                                                                case '0': e.preventDefault(); setEditorZoom(100); break;
                                                                case 'm':
                                                                    e.preventDefault();
                                                                    setIsQuickNotesOpen(true);
                                                                    break;
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        fontFamily: 'Arial, "Traditional Arabic", "Tajawal", sans-serif',
                                                        fontSize: '18px',
                                                        lineHeight: '1.8',
                                                        textAlign: 'justify',
                                                        direction: 'rtl',
                                                        unicodeBidi: 'embed',
                                                        caretColor: '#d97706',
                                                        minHeight: `calc(${pageSizes[pageSize].height}mm - 40mm)`,
                                                        writingMode: 'horizontal-tb'
                                                    }}
                                                />
                                                {/* Page Number */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400">- {pageIndex + 1} -</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Page Button */}
                                    <button
                                        onClick={addNewPage}
                                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        إضافة صفحة جديدة
                                    </button>
                                </div>
                            </div>

                            {/* Footer Bar - Unified with all actions */}
                            <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-600 flex justify-between items-center shrink-0" dir="rtl">
                                {/* Right side - Export buttons with clear colors */}
                                <div className="flex items-center gap-2">
                                    {/* PDF Button - Red */}
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                                        onClick={() => {
                                            // Get title from chapter, task, or project
                                            const chapterTitle = getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title;
                                            const title = chapterTitle || project?.title || 'بحث_أكاديمي';
                                            // Collect content from all pages for multi-page export
                                            const content = Array.isArray(pages) && pages.length > 0 ? pages.join('<div style="page-break-after:always;margin-top:40px;"></div>') : draftContent;


                                            // Open a new window for printing
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { size: ${pageSize}; margin: 2.5cm; }
* { box-sizing: border-box; }
body {
    font-family: 'Traditional Arabic', 'Arial', serif;
    font-size: 14pt;
    line-height: ${lineSpacing};
    direction: rtl;
    text-align: justify;
    margin: 0;
    padding: 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
h1, h2, h3 { text-align: center; margin: 20px 0; }
table { border-collapse: collapse; width: 100%; margin: 15px 0; border: 1px solid #000; }
td, th { border: 1px solid #000; padding: 10px; text-align: right; }
th { background: #f0f0f0 !important; font-weight: bold; }
a { text-decoration: none; color: black; }
.footnotes-section {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #000;
    font-size: 10pt;
}
.footnote-marker { font-size: 0.8em; vertical-align: super; font-weight: bold; }
ul, ol { padding-right: 25px; margin: 10px 0; }
@media print {
    body { padding: 0; margin: 0; }
    .no-print { display: none; }
}
</style>
</head>
<body>
    <h1 style="text-align:center; margin-bottom: 40px;">${title}</h1>
    ${content}
    <script>
        window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); };
    </script>
</body>
</html>`);
                                                printWindow.document.close();
                                            } else {
                                                toast({ title: "⚠️ تم حظر النافذة المنبثقة", description: "اسمح بالنوافذ المنبثقة للطباعة" });
                                            }
                                        }} title="تصدير PDF">
                                        <FileText className="w-4 h-4 ml-1" />
                                        PDF
                                    </Button>

                                    {/* Word Button - Blue */}
                                    <Button size="sm" className="h-9 px-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg" onClick={() => {
                                        // Get title from chapter, task, or project
                                        const chapterTitle = getChapterOrTaskById(editingNode?.phaseId || '', editingNode?.chapterId, editingNode?.taskId)?.title;
                                        const title = chapterTitle || project?.title || 'بحث_أكاديمي';
                                        // Clean filename - remove special characters
                                        const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '').trim() || 'بحث_أكاديمي';
                                        // Collect content from all pages for Word export
                                        const content = Array.isArray(pages) && pages.length > 0 ? pages.join('<br clear="all" style="page-break-before:always" />') : draftContent;


                                        // Prepare HTML for Word with specific namespaces and XML data for view settings
                                        const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
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
@page {
    size: ${pageSize};
    margin: 2.54cm 2.54cm 2.54cm 2.54cm;
    mso-page-orientation: portrait;
}
body {
    font-family: 'Traditional Arabic', 'Amiri', Arial, sans-serif;
    font-size: 14pt;
    tab-interval: 36.0pt;
    text-align: justify;
    direction: rtl;
}
p {
    margin: 0in 0in 10.0pt 0in;
    line-height: ${lineSpacing * 115}%;
    mso-pagination: widow-orphan;
    font-size: 14.0pt;
    font-family: "Traditional Arabic", "Amiri", "Arial", sans-serif;
    mso-ascii-font-family: "Arial";
    mso-hansi-font-family: "Arial";
    mso-bidi-font-family: "Traditional Arabic";
}
/* Preserve text colors */
span[style*="color"] {
    mso-style-textfill-type: solid;
}
/* Preserve background colors */
span[style*="background"] {
    mso-highlight: yellow;
}
/* Bold text */
b, strong {
    font-weight: bold;
    mso-bidi-font-weight: bold;
}
/* Italic text */
i, em {
    font-style: italic;
    mso-bidi-font-style: italic;
}
/* Underline */
u {
    text-decoration: underline;
    mso-text-underline: single;
}
/* Tables */
table {
    border-collapse: collapse;
    width: 100%;
    mso-yfti-tbllook: 1184;
    mso-padding-alt: 0cm 5.4pt 0cm 5.4pt;
    direction: rtl;
}
td, th {
    border: solid windowtext 1.0pt;
    padding: 0cm 5.4pt 0cm 5.4pt;
    mso-border-alt: solid windowtext .5pt;
    text-align: right;
    direction: rtl;
}
th {
    background: #f0f0f0;
    font-weight: bold;
}
/* Headings */
h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    text-align: center;
    direction: rtl;
}
h1 { font-size: 24pt; margin: 12pt 0; }
h2 { font-size: 18pt; margin: 10pt 0; }
h3 { font-size: 16pt; margin: 8pt 0; }
/* Lists */
ul, ol {
    margin-right: 36pt;
    direction: rtl;
}
/* Footnotes */
.footnotes-section {
    mso-element: footnote-list;
    border-top: 1pt solid black;
    margin-top: 20pt;
    padding-top: 10pt;
}
.footnote-marker {
    vertical-align: super;
    font-size: 0.8em;
}
/* Ensure proper RTL support */
body, table, p, div, span, h1, h2, h3, h4, h5, h6, li {
    mso-bidi-language: AR-SA;
    mso-ascii-font-family: Arial;
    mso-hansi-font-family: Arial;
    mso-bidi-font-family: "Traditional Arabic";
}
/* Preserve inline styles */
*[style] {
    mso-style-priority: 99;
}
</style>

</head>
<body lang=AR-SA style='tab-interval:36.0pt'>
<div class=WordSection1 dir=RTL>
    <p style='text-align:center;font-size:18pt;font-weight:bold'>${title}</p>
    ${content}
</div>
</body>
</html>`;

                                        // Create Blob with UTF-8 BOM
                                        const blob = new Blob(['\ufeff', docContent], {
                                            type: 'application/msword;charset=utf-8'
                                        });

                                        // Trigger download with clean filename
                                        saveAs(blob, `${cleanTitle}.doc`);
                                        toast({ title: "✅ جارٍ التنزيل", description: `تم حفظ الملف: ${cleanTitle}.doc` });

                                    }}>
                                        <FileUp className="w-4 h-4 ml-1" />
                                        Word
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
                                        if (editingNote) {
                                            const content = editorRef.current?.innerHTML || draftContent;
                                            updateNote(editingNote.id, content);
                                            setEditingNote(null);
                                            // Optional: clear pages or keep them?
                                            // User might want to continue or go back.
                                            // Usually clearing is safer to avoid confusion.
                                            setPages(['']);
                                            setDraftContent('');
                                            toast({ title: "✅ تم حفظ الملاحظة وتحديثها" });
                                            return;
                                        }

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
                                {/* Expand/Collapse Actions */}
                                <div className="flex bg-indigo-900/50 rounded-lg p-0.5 mr-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-white/40 hover:text-white"
                                        onClick={() => setOpenFolders(new Set(project?.phases.map(p => p.id) || []))}
                                        title="توسيع الكل"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                    <div className="w-px bg-white/10 my-1"></div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-white/40 hover:text-white"
                                        onClick={() => setOpenFolders(new Set())}
                                        title="طي الكل"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </Button>
                                </div>

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
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent custom-scrollbar" dir="rtl">
                            <div className="p-2 space-y-1">
                                {project?.phases.map((phase) => (
                                    <div key={phase.id} className="space-y-0.5">
                                        {/* Phase Header - Collapsible */}
                                        <div
                                            className="group flex items-center justify-between p-2 rounded bg-indigo-900/50 text-xs font-bold cursor-pointer hover:bg-indigo-800 transition"
                                            onClick={() => toggleFolder(phase.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {openFolders.has(phase.id) ?
                                                    <FolderOpen className="w-3 h-3 text-amber-400" /> :
                                                    <Folder className="w-3 h-3 text-amber-400" />
                                                }
                                                <span>{phase.title}</span>
                                                <ChevronDown className={`w-3 h-3 transition-transform ${openFolders.has(phase.id) ? 'rotate-180' : ''}`} />
                                            </div>
                                            {/* Action Icons on Hover */}
                                            <div className="hidden group-hover:flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenamingNode({ type: 'phase', id: phase.id, title: phase.title });
                                                    }}
                                                    className="p-1 rounded hover:bg-white/20"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chapters - Collapsible Content */}
                                        {openFolders.has(phase.id) && phase.chapters?.map((chapter) => (
                                            <div
                                                key={chapter.id}
                                                className={`group flex items-center justify-between p-2 mr-4 rounded text-[10px] cursor-pointer transition ${editingNode?.chapterId === chapter.id ? 'bg-amber-500 text-black font-bold' : 'hover:bg-indigo-800'}`}
                                                onClick={() => {
                                                    setEditingNode({ phaseId: phase.id, chapterId: chapter.id });
                                                    setDraftContent(chapter.content || '');
                                                    setDraftTags(chapter.tags || []);
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="line-clamp-2 text-ellipsis overflow-hidden leading-tight">{chapter.title}</span>
                                                </div>
                                                {/* Action Icons on Hover */}
                                                <div className="hidden group-hover:flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenamingNode({ type: 'chapter', id: chapter.id, title: chapter.title, parentId: phase.id });
                                                        }}
                                                        className="p-1 rounded hover:bg-white/20"
                                                        title="إعادة التسمية"
                                                    >
                                                        <Edit className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteChapter(phase.id, chapter.id); }}
                                                        className="p-1 rounded hover:bg-red-500/50"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Footer - Simplified */}
                        {/* Sidebar Footer */}
                        <div className="p-3 border-t border-indigo-800 flex flex-col gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] text-white/60 hover:text-white w-full justify-start h-7"
                                onClick={() => setIsNewChapterOpen(true)}
                            >
                                <Plus className="w-3 h-3 ml-2" /> إضافة فصل جديد
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/50 w-full justify-start h-7"
                                onClick={() => wordInputRef.current?.click()}
                            >
                                <FileUp className="w-3 h-3 ml-2" /> استيراد ملف Word
                            </Button>

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
                <DialogContent className="w-[98vw] sm:max-w-7xl max-h-[98vh] overflow-y-auto flex flex-col p-0 rounded-3xl border-0 shadow-2xl" dir="rtl">
                    <div className="bg-slate-900 p-3 text-white shrink-0">
                        {/* Header Row */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <FileUp className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h2 className="text-lg font-black leading-none">محرر التجميع والمسودة النهائية</h2>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-none">تجميع {selectedForExport.size} عناصر</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsInternalExportOpen(false)} className="hover:bg-white/10 rounded-full text-white"><X className="w-6 h-6" /></Button>
                        </div>

                        {/* Full Toolbar - Row 1 */}
                        {/* Unified Toolbar */}
                        <div className="mb-2 sticky top-0 z-50 shadow-sm">
                            <AcademicEditorToolbar
                                sidebarVisible={false}
                                formatPainterActive={false}
                                setFormatPainterActive={() => { }}
                                setPainterStyles={() => { }}
                                editorZoom={100}
                                setEditorZoom={() => { }}
                                pageSize={pageSize}
                                setPageSize={() => { }} // Read-only or fixed in export mode
                                currentPage={1}
                                lineSpacing={1.8}
                                setLineSpacing={() => { }}
                                pdfInputRef={pdfInputRef}
                                addNewPage={() => execCmd('insertHTML', '<div style="page-break-after:always;margin-top:40px;"></div>')} // Simple page break
                                insertFootnote={() => {
                                    // Simple footnote for export editor - simplistic implementation
                                    const note = prompt('نص الحاشية:');
                                    if (note) execCmd('insertHTML', `<sup>[${Date.now().toString().slice(-3)}]</sup> <span style="font-size:10px;color:gray;">(${note})</span>`);
                                }}
                                showComments={false}
                                setShowComments={() => { }}
                                setIsQuickNotesOpen={() => { }}
                                textDirection='rtl'
                                setTextDirection={(dir) => {
                                    const area = document.getElementById('export-content-area');
                                    if (area) area.style.direction = dir;
                                }}
                            />
                        </div>
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

                    <div className="p-4 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                            <Label className="text-[10px] text-gray-400 mb-1 block">اسم الملف عند الحفظ:</Label>
                            <Input
                                value={exportFilename}
                                onChange={(e) => setExportFilename(e.target.value)}
                                className="h-9 text-xs border-indigo-100 focus:ring-indigo-500 rounded-lg text-right"
                                placeholder="مثال: بحث التخرج النهائي"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                            <Button variant="outline" onClick={() => {
                                navigator.clipboard.writeText(document.getElementById('export-content-area')?.innerText || '');
                                toast({ title: "✅ تم النسخ" });
                            }} className="h-10 px-4 rounded-xl font-bold border-gray-200">
                                <Copy className="w-4 h-4 ml-2" /> نص
                            </Button>
                            <Button variant="outline" onClick={handleWordExport} className="h-10 px-4 rounded-xl font-bold border-indigo-100 text-indigo-700 hover:bg-indigo-50">
                                <Download className="w-4 h-4 ml-2" /> Word
                            </Button>
                            <Button onClick={handlePdfExport} className="h-10 px-6 rounded-xl font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100/50">
                                <Printer className="w-4 h-4 ml-2" /> PDF
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
            {/* Quick Notes Dialog */}
            <Dialog open={isQuickNotesOpen} onOpenChange={setIsQuickNotesOpen}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                    <div className="flex-1 overflow-hidden p-4">
                        <QuickNotes onEditInMainEditor={(note) => {
                            setEditingNote({ id: note.id, originContent: note.content });
                            setPages([note.content]);
                            setDraftContent(note.content);
                            setIsQuickNotesOpen(false);
                            // Set editingNode to null to avoid conflict
                            setEditingNode(null);
                            toast({ title: "تم فتح الملاحظة في المحرر" });
                        }} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

