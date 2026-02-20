import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import { trackingService } from "@/services/trackingService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TrackerType } from "@/types/tracking";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    name: z.string().min(1, "الاسم مطلوب"),
    type: z.enum(["numeric", "scale", "boolean", "text", "time", "select", "checklist", "mood", "time_range"] as const),
    icon: z.string().optional(),
    color: z.string().optional(),
    settings: z.object({
        min: z.string().optional(), // Inputs are strings initially
        max: z.string().optional(),
        unit: z.string().optional(),
        step: z.string().optional(),
        goal: z.string().optional(),
        options: z.string().optional(), // Newline separated for input
        allowCustom: z.string().optional(), // Checkbox state
    }).optional(),
});

// ...

<SelectContent dir="rtl">
    <SelectItem value="numeric">رقمي (عدد، كمية)</SelectItem>
    <SelectItem value="scale">مقياس (1-5، 1-10)</SelectItem>
    <SelectItem value="boolean">نعم/لا (إنجاز)</SelectItem>
    <SelectItem value="select">قائمة اختيار (خيارات محددة)</SelectItem>
    <SelectItem value="checklist">قائمة تحقق (قائمة مهام)</SelectItem>
    <SelectItem value="time">وقت (مدة)</SelectItem>
    <SelectItem value="text">نص (ملاحظات)</SelectItem>
</SelectContent>

// ...



interface CreateTrackerDialogProps {
    children?: React.ReactNode;
}

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#10B981",
    "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#D946EF",
    "#F43F5E", "#64748B"
];

export function CreateTrackerDialog({ children }: CreateTrackerDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "numeric",
            icon: "⚡️",
            color: "#3B82F6",
            settings: {},
        },
    });

    const selectedType = form.watch("type");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Process settings to numbers/arrays
            const processedSettings: any = { ...values.settings };
            if (values.settings?.min) processedSettings.min = Number(values.settings.min);
            if (values.settings?.max) processedSettings.max = Number(values.settings.max);
            if (values.settings?.step) processedSettings.step = Number(values.settings.step);
            if (values.settings?.goal) processedSettings.goal = Number(values.settings.goal);
            if (values.settings?.options) {
                processedSettings.options = values.settings.options.split('\n').map(s => s.trim()).filter(Boolean);
            }
            if (values.settings?.allowCustom) {
                processedSettings.allowCustom = values.settings.allowCustom === 'true';
            }

            console.log("Creating tracker with values:", values);
            console.log("Processed settings:", processedSettings);

            await trackingService.createTracker({
                name: values.name,
                type: values.type,
                icon: values.icon,
                color: values.color,
                settings: processedSettings,
            });

            toast.success("تم إنشاء المتعقب بنجاح!");
            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["trackers"] });
        } catch (error) {
            console.error("Failed to create tracker:", error);
            toast.error("فشل إنشاء المتعقب (تأكد من صحة البيانات)");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button>متعقب جديد</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء متعقب جديد</DialogTitle>
                    <DialogDescription className="text-right">
                        أضف عادة أو هدفاً جديداً لمتابعته يومياً.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="flex gap-4 flex-row-reverse">
                            {/* Icon Picker */}
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الأيقونة</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-[60px] h-[60px] text-2xl h-10 p-0 flex items-center justify-center">
                                                        {field.value || "⚡️"}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0 border-none">
                                                <EmojiPicker onEmojiClick={(e) => field.onChange(e.emoji)} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>الاسم</FormLabel>
                                        <FormControl>
                                            <Input placeholder="مثال: شرب الماء، القراءة" {...field} className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Type */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>النوع</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="flex-row-reverse">
                                                <SelectValue placeholder="اختر النوع" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="numeric">رقمي (عدد، كمية)</SelectItem>
                                            <SelectItem value="scale">مقياس (1-5، 1-10)</SelectItem>
                                            <SelectItem value="boolean">نعم/لا (إنجاز)</SelectItem>
                                            <SelectItem value="select">قائمة اختيار (خيارات محددة)</SelectItem>
                                            <SelectItem value="time">وقت (مدة)</SelectItem>
                                            <SelectItem value="text">نص (ملاحظات)</SelectItem>
                                            <SelectItem value="mood">الحالة المزاجية (وجوه تعبيرية)</SelectItem>
                                            <SelectItem value="time_range">نطاق زمني (من - إلى)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-right">
                                        {selectedType === 'numeric' && "لتتبع أرقام مثل لترات الماء، صفحات القراءة."}
                                        {selectedType === 'scale' && "لتتبع تقييمات شخصية مثل المزاج أو الطاقة."}
                                        {selectedType === 'boolean' && "لتتبع الإنجاز البسيط مثل 'هل صليت؟'."}
                                        {selectedType === 'select' && "لاختيار قيمة من قائمة محددة مسبقاً."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Type Specific Settings */}
                        {(selectedType === 'numeric' || selectedType === 'scale') && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="settings.min"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الحد الأدنى</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="settings.max"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الحد الأقصى</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {selectedType === 'numeric' && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="settings.unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الوحدة</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="مثال: مل، صفحة" {...field} className="text-right" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="settings.goal"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الهدف اليومي</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="القيمة المستهدفة" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {(selectedType === 'select' || selectedType === 'checklist') && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="settings.options"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-right block">الخيارات (خيار في كل سطر)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="الجزء الأول&#10;الجزء الثاني&#10;الجزء الثالث"
                                                    className="text-right min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-right">
                                                اكتب كل خيار في سطر منفصل.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="settings.allowCustom"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-end space-x-2 space-x-reverse space-y-0 rounded-md border p-4 mt-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value === 'true'}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none text-right">
                                                <FormLabel>
                                                    السماح بخيار "أخرى"
                                                </FormLabel>
                                                <FormDescription>
                                                    السماح بإضافة قيم مخصصة عند التسجيل.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Color Picker */}
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اللون</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <div
                                                key={color}
                                                className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${field.value === color ? "border-black scale-110" : "border-transparent"
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => field.onChange(color)}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">إنشاء المتعقب</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
