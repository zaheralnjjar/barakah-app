import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Need to ensure it exists or use Input
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// I'll use a simple Input type="date" for now or standard Shadcn Popover+Calendar if available
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tracker } from "@/types/tracking";
import { trackingService } from "@/services/trackingService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddEntryDialogProps {
    tracker: Tracker;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
    value: z.number(),
    data: z.any().optional(),
    date: z.date(),
    note: z.string().optional(),
});

export function AddEntryDialog({ tracker, open, onOpenChange }: AddEntryDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: tracker.type === 'boolean' ? 1 : 0,
            date: new Date(),
            note: "",
        },
    });

    // Reset form when dialog opens to ensure fresh state
    useEffect(() => {
        if (open) {
            form.reset({
                value: tracker.type === 'boolean' ? 1 : 0,
                date: new Date(),
                note: "",
                data: {}, // Reset data too
            });
        }
    }, [open, tracker, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await trackingService.addEntry({
                tracker_id: tracker.id,
                value: values.value,
                data: values.data,
                date: values.date,
                note: values.note,
            });

            toast.success("تم إضافة السجل");
            onOpenChange(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["tracker-entries", tracker.id] });
            queryClient.invalidateQueries({ queryKey: ["tracker-latest", tracker.id] });
            queryClient.invalidateQueries({ queryKey: ["trackers"] }); // To update summary potentially
        } catch (error: any) {
            console.error("Error adding entry:", error);
            toast.error(`فشل إضافة السجل: ${error.message || 'خطأ غير معروف'}`, { id: 'add-entry' });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">تسجيل جديد</DialogTitle>
                    <DialogDescription className="text-right">
                        إضافة بيانات لـ {tracker.name}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="space-y-4">



                        {/* Value Field based on Type */}
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>القيمة</FormLabel>
                                    <FormControl>
                                        {/* Render input based on type */}
                                        {tracker.type === 'numeric' ? (
                                            <div className="flex items-center gap-2 flex-row-reverse">
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ''}
                                                    onChange={e => {
                                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                        field.onChange(val);
                                                    }}
                                                    className="text-right"
                                                />
                                                <span className="text-sm text-gray-500">{tracker.settings.unit}</span>
                                            </div>
                                        ) : tracker.type === 'scale' ? (
                                            <div className="py-4">
                                                <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                                                    <span>{tracker.settings.min || 1}</span>
                                                    <span>{tracker.settings.max || 10}</span>
                                                </div>
                                                <Slider
                                                    min={tracker.settings.min || 1}
                                                    max={tracker.settings.max || 10}
                                                    step={1}
                                                    value={[field.value]}
                                                    onValueChange={(vals) => field.onChange(vals[0])}
                                                    dir="ltr"
                                                />
                                                <div className="text-center mt-2 font-bold">{field.value}</div>
                                            </div>
                                        ) : tracker.type === 'boolean' ? (
                                            <div className="flex items-center space-x-2 flex-row-reverse space-x-reverse">
                                                <Switch
                                                    checked={field.value === 1}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                                />
                                                <span>{field.value === 1 ? "تم الإنجاز" : "لم يتم"}</span>
                                            </div>
                                        ) : tracker.type === 'checklist' ? (
                                            <div className="space-y-3 border rounded-md p-4 bg-gray-50 dark:bg-black/20">
                                                {(tracker.settings.options || []).map((opt) => {
                                                    const currentChecked = form.getValues('data')?.checked || [];
                                                    const isChecked = currentChecked.includes(opt);
                                                    return (
                                                        <div key={opt} className="flex items-center space-x-2 space-x-reverse justify-end">
                                                            <label
                                                                htmlFor={`check-${opt}`}
                                                                className="text-sm font-medium leading-none cursor-pointer"
                                                            >
                                                                {opt}
                                                            </label>
                                                            <Checkbox
                                                                id={`check-${opt}`}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    const newChecked = checked
                                                                        ? [...currentChecked, opt]
                                                                        : currentChecked.filter((s: string) => s !== opt);

                                                                    form.setValue('data', { checked: newChecked });
                                                                    field.onChange(newChecked.length);
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : tracker.type === 'select' ? (
                                            <Select onValueChange={(val) => {
                                                const idx = (tracker.settings.options || []).indexOf(val);
                                                field.onChange(idx >= 0 ? idx + 1 : 1);
                                                form.setValue('data', { selected: val });
                                            }} defaultValue={form.getValues('data')?.selected}>
                                                <SelectTrigger className="flex-row-reverse">
                                                    <SelectValue placeholder="اختر..." />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl">
                                                    {(tracker.settings.options || []).map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : tracker.type === 'mood' ? (
                                            <div className="flex justify-between items-center px-2 py-4 bg-gray-50 dark:bg-black/20 rounded-xl">
                                                {['😢', '😕', '😐', '🙂', '😃'].map((emoji, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => field.onChange(idx + 1)}
                                                        className={cn(
                                                            "text-3xl hover:scale-125 transition-transform p-2 rounded-full",
                                                            field.value === idx + 1 ? "bg-white dark:bg-gray-700 shadow-md scale-110" : "opacity-50 hover:opacity-100"
                                                        )}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : tracker.type === 'time_range' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1 text-right">
                                                    <span className="text-xs text-muted-foreground">وقت البدء</span>
                                                    <Input
                                                        type="time"
                                                        className="text-center"
                                                        onChange={(e) => {
                                                            const startTime = e.target.value;
                                                            const currentData = form.getValues('data') || {};
                                                            form.setValue('data', { ...currentData, startTime });

                                                            // Calculate duration if end time exists
                                                            if (currentData.endTime) {
                                                                const start = new Date(`1970-01-01T${startTime}`);
                                                                const end = new Date(`1970-01-01T${currentData.endTime}`);
                                                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                                    let diff = (end.getTime() - start.getTime()) / 60000;
                                                                    if (diff < 0) diff += 24 * 60; // Handle cross midnight
                                                                    form.setValue('value', diff);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <span className="text-xs text-muted-foreground">وقت الانتهاء</span>
                                                    <Input
                                                        type="time"
                                                        className="text-center"
                                                        onChange={(e) => {
                                                            const endTime = e.target.value;
                                                            const currentData = form.getValues('data') || {};
                                                            form.setValue('data', { ...currentData, endTime });

                                                            // Calculate duration if start time exists
                                                            if (currentData.startTime) {
                                                                const start = new Date(`1970-01-01T${currentData.startTime}`);
                                                                const end = new Date(`1970-01-01T${endTime}`);
                                                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                                    let diff = (end.getTime() - start.getTime()) / 60000;
                                                                    if (diff < 0) diff += 24 * 60; // Handle cross midnight
                                                                    form.setValue('value', diff);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                type="number"
                                                placeholder="دقيقة"
                                                value={field.value ?? ''}
                                                onChange={e => {
                                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    field.onChange(val);
                                                }}
                                                className="text-right"
                                            />
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date Picker */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>التاريخ</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-right font-normal flex-row-reverse",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>اختر التاريخ</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Note */}
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ملاحظة</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ملاحظة اختيارية..." {...field} className="text-right" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">حفظ السجل</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
