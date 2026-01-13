import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    ChevronRight, ChevronDown, ChevronLeft, Folder, FolderOpen, FileText,
    Plus, Trash2, Edit2, GripVertical, CheckCircle, Clock, AlertCircle,
    PanelLeftClose, PanelLeft, MoreVertical, BookOpen, ListTodo
} from 'lucide-react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ResearchProject, ResearchPhase, ResearchChapter, ResearchTask, SubTask } from '../AcademicManager';
import { cn } from '@/lib/utils';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface AcademicSidebarProps {
    project: ResearchProject | null;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onSelectNode: (node: { type: 'phase' | 'chapter' | 'task', id: string, phaseId?: string, chapterId?: string }) => void;
    selectedNodeId: string | null;
    onAddPhase: () => void;
    onAddChapter: (phaseId: string) => void;
    onAddTask: (chapterId: string) => void;
    onDeletePhase: (phaseId: string) => void;
    onDeleteChapter: (phaseId: string, chapterId: string) => void;
    onDeleteTask: (chapterId: string, taskId: string) => void;
    onRenameNode: (node: { type: 'phase' | 'chapter' | 'task', id: string, title: string, parentId?: string }) => void;
    onReorderPhases: (phases: ResearchPhase[]) => void;
    onReorderChapters: (phaseId: string, chapters: ResearchChapter[]) => void;
    onReorderTasks: (chapterId: string, tasks: ResearchTask[]) => void;
}

// Sortable Item Wrapper
function SortableItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center group">
            {!disabled && (
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                </div>
            )}
            <div className="flex-1">{children}</div>
        </div>
    );
}

// Status Icon
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="w-3 h-3 text-green-500" />;
        case 'in_progress':
        case 'writing':
        case 'active':
            return <Clock className="w-3 h-3 text-blue-500" />;
        default:
            return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
};

export function AcademicSidebar({
    project,
    isCollapsed,
    onToggleCollapse,
    onSelectNode,
    selectedNodeId,
    onAddPhase,
    onAddChapter,
    onAddTask,
    onDeletePhase,
    onDeleteChapter,
    onDeleteTask,
    onRenameNode,
    onReorderPhases,
    onReorderChapters,
    onReorderTasks,
}: AcademicSidebarProps) {
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phaseId)) next.delete(phaseId);
            else next.add(phaseId);
            return next;
        });
    };

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    // Expand all on load
    useEffect(() => {
        if (project) {
            setExpandedPhases(new Set(project.phases.map(p => p.id)));
        }
    }, [project?.id]);

    // Phase DnD Handler
    const handlePhaseDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !project) return;

        const oldIndex = project.phases.findIndex(p => p.id === active.id);
        const newIndex = project.phases.findIndex(p => p.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newPhases = arrayMove(project.phases, oldIndex, newIndex);
            onReorderPhases(newPhases);
        }
    };

    // Chapter DnD Handler
    const handleChapterDragEnd = (phaseId: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !project) return;
        const phase = project.phases.find(p => p.id === phaseId);
        if (!phase) return;

        const oldIndex = phase.chapters.findIndex(c => c.id === active.id);
        const newIndex = phase.chapters.findIndex(c => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newChapters = arrayMove(phase.chapters, oldIndex, newIndex);
            onReorderChapters(phaseId, newChapters);
        }
    };

    // Task DnD Handler
    const handleTaskDragEnd = (chapterId: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !project) return;

        for (const phase of project.phases) {
            const chapter = phase.chapters.find(c => c.id === chapterId);
            if (chapter && chapter.tasks) {
                const oldIndex = chapter.tasks.findIndex(t => t.id === active.id);
                const newIndex = chapter.tasks.findIndex(t => t.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newTasks = arrayMove(chapter.tasks, oldIndex, newIndex);
                    onReorderTasks(chapterId, newTasks);
                    break;
                }
            }
        }
    };

    // Filter
    const filteredPhases = project?.phases.filter(phase =>
        phase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phase.chapters.some(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    if (isCollapsed) {
        return (
            <div className="w-12 bg-slate-900 border-l border-slate-700 flex flex-col items-center py-4">
                <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-white hover:bg-slate-800 mb-4">
                    <PanelLeft className="w-5 h-5" />
                </Button>
                {project?.phases.map((phase, idx) => (
                    <Button
                        key={phase.id}
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            onToggleCollapse();
                            setTimeout(() => togglePhase(phase.id), 100);
                        }}
                        className="text-white/60 hover:text-white hover:bg-slate-800 mb-1"
                        title={phase.title}
                    >
                        <span className="text-xs font-bold">{idx + 1}</span>
                    </Button>
                ))}
            </div>
        );
    }

    return (
        <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-700 flex flex-col h-full min-w-[320px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-white font-bold text-base arabic-title">هيكل البحث</h3>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onAddPhase} className="text-white/60 hover:text-white hover:bg-slate-800 h-8 w-8" title="إضافة مرحلة جديدة">
                        <Plus className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-white/60 hover:text-white hover:bg-slate-800 h-8 w-8" title="طي القائمة">
                        <PanelLeftClose className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-700">
                <Input
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-9 text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
            </div>

            {/* Tree */}
            <ScrollArea className="flex-1 p-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
                    <SortableContext items={filteredPhases.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {filteredPhases.map((phase, phaseIdx) => (
                            <SortableItem key={phase.id} id={phase.id}>
                                <Collapsible open={expandedPhases.has(phase.id)} onOpenChange={() => togglePhase(phase.id)}>
                                    <div className="flex items-start group my-1">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="w-full justify-start text-white/90 hover:text-white hover:bg-slate-800 min-h-[40px] h-auto px-3 py-2">
                                                <div className="flex items-start gap-2 w-full">
                                                    {expandedPhases.has(phase.id) ? (
                                                        <FolderOpen className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <Folder className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span className="text-sm flex-1 text-right leading-relaxed break-words whitespace-normal">{phase.title}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-5 bg-slate-700 text-slate-300 flex-shrink-0">
                                                        {phase.chapters?.length || 0}
                                                    </Badge>
                                                </div>
                                            </Button>
                                        </CollapsibleTrigger>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white">
                                                    <MoreVertical className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-right">
                                                <DropdownMenuItem onClick={() => onAddChapter(phase.id)}>
                                                    <Plus className="w-4 h-4 ml-2" /> إضافة فصل
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onRenameNode({ type: 'phase', id: phase.id, title: phase.title })}>
                                                    <Edit2 className="w-4 h-4 ml-2" /> إعادة تسمية
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDeletePhase(phase.id)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <CollapsibleContent>
                                        <div className="mr-5 border-r-2 border-slate-700/50 pr-3 mt-1 mb-2">
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleChapterDragEnd(phase.id, e)}>
                                                <SortableContext items={(phase.chapters || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                    {(phase.chapters || []).map(chapter => (
                                                        <SortableItem key={chapter.id} id={chapter.id}>
                                                            <Collapsible open={expandedChapters.has(chapter.id)} onOpenChange={() => toggleChapter(chapter.id)}>
                                                                <div className="flex items-start group my-0.5">
                                                                    <CollapsibleTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className={cn(
                                                                                "w-full justify-start min-h-[36px] h-auto px-3 py-2",
                                                                                selectedNodeId === chapter.id
                                                                                    ? "bg-indigo-600 text-white"
                                                                                    : "text-white/80 hover:text-white hover:bg-slate-800"
                                                                            )}
                                                                            onClick={() => onSelectNode({ type: 'chapter', id: chapter.id, phaseId: phase.id })}
                                                                        >
                                                                            <div className="flex items-start gap-2 w-full">
                                                                                <StatusIcon status={chapter.status} />
                                                                                <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                                                                                <span className="text-sm flex-1 text-right leading-relaxed break-words whitespace-normal">{chapter.title}</span>
                                                                                {chapter.tasks && chapter.tasks.length > 0 && (
                                                                                    <Badge variant="outline" className="text-[10px] h-5 border-slate-600 text-slate-400 flex-shrink-0">
                                                                                        {chapter.tasks.length}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </Button>
                                                                    </CollapsibleTrigger>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white">
                                                                                <MoreVertical className="w-3 h-3" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="text-right">
                                                                            <DropdownMenuItem onClick={() => onAddTask(chapter.id)}>
                                                                                <Plus className="w-4 h-4 ml-2" /> إضافة مهمة
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => onRenameNode({ type: 'chapter', id: chapter.id, title: chapter.title, parentId: phase.id })}>
                                                                                <Edit2 className="w-4 h-4 ml-2" /> إعادة تسمية
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => onDeleteChapter(phase.id, chapter.id)} className="text-red-500">
                                                                                <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                {/* Tasks */}
                                                                <CollapsibleContent>
                                                                    {chapter.tasks && chapter.tasks.length > 0 && (
                                                                        <div className="mr-3 border-r border-slate-600/50 pr-2 py-1">
                                                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleTaskDragEnd(chapter.id, e)}>
                                                                                <SortableContext items={chapter.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                                                                    {chapter.tasks.map(task => (
                                                                                        <SortableItem key={task.id} id={task.id}>
                                                                                            <div className="flex items-center group">
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className={cn(
                                                                                                        "w-full justify-start h-6 px-2",
                                                                                                        selectedNodeId === task.id
                                                                                                            ? "bg-indigo-500/50 text-white"
                                                                                                            : "text-white/60 hover:text-white hover:bg-slate-700"
                                                                                                    )}
                                                                                                    onClick={() => onSelectNode({ type: 'task', id: task.id, chapterId: chapter.id, phaseId: phase.id })}
                                                                                                >
                                                                                                    <StatusIcon status={task.status} />
                                                                                                    <ListTodo className="w-3 h-3 mr-1 ml-1" />
                                                                                                    <span className="truncate text-[11px] flex-1 text-right">{task.title}</span>
                                                                                                    {task.priority === 'high' && <AlertCircle className="w-3 h-3 text-red-400" />}
                                                                                                </Button>
                                                                                                <DropdownMenu>
                                                                                                    <DropdownMenuTrigger asChild>
                                                                                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white">
                                                                                                            <MoreVertical className="w-2 h-2" />
                                                                                                        </Button>
                                                                                                    </DropdownMenuTrigger>
                                                                                                    <DropdownMenuContent align="end" className="text-right">
                                                                                                        <DropdownMenuItem onClick={() => onRenameNode({ type: 'task', id: task.id, title: task.title, parentId: chapter.id })}>
                                                                                                            <Edit2 className="w-4 h-4 ml-2" /> تعديل
                                                                                                        </DropdownMenuItem>
                                                                                                        <DropdownMenuItem onClick={() => onDeleteTask(chapter.id, task.id)} className="text-red-500">
                                                                                                            <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                                                                        </DropdownMenuItem>
                                                                                                    </DropdownMenuContent>
                                                                                                </DropdownMenu>
                                                                                            </div>

                                                                                            {/* Subtasks */}
                                                                                            {task.subtasks && task.subtasks.length > 0 && (
                                                                                                <div className="mr-3 pr-2 py-0.5">
                                                                                                    {task.subtasks.map(sub => (
                                                                                                        <div key={sub.id} className="flex items-center text-[10px] text-white/50 py-0.5">
                                                                                                            <input
                                                                                                                type="checkbox"
                                                                                                                checked={sub.completed}
                                                                                                                readOnly
                                                                                                                className="ml-1 h-3 w-3"
                                                                                                            />
                                                                                                            <span className={cn("truncate", sub.completed && "line-through")}>{sub.title}</span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </SortableItem>
                                                                                    ))}
                                                                                </SortableContext>
                                                                            </DndContext>
                                                                        </div>
                                                                    )}
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        </SortableItem>
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>

                {filteredPhases.length === 0 && (
                    <div className="text-center text-slate-500 py-8 text-sm">
                        {searchTerm ? 'لا توجد نتائج' : 'لا توجد مراحل بعد'}
                    </div>
                )}
            </ScrollArea>

            {/* Footer Stats */}
            {project && (
                <div className="p-2 border-t border-slate-700 text-[10px] text-slate-400 flex justify-between">
                    <span>{project.phases.length} مراحل</span>
                    <span>{project.phases.reduce((sum, p) => sum + (p.chapters?.length || 0), 0)} فصول</span>
                    <span>{project.phases.reduce((sum, p) => sum + p.chapters.reduce((cs, c) => cs + (c.tasks?.length || 0), 0), 0)} مهام</span>
                </div>
            )}
        </div>
    );
}

export default AcademicSidebar;
