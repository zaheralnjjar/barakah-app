import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tracker, CreateTrackerDTO } from "@/types/tracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { trackingService } from "@/services/trackingService";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "يجب أن يكون اسم المتتبع حرفين على الأقل.",
    }),
    icon: z.string().optional(),
    color: z.string().optional(),
    goal: z.string().optional(),
    unit: z.string().optional(),
    min: z.string().optional(),
    max: z.string().optional(),
});

interface EditTrackerDialogProps {
    tracker: Tracker;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTrackerDialog({ tracker, open, onOpenChange }: EditTrackerDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: tracker.name,
            icon: tracker.icon,
            color: tracker.color,
            goal: tracker.settings.goal?.toString(),
            unit: tracker.settings.unit,
            min: tracker.settings.min?.toString(),
            max: tracker.settings.max?.toString(),
        },
    });

    // Reset form when tracker changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: tracker.name,
                icon: tracker.icon,
                color: tracker.color,
                goal: tracker.settings.goal?.toString(),
                unit: tracker.settings.unit,
                min: tracker.settings.min?.toString(),
                max: tracker.settings.max?.toString(),
            });
        }
    }, [open, tracker, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const updates: Partial<CreateTrackerDTO> = {
                name: values.name,
                icon: values.icon,
                color: values.color,
                type: tracker.type, // Type usually shouldn't change easily as it breaks history
                settings: {
                    ...tracker.settings,
                    goal: values.goal ? Number(values.goal) : undefined,
                    unit: values.unit,
                    min: values.min ? Number(values.min) : undefined,
                    max: values.max ? Number(values.max) : undefined,
                }
            };

            await trackingService.updateTracker(tracker.id, updates);

            toast.success("تم تحديث المتتبع بنجاح");
            queryClient.invalidateQueries({ queryKey: ["trackers"] });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء التحديث");
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
                        {(tracker.type === 'numeric' || tracker.type === 'time' || tracker.type === 'scale') && (
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

                        <DialogFooter>
                            <Button type="submit">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
