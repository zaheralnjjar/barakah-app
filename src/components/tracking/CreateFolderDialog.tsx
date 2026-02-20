import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trackingService } from "@/services/trackingService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "اسم المجلد مطلوب"),
});

interface CreateFolderDialogProps {
    children?: React.ReactNode;
}

export function CreateFolderDialog({ children }: CreateFolderDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await trackingService.createFolder(values.name);
            toast.success("تم إنشاء المجلد بنجاح");
            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["tracker-folders"] });
        } catch (error) {
            console.error("Failed to create folder:", error);
            toast.error("فشل إنشاء المجلد");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="icon" className="rounded-full">
                        <FolderPlus className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">مجلد جديد</DialogTitle>
                    <DialogDescription className="text-right">
                        قم بإنشاء مجلد لتنظيم متتبعاتك.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم المجلد</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: الصحة، العبادات" {...field} className="text-right" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">إنشاء المجلد</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
