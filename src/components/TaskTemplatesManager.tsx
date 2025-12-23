import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskTemplates, TaskTemplate, TemplateTask } from '@/hooks/useTaskTemplates';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import {
    Plus,
    Trash2,
    Copy,
    PlayCircle,
    ChevronDown,
    ChevronUp,
    Sunrise,
    Home,
    Plane,
    FolderKanban,
    Sparkles,
    Edit
} from 'lucide-react';

interface TaskTemplatesManagerProps {
    onApplyTemplate?: (templateId: string) => void;
}

const TaskTemplatesManager: React.FC<TaskTemplatesManagerProps> = ({ onApplyTemplate }) => {
    const {
        templates,
        addTemplate,
        deleteTemplate,
        duplicateTemplate,
    } = useTaskTemplates();
    const { addTask } = useTasks();
    const { toast } = useToast();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateType, setNewTemplateType] = useState<TaskTemplate['type']>('custom');
    const [newTemplateIcon, setNewTemplateIcon] = useState('📋');
    const [newTemplateTasks, setNewTemplateTasks] = useState<TemplateTask[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const getTypeIcon = (type: TaskTemplate['type']) => {
        switch (type) {
            case 'morning': return <Sunrise className="w-5 h-5 text-amber-500" />;
            case 'weekend': return <Home className="w-5 h-5 text-blue-500" />;
            case 'travel': return <Plane className="w-5 h-5 text-purple-500" />;
            case 'project': return <FolderKanban className="w-5 h-5 text-green-500" />;
            default: return <Sparkles className="w-5 h-5 text-pink-500" />;
        }
    };

    const getTypeLabel = (type: TaskTemplate['type']) => {
        switch (type) {
            case 'morning': return 'صباحي';
            case 'weekend': return 'نهاية أسبوع';
            case 'travel': return 'سفر';
            case 'project': return 'مشروع';
            default: return 'مخصص';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-amber-100 text-amber-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    // Apply a template - creates tasks from it
    const handleApplyTemplate = (template: TaskTemplate) => {
        const today = new Date().toISOString().split('T')[0];

        template.tasks.forEach(task => {
            addTask({
                title: task.title,
                description: task.description,
                deadline: today,
                priority: task.priority,
                type: 'task',
            });
        });

        toast({
            title: 'تم تطبيق القالب',
            description: `تم إنشاء ${template.tasks.length} مهام من قالب "${template.name}"`
        });

        if (onApplyTemplate) {
            onApplyTemplate(template.id);
        }
    };

    // Add task to new template being created
    const handleAddTaskToNewTemplate = () => {
        if (!newTaskTitle.trim()) return;

        setNewTemplateTasks(prev => [...prev, {
            title: newTaskTitle,
            priority: newTaskPriority,
            order: prev.length + 1,
        }]);
        setNewTaskTitle('');
        setNewTaskPriority('medium');
    };

    // Remove task from new template
    const handleRemoveTaskFromNewTemplate = (index: number) => {
        setNewTemplateTasks(prev => prev.filter((_, i) => i !== index));
    };

    // Create new template
    const handleCreateTemplate = () => {
        if (!newTemplateName.trim() || newTemplateTasks.length === 0) {
            toast({
                title: 'خطأ',
                description: 'يرجى إدخال اسم القالب وإضافة مهمة واحدة على الأقل',
                variant: 'destructive'
            });
            return;
        }

        addTemplate({
            name: newTemplateName,
            type: newTemplateType,
            icon: newTemplateIcon,
            tasks: newTemplateTasks,
        });

        // Reset form
        setNewTemplateName('');
        setNewTemplateType('custom');
        setNewTemplateIcon('📋');
        setNewTemplateTasks([]);
        setShowCreateDialog(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    📋 قوالب المهام
                </h2>
                <Button
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500"
                >
                    <Plus className="w-4 h-4 ml-1" />
                    قالب جديد
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <Card
                        key={template.id}
                        className={`border-2 transition-all hover:shadow-lg ${template.isDefault ? 'border-gray-200' : 'border-emerald-200'
                            }`}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{template.icon}</span>
                                    {getTypeIcon(template.type)}
                                    <span>{template.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-[10px]">
                                        {getTypeLabel(template.type)}
                                    </Badge>
                                    {template.isDefault && (
                                        <Badge className="bg-gray-100 text-gray-600 text-[10px]">
                                            افتراضي
                                        </Badge>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-3">
                                {template.tasks.length} مهام
                            </p>

                            {/* Expand/Collapse Tasks */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mb-2 text-gray-500"
                                onClick={() => setExpandedTemplateId(
                                    expandedTemplateId === template.id ? null : template.id
                                )}
                            >
                                {expandedTemplateId === template.id ? (
                                    <>
                                        <ChevronUp className="w-4 h-4 ml-1" />
                                        إخفاء المهام
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                        عرض المهام
                                    </>
                                )}
                            </Button>

                            {expandedTemplateId === template.id && (
                                <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                                    {template.tasks.map((task, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                                        >
                                            <span className="text-gray-400">{idx + 1}.</span>
                                            <span className="flex-1">{task.title}</span>
                                            <Badge className={`text-[9px] ${getPriorityColor(task.priority)}`}>
                                                {task.priority === 'high' ? 'عالي' :
                                                    task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleApplyTemplate(template)}
                                >
                                    <PlayCircle className="w-4 h-4 ml-1" />
                                    تطبيق
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => duplicateTemplate(template.id)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                {!template.isDefault && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => deleteTemplate(template.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Template Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-right">إنشاء قالب جديد</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Template Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">اسم القالب</label>
                            <Input
                                placeholder="مثال: مهام السفر الخاصة بي"
                                value={newTemplateName}
                                onChange={e => setNewTemplateName(e.target.value)}
                                className="text-right"
                            />
                        </div>

                        {/* Template Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">نوع القالب</label>
                            <Select value={newTemplateType} onValueChange={(v: TaskTemplate['type']) => setNewTemplateType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">🌅 صباحي</SelectItem>
                                    <SelectItem value="weekend">🏠 نهاية أسبوع</SelectItem>
                                    <SelectItem value="travel">✈️ سفر</SelectItem>
                                    <SelectItem value="project">📊 مشروع</SelectItem>
                                    <SelectItem value="custom">✨ مخصص</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Template Icon */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">أيقونة القالب</label>
                            <div className="flex gap-2 flex-wrap">
                                {['📋', '🎯', '🚀', '💼', '🏃', '📚', '🛒', '🎉', '⭐', '🔔'].map(icon => (
                                    <Button
                                        key={icon}
                                        type="button"
                                        variant={newTemplateIcon === icon ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setNewTemplateIcon(icon)}
                                        className="text-xl w-10 h-10"
                                    >
                                        {icon}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Add Tasks */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">المهام</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="عنوان المهمة"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="flex-1 text-right"
                                    onKeyPress={e => e.key === 'Enter' && handleAddTaskToNewTemplate()}
                                />
                                <Select value={newTaskPriority} onValueChange={(v: 'low' | 'medium' | 'high') => setNewTaskPriority(v)}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">عالي</SelectItem>
                                        <SelectItem value="medium">متوسط</SelectItem>
                                        <SelectItem value="low">منخفض</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddTaskToNewTemplate}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Tasks List */}
                            {newTemplateTasks.length > 0 && (
                                <div className="space-y-1 mt-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                                    {newTemplateTasks.map((task, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                        >
                                            <span className="text-gray-400 text-sm">{idx + 1}.</span>
                                            <span className="flex-1 text-sm">{task.title}</span>
                                            <Badge className={`text-[9px] ${getPriorityColor(task.priority)}`}>
                                                {task.priority === 'high' ? 'عالي' :
                                                    task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                            </Badge>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500"
                                                onClick={() => handleRemoveTaskFromNewTemplate(idx)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleCreateTemplate} className="bg-emerald-600 hover:bg-emerald-700">
                            إنشاء القالب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TaskTemplatesManager;
