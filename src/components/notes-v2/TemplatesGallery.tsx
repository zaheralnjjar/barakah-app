import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, LayoutTemplate, Plus, Grid2X2, Maximize, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEMPLATES as SMART_TEMPLATES } from '../smart-templates/constants';
import { STATIC_TEMPLATES } from '@/data/generated_templates';
import { Template } from '../smart-templates/types';
import { cn } from '@/lib/utils';
import { generateSmartHtml } from '../smart-templates/constants';

interface TemplatesGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (content: string, type?: 'text' | 'background') => void;
}

// Combine all templates
const ALL_TEMPLATES = [
    ...SMART_TEMPLATES.map(t => ({ ...t, isSmart: true })),
    ...STATIC_TEMPLATES
];

// Extract categories
const CATEGORIES = Array.from(new Set(ALL_TEMPLATES.map(t => t.category || 'عام')));

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [sizeStep, setSizeStep] = useState(false);

    const filteredTemplates = selectedCategory === 'all'
        ? ALL_TEMPLATES
        : ALL_TEMPLATES.filter(t => t.category === selectedCategory);

    const handleTemplateClick = (template: Template) => {
        if (template.type === 'smart-json') {
            // Smart templates usually handle their own sizing or are block-based, 
            // but for now let's treat them as needing size selection if they output HTML.
            // Actually smart templates are inserted via a special handler usually, 
            // but for this gallery we might want to insert their DEFAULT Output HTML if available.
            // For now, let's open size dialog for all.
            setSelectedTemplate(template);
            setSizeStep(true);
        } else {
            setSelectedTemplate(template);
            setSizeStep(true);
        }
    };

    const handleConfirmSize = (size: 'small' | 'medium' | 'large') => {
        if (!selectedTemplate) return;

        let content = '';

        if (typeof selectedTemplate.content === 'string') {
            content = selectedTemplate.content;
        } else if (selectedTemplate.type === 'smart-json') {
            // For smart templates here, we generate a preview or empty structure
            // In a real scenario, this might trigger the SmartFormRenderer
            // But the user asked for "Templates" in the general sense.
            // Let's generate the HTML from default values if possible
            content = generateSmartHtml(selectedTemplate, {});
        }

        // Apply Size Wrapper
        let wrappedContent = content;
        if (size === 'small') {
            wrappedContent = `<div style="max-width: 300px; margin: 10px auto;">${content}</div>`;
        } else if (size === 'medium') {
            wrappedContent = `<div style="max-width: 600px; margin: 10px auto;">${content}</div>`;
        } else {
            wrappedContent = `<div style="width: 100%; margin: 10px 0;">${content}</div>`;
        }

        onSelectTemplate(wrappedContent, 'text');
        handleClose();
    };

    const handleClose = () => {
        setSelectedTemplate(null);
        setSizeStep(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border-0 shadow-2xl rounded-3xl" dir="rtl">

                {/* Header */}
                <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">معرض القوالب</DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400">اختر القالب المناسب لملاحظاتك</p>
                        </div>
                    </div>
                    <Button onClick={handleClose} variant="ghost" className="rounded-full w-8 h-8 p-0">
                        <Plus className="w-5 h-5 rotate-45" />
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Categories */}
                    <div className="w-48 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-100 dark:border-zinc-800 overflow-y-auto p-4 space-y-1 hidden md:block">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                "w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2",
                                selectedCategory === 'all'
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
                            )}
                        >
                            الكل
                        </button>
                        <div className="text-xs font-semibold text-gray-400 mb-2 px-2 mt-4">التصنيفات</div>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "w-full text-right px-3 py-2 rounded-lg text-sm transition-colors",
                                    selectedCategory === cat
                                        ? "bg-white shadow-sm text-gray-900 font-bold dark:bg-zinc-800 dark:text-gray-100"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Templates Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-zinc-950/50">
                        {sizeStep && selectedTemplate ? (
                            <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                                <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-200">اختر حجم القالب</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                                    {/* Small */}
                                    <button
                                        onClick={() => handleConfirmSize('small')}
                                        className="flex flex-col items-center gap-4 group"
                                    >
                                        <div className="w-full aspect-[3/4] bg-white dark:bg-zinc-900 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 shadow-sm flex items-center justify-center p-8 transition-all group-hover:border-indigo-500 group-hover:shadow-xl group-hover:-translate-y-2">
                                            <div className="w-1/2 h-1/3 bg-gray-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 flex items-center justify-center gap-2">
                                                <Smartphone className="w-4 h-4" /> صغير (Small)
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">مناسب للهواتف والملاحظات الجانبية</p>
                                        </div>
                                    </button>

                                    {/* Medium */}
                                    <button
                                        onClick={() => handleConfirmSize('medium')}
                                        className="flex flex-col items-center gap-4 group"
                                    >
                                        <div className="w-full aspect-[3/4] bg-white dark:bg-zinc-900 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-900/10 flex items-center justify-center p-8 transition-all group-hover:border-indigo-500 group-hover:shadow-xl group-hover:-translate-y-2">
                                            <div className="w-3/4 h-1/2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-800" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-600 flex items-center justify-center gap-2">
                                                <Grid2X2 className="w-4 h-4" /> متوسط (Medium)
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">الحجم القياسي، مناسب لمعظم الاستخدامات</p>
                                        </div>
                                    </button>

                                    {/* Large */}
                                    <button
                                        onClick={() => handleConfirmSize('large')}
                                        className="flex flex-col items-center gap-4 group"
                                    >
                                        <div className="w-full aspect-[3/4] bg-white dark:bg-zinc-900 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 shadow-sm flex items-center justify-center p-4 transition-all group-hover:border-indigo-500 group-hover:shadow-xl group-hover:-translate-y-2">
                                            <div className="w-full h-full bg-gray-50 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 flex items-center justify-center gap-2">
                                                <Monitor className="w-4 h-4" /> كامل (Full Width)
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">يأخذ عرض الصفحة بالكامل</p>
                                        </div>
                                    </button>
                                </div>

                                <Button variant="ghost" onClick={() => setSizeStep(false)} className="mt-12">
                                    رجوع للقائمة
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredTemplates.map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTemplateClick(template)}
                                        className="group relative flex flex-col items-start text-right bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                                            "bg-gray-50 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-zinc-800 dark:text-gray-400 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400"
                                        )}>
                                            {template.icon ? <template.icon size={24} strokeWidth={1.5} /> : <FileText size={24} />}
                                        </div>

                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600">{template.name}</h3>
                                        <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{template.description}</p>

                                        {/* Tag */}
                                        <span className="absolute top-4 left-4 text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                                            {template.category}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
