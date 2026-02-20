import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, Check, ChevronLeft, ArrowRight, Plus, X } from "lucide-react";
import { trackingService } from "@/services/trackingService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TRACKER_BUNDLES, TrackerBundle } from "@/data/trackerBundles";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateTrackerDTO } from "@/types/tracking";

// Additional templates for custom bundles
const TRACKER_TEMPLATES: (CreateTrackerDTO & { id: string })[] = [
    { id: 'water', name: "شرب الماء", type: "numeric", icon: "💧", color: "#3B82F6", settings: { unit: "لتر", goal: "2", step: "0.25" } },
    { id: 'prayer', name: "الصلوات الخمس", type: "checklist", icon: "🕌", color: "#10B981", settings: { options: "الفجر\nالظهر\nالعصر\nالمغرب\nالعشاء" } },
    { id: 'quran', name: "قراءة القرآن", type: "numeric", icon: "📖", color: "#F59E0B", settings: { unit: "صفحة", goal: "20" } },
    { id: 'workout', name: "تمرين رياضي", type: "time", icon: "🏋️", color: "#EF4444", settings: { goal: "30" } },
    { id: 'sleep', name: "ساعات النوم", type: "numeric", icon: "😴", color: "#6366F1", settings: { unit: "ساعة", goal: "7" } },
    { id: 'steps', name: "المشي / خطوات", type: "numeric", icon: "👣", color: "#14B8A6", settings: { unit: "خطوة", goal: "5000" } },
    { id: 'mood', name: "الحالة المزاجية", type: "scale", icon: "😊", color: "#8B5CF6", settings: { min: "1", max: "5" } },
    { id: 'weight', name: "الوزن", type: "numeric", icon: "⚖️", color: "#64748B", settings: { unit: "كجم" } },
    { id: 'reading', name: "قراءة", type: "numeric", icon: "📚", color: "#F59E0B", settings: { unit: "صفحة", goal: "10" } },
    { id: 'deep_work', name: "عمل عميق", type: "time", icon: "💻", color: "#F43F5E", settings: { goal: "120" } },
    { id: 'skill', name: "تعلم مهارة", type: "time", icon: "🧠", color: "#8B5CF6", settings: { goal: "30" } },
    { id: 'diet', name: "وجبات صحية", type: "scale", icon: "🥗", color: "#10B981", settings: { min: "1", max: "10" } },
    { id: 'dhikr', name: "الأذكار", type: "checklist", icon: "📿", color: "#10B981", settings: { options: "الصباح\nالمساء\nالنوم" } },
];

export function TrackerBundlesDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState<TrackerBundle | null>(null);
    const [selectedTrackers, setSelectedTrackers] = useState<number[]>([]); // Indices of selected trackers in bundle
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);

    // Custom Bundle State
    const [customName, setCustomName] = useState("");
    const [customDesc, setCustomDesc] = useState("");
    const [customSelectedTemplateIds, setCustomSelectedTemplateIds] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const handleBundleClick = (bundle: TrackerBundle) => {
        setSelectedBundle(bundle);
        setSelectedTrackers(bundle.trackers.map((_, i) => i));
    };

    const toggleTracker = (index: number) => {
        setSelectedTrackers(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleCustomTemplate = (id: string) => {
        setCustomSelectedTemplateIds(prev =>
            prev.includes(id)
                ? prev.filter(tid => tid !== id)
                : [...prev, id]
        );
    };

    const resetState = () => {
        setSelectedBundle(null);
        setSelectedTrackers([]);
        setIsCreatingCustom(false);
        setCustomName("");
        setCustomDesc("");
        setCustomSelectedTemplateIds([]);
    };

    const handleCreateTrackers = async (trackersList: CreateTrackerDTO[]) => {
        if (trackersList.length === 0) return;
        setLoading(true);

        try {
            const promises = trackersList.map(trackerDef =>
                trackingService.createTracker({
                    ...trackerDef,
                    settings: {
                        ...trackerDef.settings,
                        goal: Number(trackerDef.settings?.goal) || undefined,
                        min: Number(trackerDef.settings?.min) || undefined,
                        max: Number(trackerDef.settings?.max) || undefined,
                        step: Number(trackerDef.settings?.step) || undefined,
                        options: typeof trackerDef.settings?.options === 'string'
                            ? trackerDef.settings.options.split('\n')
                            : trackerDef.settings?.options
                    } as any
                })
            );

            await Promise.all(promises);

            toast.success(`تم إضافة ${trackersList.length} متتبعات بنجاح!`);
            queryClient.invalidateQueries({ queryKey: ["trackers"] });
            setOpen(false);
            resetState();
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء إضافة المتتبعات");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBundle = async () => {
        if (!selectedBundle) return;
        const trackersToCreate = selectedBundle.trackers.filter((_, i) => selectedTrackers.includes(i));
        await handleCreateTrackers(trackersToCreate);
    };

    const handleAddCustom = async () => {
        if (!customName || customSelectedTemplateIds.length === 0) {
            toast.error("يرجى إدخال اسم المجموعة واختيار متتبع واحد على الأقل");
            return;
        }

        const selectedTemplates = TRACKER_TEMPLATES.filter(t => customSelectedTemplateIds.includes(t.id));
        // We are just adding the trackers here, effectively "creating a bundle" of trackers.
        // If we want to save the bundle definition for later, we'd need another service call, 
        // but for now, the user request implies just "adding multiple trackers via a custom selection".
        await handleCreateTrackers(selectedTemplates);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetState();
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2">
                    <Layers className="w-4 h-4" />
                    باقات جاهزة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl text-right max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">

                {/* Header changes based on view */}
                <DialogHeader>
                    <DialogTitle className="text-right flex justify-between items-center">
                        {isCreatingCustom ? "إنشاء باقة جديدة" : selectedBundle ? selectedBundle.name : "باقات التتبع الجاهزة"}
                        {(selectedBundle || isCreatingCustom) && (
                            <Button variant="ghost" size="sm" onClick={resetState}>
                                <ChevronLeft className="w-4 h-4 ml-1" />
                                عودة
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        {isCreatingCustom ? "قم بتسمية الباقة واختيار المتتبعات التي تريدها." :
                            selectedBundle ? selectedBundle.description : "اختر مجموعة متكاملة للبدء فوراً أو صمم باقتك الخاصة."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1">
                    {!selectedBundle && !isCreatingCustom ? (
                        <div className="space-y-4">
                            {/* Create New Card */}
                            <div
                                onClick={() => setIsCreatingCustom(true)}
                                className="group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50/50 p-6 transition-all text-center flex flex-col items-center justify-center gap-3 min-h-[160px]"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-700">باقة مخصصة جديدة</h3>
                                    <p className="text-sm text-gray-500 mt-1">اختر متتبعاتك المفضلة وأضفها دفعة واحدة</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {TRACKER_BUNDLES.map((bundle) => (
                                    <div
                                        key={bundle.id}
                                        onClick={() => handleBundleClick(bundle)}
                                        className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-4xl group-hover:scale-110 transition-transform duration-500">
                                                {bundle.id === 'ramadan' ? '🌙' : bundle.id === 'health' ? '💪' : '🚀'}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{bundle.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{bundle.description}</p>

                                        <div className="flex flex-wrap gap-2">
                                            {bundle.trackers.slice(0, 3).map((t, i) => (
                                                <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                                                    <span>{t.icon}</span>
                                                    {t.name}
                                                </span>
                                            ))}
                                            {bundle.trackers.length > 3 && (
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                    +{bundle.trackers.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isCreatingCustom ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label>اسم الباقة</Label>
                                <Input
                                    placeholder="مثلاً: روتين الصباح، أهداف 2024..."
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="text-right"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>اختر المتتبعات</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {TRACKER_TEMPLATES.map((template) => {
                                        const isSelected = customSelectedTemplateIds.includes(template.id);
                                        return (
                                            <div
                                                key={template.id}
                                                onClick={() => toggleCustomTemplate(template.id)}
                                                className={`
                                                    cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all
                                                    ${isSelected
                                                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                                `}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                                    style={{ backgroundColor: isSelected ? '#4F46E5' : '#F3F4F6', color: isSelected ? 'white' : '#6B7280' }}
                                                >
                                                    {isSelected ? <Check className="w-5 h-5" /> : template.icon}
                                                </div>
                                                <div className="flex-1 text-right min-w-0">
                                                    <div className="font-medium text-sm truncate">{template.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {template.type === 'numeric' ? 'عداد' : template.type === 'checklist' ? 'قائمة' : template.type === 'scale' ? 'مقياس' : 'وقت'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Existing Bundle Selection View
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-base">المتتبعات المتاحة ({selectedBundle?.trackers.length})</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTrackers(selectedBundle?.trackers.map((_, i) => i) || [])}
                                    className="text-xs text-indigo-600"
                                >
                                    تحديد الكل
                                </Button>
                            </div>
                            <div className="grid gap-3">
                                {selectedBundle?.trackers.map((tracker, index) => {
                                    const isSelected = selectedTrackers.includes(index);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => toggleTracker(index)}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                                ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                    : 'border-gray-100 hover:bg-gray-50'}
                                            `}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleTracker(index)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xl shadow-sm">
                                                {tracker.icon}
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-bold text-gray-900">{tracker.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {tracker.type === 'checklist' ? 'قائمة مهام' :
                                                        tracker.type === 'numeric' ? `هدف: ${tracker.settings?.goal} ${tracker.settings?.unit || ''}` :
                                                            tracker.type === 'time' ? `هدف: ${tracker.settings?.goal} دقيقة` : 'متتبع'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 sm:justify-start gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        إلغاء
                    </Button>
                    {isCreatingCustom ? (
                        <Button
                            type="button"
                            onClick={handleAddCustom}
                            disabled={loading || !customName || customSelectedTemplateIds.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                        >
                            {loading ? "جاري الإضافة..." : `إضافة الباقة (${customSelectedTemplateIds.length})`}
                        </Button>
                    ) : selectedBundle ? (
                        <Button
                            type="button"
                            onClick={handleAddBundle}
                            disabled={loading || selectedTrackers.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                        >
                            {loading ? "جاري الإضافة..." : `إضافة (${selectedTrackers.length})`}
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
