
import React, { useState } from 'react';
import { TEMPLATES } from './constants';
import { Template } from './types';
import { FilePlus, X, PenTool, Search, Eye, Sparkles, BookOpen, Activity, Heart, DollarSign, CheckCircle2, Layers } from 'lucide-react';

interface TemplateSelectorProps {
    onSelect: (template: Template | null) => void;
    onClose: () => void;
    customTemplates?: Template[];
    onSaveCustomTemplate?: (template: Template) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose, customTemplates = [] }) => {
    const allTemplates = [...customTemplates, ...TEMPLATES];
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const categories = [
        { id: 'all', label: 'الكل', icon: Sparkles },
        { id: 'islamic', label: 'إسلاميات', icon: BookOpen },
        { id: 'productivity', label: 'إنتاجية', icon: Activity },
        { id: 'health', label: 'صحة', icon: Heart },
        { id: 'finance', label: 'مالية', icon: DollarSign },
    ];

    const filteredTemplates = allTemplates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleTemplateSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(tid => tid !== id);
            return [...prev, id];
        });
    };

    const handleCombineSelection = () => {
        if (selectedIds.length === 0) return;
        const orderedSelected = selectedIds.map(id => allTemplates.find(t => t.id === id)).filter(Boolean) as Template[];

        let combinedHtml = '';
        orderedSelected.forEach(t => {
            let content = '';
            if (typeof t.content === 'string') {
                content = t.content;
            } else {
                // Placeholder logic for smart templates in simple view
                content = `<div class="smart-template-placeholder" data-template-id="${t.id}" style="padding: 20px; border: 2px dashed #ccc; margin: 10px 0; text-align: center;"><strong>${t.name}</strong><br/><em style="font-size: 0.8em">سيتم تفعيل القالب الذكي عند الحفظ</em></div>`;
                if (t.content.outputConfig?.htmlTemplate) {
                    content = t.content.outputConfig.htmlTemplate.replace(/{{.*?}}/g, '...');
                }
            }
            combinedHtml += content + '<p><br/></p>';
        });

        const compositeTemplate: Template = {
            id: `composite-${Date.now()}`,
            name: 'مجموعة قوالب',
            description: 'دمج متعدد',
            content: combinedHtml,
            icon: Layers,
            defaultColor: orderedSelected[0]?.defaultColor || '#ffffff',
            type: 'simple'
        };

        onSelect(compositeTemplate);
    };

    const handleSingleSelect = (template: Template) => {
        if (selectedIds.length > 0) toggleTemplateSelection(template.id);
        else onSelect(template);
    };

    const renderPreviewContent = (template: Template) => {
        if (typeof template.content === 'string') {
            return <div className="p-4 bg-white rounded border border-gray-200 text-xs text-gray-600 font-tajawal overflow-hidden h-full pointer-events-none opacity-80 scale-[0.8] origin-top" dangerouslySetInnerHTML={{ __html: template.content }} />;
        }
        return <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center flex flex-col items-center justify-center h-full text-gray-400"><span className="text-sm font-bold">قالب ذكي</span><span className="text-xs">اضغط للاستخدام والتخصيص</span></div>;
    };

    const groupedTemplates = allTemplates.reduce((acc, template) => {
        const cat = template.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(template);
        return acc;
    }, {} as Record<string, Template[]>);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative" dir="rtl">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles className="text-indigo-600" size={20} />
                            مكتبة القوالب الذكية
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">اختر قالباً للبدء، أو ادمج عدة قوالب في صفحة واحدة</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex gap-3 items-center flex-wrap">
                    <div className="relative flex-grow max-w-md">
                        <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث السريع..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-9 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none text-sm transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-grow justify-end">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            الكل
                        </button>
                        {categories.filter(c => c.id !== 'all').map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <cat.icon size={12} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="overflow-y-auto p-6 bg-gray-50 custom-scrollbar flex-grow">

                    {/* Blank Template Option */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                            <FilePlus size={14} className="mb-0.5" /> جديد
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => onSelect(null)}
                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 hover:border-indigo-400 rounded-xl hover:shadow-md transition-all group text-right"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                    <FilePlus size={20} className="text-gray-500 group-hover:text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">صفحة فارغة</h4>
                                    <p className="text-[10px] text-gray-500">ابدأ من الصفر</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Templates List */}
                    {Object.entries(groupedTemplates).map(([catId, templates]) => {
                        const catLabel = categories.find(c => c.id === catId)?.label || catId;
                        const CatIcon = categories.find(c => c.id === catId)?.icon || Layers;

                        // Filter by search/category state (already filtered in filteredTemplates, but we group now)
                        // Actually we should rely on filteredTemplates prop if we used it, but here we restructured.
                        // Let's re-apply filter logic:
                        const visibleTemplates = templates.filter(t => {
                            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                t.description.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory || (selectedCategory === 'all' && true);
                            // If selectedCategory is NOT all, we only show that category anyway. But if ALL, we show headers.
                            // However, if we are mapping through groupedTemplates, we need to respect the top-level filter too?
                            // Better: Filter First, Group Second.
                            return matchesSearch;
                        });

                        if (visibleTemplates.length === 0 || (selectedCategory !== 'all' && catId !== selectedCategory)) return null;

                        return (
                            <div key={catId} className="mb-8">
                                <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 border-b border-gray-100 pb-1">
                                    <span className="p-1 bg-white rounded-md shadow-sm text-indigo-600"><CatIcon size={14} /></span>
                                    {catLabel}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {visibleTemplates.map(template => {
                                        const isSelected = selectedIds.includes(template.id);
                                        const Icon = typeof template.icon === 'string' ? PenTool : template.icon; // Handle diverse icon types

                                        return (
                                            <div
                                                key={template.id}
                                                onClick={() => handleSingleSelect(template)}
                                                className={`
                                                    relative bg-white rounded-xl border transition-all cursor-pointer group hover:shadow-lg overflow-hidden flex flex-col
                                                    ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 hover:border-indigo-300'}
                                                `}
                                            >
                                                {/* Card Header Color Strip */}
                                                <div className="h-1.5 w-full" style={{ backgroundColor: template.defaultColor || '#cbd5e1' }} />

                                                <div className="p-4 flex-grow flex flex-col gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={18} className="text-indigo-600" />}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors text-right">{template.name}</h4>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed text-right line-clamp-2">{template.description}</p>
                                                    </div>
                                                </div>

                                                {/* Actions Footer */}
                                                <div className="p-2 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleTemplateSelection(template.id); }}
                                                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${isSelected ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-white'}`}
                                                    >
                                                        {isSelected ? 'إلغاء' : 'تحديد للدمج'}
                                                    </button>
                                                    <button className="text-[10px] text-indigo-600 hover:underline px-2">استخدام</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Action Bar (Visible when items selected) */}
                {selectedIds.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in">
                        <button
                            onClick={handleCombineSelection}
                            className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-indigo-500/20 font-bold flex items-center gap-3 hover:scale-105 transition-transform border border-gray-700"
                        >
                            <Layers size={18} className="text-indigo-400" />
                            <span>دمج {selectedIds.length} قوالب وإدراج</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateSelector;
