import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, LayoutTemplate, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplatesGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (content: string, type?: 'text' | 'background') => void;
}

// --- Paper Definitions ---
const paperStyles = [
    {
        category: 'موصى به (Recommended)',
        items: [
            { id: 'plain', title: 'سادة (Plain)', bg: 'white', content: 'none' },
            { id: 'lined_s', title: 'مسطر صغير (Lined S)', bg: 'white', content: 'repeating-linear-gradient(transparent, transparent 20px, #e5e7eb 20px, #e5e7eb 21px)' },
            { id: 'lined_m', title: 'مسطر وسط (Lined M)', bg: 'white', content: 'repeating-linear-gradient(transparent, transparent 30px, #e5e7eb 30px, #e5e7eb 31px)' },
            { id: 'grid_s', title: 'مربعات (Grid S)', bg: 'white', content: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', size: '20px 20px' },
        ]
    },
    {
        category: 'Lined Note Paper',
        items: [
            { id: 'lined_l', title: 'مسطر كبير (Lined L)', bg: 'white', content: 'repeating-linear-gradient(transparent, transparent 40px, #e5e7eb 40px, #e5e7eb 41px)' },
            { id: 'margin_single', title: 'هامش (Single Margin)', bg: 'white', content: 'linear-gradient(90deg, transparent 40px, #fca5a5 40px, #fca5a5 41px, transparent 41px), repeating-linear-gradient(transparent, transparent 30px, #e5e7eb 30px, #e5e7eb 31px)' },
            { id: 'fancy_blue', title: 'مسطر أزرق (Blue Lined)', bg: '#eff6ff', content: 'repeating-linear-gradient(transparent, transparent 30px, #bfdbfe 30px, #bfdbfe 31px)' },
        ]
    },
    {
        category: 'Squared Grid Paper',
        items: [
            { id: 'grid_m', title: 'شبكة وسط (Grid M)', bg: 'white', content: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', size: '30px 30px' },
            { id: 'grid_l', title: 'شبكة كبيرة (Grid L)', bg: 'white', content: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', size: '40px 40px' },
            { id: 'dotted', title: 'منقط (Dotted)', bg: 'white', content: 'radial-gradient(#94a3b8 1px, transparent 1px)', size: '20px 20px' },
        ]
    }
];

// --- Template Definitions ---
const templateCategories = [
    {
        category: 'Planner Layouts & Organizers',
        items: [
            {
                id: 'daily',
                title: 'Daily Plan',
                previewColor: 'bg-rose-50',
                content: `<div class="p-4 bg-rose-50 rounded-lg border border-rose-100">
                    <h2 class="text-center text-rose-800 mb-4 font-bold border-b border-rose-200 pb-2">📅 التخطيط اليومي</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h3 class="font-bold text-rose-600 mb-2">🎯 الأهداف الرئيسية</h3>
                             <ul data-type="taskList"><li data-type="taskItem"></li></ul>
                        </div>
                        <div class="bg-white p-3 rounded shadow-sm">
                            <h3 class="font-bold text-rose-600 mb-2">📝 ملاحظات</h3>
                            <p></p>
                        </div>
                    </div>
                </div>`
            },
            {
                id: 'weekly',
                title: 'Weekly Plan',
                previewColor: 'bg-indigo-50',
                content: `<div class="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h2 class="text-center text-indigo-800 mb-4 font-bold">🗓️ الأسبوع</h2>
                    <div class="grid grid-cols-7 gap-2">
                        <div class="bg-white p-2 rounded text-center border">السبت</div>
                        <div class="bg-white p-2 rounded text-center border">الأحد</div>
                        <div class="bg-white p-2 rounded text-center border">الاثنين</div>
                        <div class="bg-white p-2 rounded text-center border">الثلاثاء</div>
                        <div class="bg-white p-2 rounded text-center border">الأربعاء</div>
                        <div class="bg-white p-2 rounded text-center border">الخميس</div>
                        <div class="bg-white p-2 rounded text-center border">الجمعة</div>
                    </div>
                </div>`
            }
        ]
    },
    {
        category: 'Designs (Back to School / Floral)',
        items: [
            {
                id: 'school_1',
                title: 'Back to School',
                type: 'background',
                previewColor: 'bg-amber-50',
                content: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
                // Using simple gradients as "Image" backgrounds require actual assets. 
                // We'll simulate with CSS.
            },
            {
                id: 'floral_1',
                title: 'Floral Pink',
                type: 'background',
                previewColor: 'bg-pink-50',
                content: 'repeating-linear-gradient(45deg, #fdf2f8 0px, #fdf2f8 10px, #fce7f3 10px, #fce7f3 20px)'
            },
            {
                id: 'dark_mode',
                title: 'Dark Blue',
                type: 'background',
                previewColor: 'bg-slate-800',
                content: '#1e293b' // Dark background
            }
        ]
    }
];

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);

    const handleTemplateClick = (item: any) => {
        // If it's a paper style (CSS gradient), it's always background, no need to ask?
        // Or should we allow "Text" (which would be weird)?
        // User specifically said "Templates have text option or pdf design option".
        // Paper styles are usually backgrounds. Let's keep paper styles as is (direct apply).
        // Only for "Templates" tab items, we ask.
        setSelectedTemplate(item);
    };

    const confirmSelection = (mode: 'text' | 'background') => {
        if (!selectedTemplate) return;

        if (mode === 'text') {
            onSelectTemplate(selectedTemplate.content, 'text');
        } else {
            // Background Mode
            // If content is HTML, we convert to SVG foreignObject data URI to use as background image
            let bgImage = selectedTemplate.content;
            let bgSize = 'cover';
            let bgRepeat = 'no-repeat';

            if (selectedTemplate.content.trim().startsWith('<div')) {
                // Convert HTML to SVG Data URI
                // We need to escape # characters in valid SVG data URIs
                const svgWidth = 800; // A4 approx width in pixels at standard DPI? or just generic
                const svgHeight = 1100; // A4 ratio
                const htmlContent = selectedTemplate.content
                    .replace(/#/g, '%23') // Escape hex colors
                    .replace(/"/g, "'"); // Replace double quotes with single (simple hack, better via encoding)

                // Better encoding:
                const encodedHtml = encodeURIComponent(selectedTemplate.content);

                bgImage = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:14px; color:black; height:100%;">${encodedHtml}</div></foreignObject></svg>`;
                bgSize = 'contain';
                bgRepeat = 'no-repeat';
            } else if (selectedTemplate.type === 'background') {
                // It's already a background (gradient or image)
                bgImage = selectedTemplate.content;
                bgSize = selectedTemplate.size || 'auto';
                bgRepeat = 'repeat';
            }

            const payload = JSON.stringify({
                image: bgImage,
                size: bgSize,
                repeat: bgRepeat
            });
            onSelectTemplate(payload, 'background');
        }

        setSelectedTemplate(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) setSelectedTemplate(null); onClose(); }}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-3xl">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <LayoutTemplate className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-800">معرض القوالب</DialogTitle>
                            <p className="text-xs text-gray-500">اختر نوع الورق أو القالب المناسب</p>
                        </div>
                    </div>
                    <Button onClick={() => onClose()} variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500">
                        <Plus className="w-5 h-5 rotate-45" />
                    </Button>
                </div>

                {!selectedTemplate ? (
                    <Tabs defaultValue="paper" className="flex-1 flex flex-col w-full overflow-hidden">
                        <div className="bg-white px-6 border-b border-gray-100 pb-0">
                            <TabsList className="bg-slate-100 p-1 rounded-xl w-auto inline-flex gap-1">
                                <TabsTrigger value="paper" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 px-6 py-2">
                                    <FileText className="w-4 h-4 mr-2" />
                                    الورق (Paper)
                                </TabsTrigger>
                                <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 px-6 py-2">
                                    <LayoutTemplate className="w-4 h-4 mr-2" />
                                    القوالب (Templates)
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="paper" className="flex-1 p-0 m-0 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                            <div className="p-8 space-y-8">
                                {paperStyles.map((cat, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-amber-400 rounded-full" />
                                            <h3 className="font-bold text-gray-700 text-lg">{cat.category}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {cat.items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        const payload = item.content === 'none' ? '' : JSON.stringify({
                                                            image: item.content,
                                                            size: item.size || 'auto',
                                                            repeat: 'repeat'
                                                        });
                                                        onSelectTemplate(payload, 'background');
                                                        onClose();
                                                    }}
                                                    className="group flex flex-col items-center gap-2"
                                                >
                                                    <div className="w-full aspect-[4/5] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-indigo-300">
                                                        <div className="w-full h-full opacity-70" style={{ backgroundColor: item.bg, backgroundImage: item.content === 'none' ? 'none' : item.content, backgroundSize: item.size || 'auto' }} />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                                                            <span className="bg-white text-gray-900 text-xs px-3 py-1 rounded-full shadow font-medium">استخدام</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="templates" className="flex-1 p-0 m-0 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                            <div className="p-8 space-y-8">
                                {templateCategories.map((cat, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-purple-500 rounded-full" />
                                            <h3 className="font-bold text-gray-700 text-lg">{cat.category}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {cat.items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleTemplateClick(item)}
                                                    className="group flex flex-col items-center gap-2"
                                                >
                                                    <div className={`w-full aspect-[4/5] rounded-xl shadow-sm border border-gray-200 overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-purple-300 ${item.previewColor || 'bg-white'}`}>
                                                        <div className="w-full h-full p-4 flex flex-col items-center justify-center opacity-80">
                                                            <div className="w-3/4 h-1/2 bg-white/50 border border-black/5 rounded-md mb-2" />
                                                            <div className="w-3/4 h-2 bg-black/5 rounded-full mb-1" />
                                                            <div className="w-1/2 h-2 bg-black/5 rounded-full" />
                                                        </div>
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                                                            <span className="bg-white text-gray-900 text-xs px-3 py-1 rounded-full shadow font-medium">استخدام</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-800">كيف تريد استخدام هذا القالب؟</h3>
                            <p className="text-gray-500">يمكنك إدراج القالب كنص قابل للتعديل أو كخلفية ثابتة (مثل PDF)</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <button
                                onClick={() => confirmSelection('text')}
                                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all bg-white"
                            >
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-gray-800">نص قابل للتعديل</h4>
                                    <p className="text-sm text-gray-500">يدرج الجداول والنصوص لتتمكن من الكتابة بداخلها وتعديلها.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => confirmSelection('background')}
                                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all bg-white"
                            >
                                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <LayoutTemplate className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-gray-800">خلفية ثابتة (PDF Style)</h4>
                                    <p className="text-sm text-gray-500">يدرج التصميم كخلفية ثابتة للكتابة فوقها بالرسم أو النص الحر.</p>
                                </div>
                            </button>
                        </div>

                        <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-gray-400 hover:text-gray-600">
                            الرجوع للقائمة
                        </Button>
                    </div>
                )}


                {!selectedTemplate && (
                    <div className="bg-white border-t p-4 flex justify-between items-center">
                        <p className="text-xs text-gray-400">يمكنك إنشاء قوالب خاصة بك قريباً...</p>
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء (Create)
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
