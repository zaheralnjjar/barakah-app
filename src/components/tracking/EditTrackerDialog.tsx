import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tracker, CreateTrackerDTO } from "@/types/tracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { trackingService } from "@/services/trackingService";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "يجب أن يكون اسم المتتبع حرفين على الأقل.",
    }),
    icon: z.string().optional(),
    folder_id: z.string().optional(),
    color: z.string().optional(),
    goal: z.string().optional(),
    unit: z.string().optional(),
    min: z.string().optional(),
    max: z.string().optional(),
    quick_add_increment: z.string().optional(),
    settings: z.object({
        chart_type: z.string().optional(),
    }).optional()
});

interface EditTrackerDialogProps {
    tracker: Tracker;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTrackerDialog({ tracker, open, onOpenChange }: EditTrackerDialogProps) {
    const queryClient = useQueryClient();

    const { data: folders } = useQuery({
        queryKey: ['tracker-folders'],
        queryFn: trackingService.getFolders
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: tracker.name,
            icon: tracker.icon,
            color: tracker.color,
            folder_id: tracker.folder_id || "none",
            goal: tracker.settings.goal?.toString(),
            unit: tracker.settings.unit,
            min: tracker.settings.min?.toString(),
            max: tracker.settings.max?.toString(),
            quick_add_increment: tracker.quick_add_increment?.toString() || "",
        },
    });

    // Reset form when tracker changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: tracker.name,
                icon: tracker.icon,
                color: tracker.color,
                folder_id: tracker.folder_id || "none",
                goal: tracker.settings.goal?.toString(),
                unit: tracker.settings.unit,
                min: tracker.settings.min?.toString(),
                max: tracker.settings.max?.toString(),
                quick_add_increment: tracker.quick_add_increment?.toString() || "",
            });
        }
    }, [open, tracker, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const safeNumber = (val: any) => {
                if (val === undefined || val === null || val === "") return undefined;
                const n = Number(val);
                return isNaN(n) ? undefined : n;
            };

            const updates: Partial<CreateTrackerDTO> = {
                name: values.name,
                icon: values.icon,
                color: values.color,
                folder_id: values.folder_id === "none" ? null : values.folder_id,
                quick_add_increment: safeNumber(values.quick_add_increment),
                type: tracker.type, // Type usually shouldn't change easily as it breaks history
                settings: {
                    ...tracker.settings,
                    goal: safeNumber(values.goal),
                    unit: values.unit,
                    min: safeNumber(values.min),
                    max: safeNumber(values.max),
                    chart_type: values.settings?.chart_type,
                }
            };

            await trackingService.updateTracker(tracker.id, updates);

            toast.success("تم تحديث المتتبع بنجاح");
            queryClient.invalidateQueries({ queryKey: ["trackers"] });
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "حدث خطأ أثناء التحديث");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل المتتبع</DialogTitle>
                    <DialogDescription className="text-right">
                        قم بتعديل بيانات المتتبع.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثلاً: شرب الماء" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="folder_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المجلد</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="flex-row-reverse">
                                                <SelectValue placeholder="اختر المجلد" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="none">بدون مجلد</SelectItem>
                                            {folders?.map(folder => (
                                                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الأيقونة</FormLabel>
                                        <FormControl>
                                            <Input placeholder="مثلاً: 💧" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اللون (Hex)</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded border" style={{ backgroundColor: field.value }}></div>
                                                <Input placeholder="#3B82F6" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Conditional Settings based on what's relevant. For simplicity, showing Goal/Unit for numeric/time */}
                        {(tracker.type === 'numeric' || tracker.type === 'scale') && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="goal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الهدف اليومي</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {tracker.type === 'numeric' && (
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>الوحدة</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="لتر، صفحة..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {(tracker.type === 'numeric' || tracker.type === 'scale') && (
                            <FormField
                                control={form.control}
                                name="quick_add_increment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>قيمة الإضافة السريعة (+)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="مثال: 5، 1000" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            سيظهر زر للإضافة السريعة بهذه القيمة.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        )}

                        {(tracker.type === 'numeric' || tracker.type === 'scale') && (
                            <FormField
                                control={form.control}
                                name="settings.chart_type"
                                render={({ field }) => (
                                    <FormItem className="mt-4">
                                        <FormLabel>نوع الرسم البياني</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={tracker.settings?.chart_type || "area"}>
                                            <FormControl>
                                                <SelectTrigger className="flex-row-reverse">
                                                    <SelectValue placeholder="اختر نوع الرسم" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent dir="rtl">
                                                <SelectItem value="area">مساحة (Area Chart) - الافتراضي</SelectItem>
                                                <SelectItem value="bar">أعمدة (Bar Chart)</SelectItem>
                                                <SelectItem value="line">خط (Line Chart)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
