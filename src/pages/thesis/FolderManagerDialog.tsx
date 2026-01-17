import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    FileText, FolderPlus, PenLine, ArrowUp, ArrowDown,
    Trash2, Folder, X, ChevronRight, FileIcon, Upload
} from "lucide-react";
import { ThesisNode } from "@/types/thesis";
import { FileSystemService } from "@/services/thesis/FileSystemService";
import { DocxGenerator } from "@/services/thesis/DocxGenerator";
import { ThesisService } from "@/services/thesis/ThesisService";
import { useAppointments } from "@/hooks/useAppointments";
import { Calendar, Bell } from "lucide-react";

interface FolderItem {
    name: string;
    type: 'file' | 'folder';
    handle?: FileSystemHandle;
}

interface FolderManagerDialogProps {
    open: boolean;
    onClose: () => void;
    node: ThesisNode | null;
    projectId: string;
    onRefresh: () => void;
    folderPath?: string;
    initialNodePath?: string[];
}

export function FolderManagerDialog({
    open,
    onClose,
    node,
    projectId,
    onRefresh,
    folderPath,
    initialNodePath = []
}: FolderManagerDialogProps) {
    const [contents, setContents] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Milestone State
    const [milestoneDate, setMilestoneDate] = useState("");
    const [reminderDate, setReminderDate] = useState("");
    const { addAppointment } = useAppointments();

    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [addToStructure, setAddToStructure] = useState(false);
    const [currentPath, setCurrentPath] = useState<string[]>([]);

    // File Order State
    const [fileOrder, setFileOrder] = useState<string[]>([]);

    useEffect(() => {
        if (open && node) {
            setMilestoneDate(node.milestone_date ? new Date(node.milestone_date).toISOString().split('T')[0] : "");
            setReminderDate(node.reminder_date ? new Date(node.reminder_date).toISOString().split('T')[0] : "");
            setFileOrder(node.file_order || []);
            loadFolderContents();
        } else {
            setCurrentPath([]);
        }
    }, [open, node]);

    // Effect to reload when path changes or dialog opens
    useEffect(() => {
        if (open && node) {
            // Milestone init
            setMilestoneDate(node.milestone_date || "");
            setReminderDate(node.reminder_date || "");
            loadFolderContents();
        }
    }, [open, node, currentPath]);

    // Reset path when node changes
    useEffect(() => {
        setCurrentPath([]);
    }, [node?.id]);

    const loadFolderContents = async () => {
        if (!node) return;
        setLoading(true);

        try {
            const rootHandle = await FileSystemService.getDirectoryHandle();
            if (!rootHandle) {
                setContents([]);
                setLoading(false);
                return;
            }

            if (!rootHandle) {
                setContents([]);
                setLoading(false);
                return;
            }

            // Use initialNodePath passed from parent (full path to this node)
            const nodePath = initialNodePath.length > 0 ? initialNodePath : [FileSystemService.sanitizeFolderName(node.title)];

            // Combine node path + current navigation path
            const fullPath = [...nodePath, ...currentPath];

            let currentHandle = rootHandle;

            for (const folderName of fullPath) {
                const foundHandle = await FileSystemService.findDirectoryByName(currentHandle, folderName);
                if (foundHandle) {
                    currentHandle = foundHandle;
                } else {
                    // Try exact create/get if we are in "create" mode logic? 
                    // No, here we just want to READ.
                    // If not found, show error.
                    console.error(`Path not found: ${folderName}`);
                    setContents([]);
                    setLoading(false);
                    return;
                }
            }

            const items: FolderItem[] = [];
            for await (const [name, handle] of (currentHandle as any).entries()) {
                items.push({
                    name,
                    type: handle.kind === 'directory' ? 'folder' : 'file',
                    handle
                });
            }

            setContents(items);
        } catch (error) {
            console.error("Error loading folder:", error);
            setContents([]);
        } finally {
            setLoading(false);
        }
    };

    const sortContents = (items: FolderItem[]) => {
        // Sort by: Folders first (alphabetical), then Files (by fileOrder, then alphabetical)
        return items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

            if (a.type === 'file') {
                const indexA = fileOrder.indexOf(a.name);
                const indexB = fileOrder.indexOf(b.name);

                // If both are in order list, sort by index
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // If one is in list, it comes first
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
            }

            return a.name.localeCompare(b.name);
        });
    };

    const sortedContents = sortContents([...contents]);

    async function handleMoveFile(fileName: string, direction: 'up' | 'down') {
        if (!node) return;

        // Get current file names in displayed order (filtered for files only)
        const currentFiles = sortedContents.filter(c => c.type === 'file').map(c => c.name);
        const index = currentFiles.indexOf(fileName);

        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === currentFiles.length - 1) return;

        const newOrder = [...currentFiles];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];

        // Update state locally for instant feedback
        setFileOrder(newOrder);

        // Save to DB
        try {
            await ThesisService.updateNode(node.id, { file_order: newOrder });
        } catch (error) {
            console.error(error);
            toast.error("فشل حفظ الترتيب");
        }
    }

    // Local buildNodePath removed - we use initialNodePath prop


    const handleCreateWord = async () => {
        if (!node) return;

        try {
            const rootHandle = await FileSystemService.getDirectoryHandle();
            if (!rootHandle) {
                toast.error("يرجى اختيار مجلد أولاً");
                return;
            }

            if (!rootHandle) {
                toast.error("يرجى اختيار مجلد أولاً");
                return;
            }

            const nodePath = initialNodePath.length > 0 ? initialNodePath : [FileSystemService.sanitizeFolderName(node.title)];
            // Use current navigation path so creating word file happens inside current folder
            const fullPath = [...nodePath, ...currentPath];

            let currentHandle = rootHandle;
            for (const folderName of fullPath) {
                currentHandle = await currentHandle.getDirectoryHandle(folderName, { create: true });
            }

            const filename = FileSystemService.sanitizeFolderName(node.title) + ".docx";

            try {
                await currentHandle.getFileHandle(filename);
                toast.error("الملف موجود بالفعل");
                return;
            } catch {
                // Continue
            }

            const blob = await DocxGenerator.generateNodeDoc(node);
            const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            toast.success("تم إنشاء الملف");
            loadFolderContents();
        } catch (error) {
            console.error(error);
            toast.error("فشل إنشاء الملف");
        }
    };

    const handleImportFile = async () => {
        if (!node) return;

        try {
            // @ts-ignore
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Documents',
                        accept: {
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                            'application/pdf': ['.pdf'],
                            'text/plain': ['.txt']
                        }
                    }
                ],
                multiple: false
            });

            const file = await fileHandle.getFile();

            const rootHandle = await FileSystemService.getDirectoryHandle();
            if (!rootHandle) {
                toast.error("يرجى اختيار مجلد أولاً");
                return;
            }

            const nodePath = initialNodePath.length > 0 ? initialNodePath : [FileSystemService.sanitizeFolderName(node.title)];
            const fullPath = [...nodePath, ...currentPath];
            let currentHandle = rootHandle;
            for (const folderName of fullPath) {
                const foundHandle = await FileSystemService.findDirectoryByName(currentHandle, folderName);
                if (foundHandle) {
                    currentHandle = foundHandle;
                } else {
                    throw new Error(`Path not found: ${folderName}`);
                }
            }

            const newFileHandle = await currentHandle.getFileHandle(file.name, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(await file.arrayBuffer());
            await writable.close();

            toast.success("تم استيراد الملف");
            loadFolderContents();
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error(error);
                toast.error("فشل استيراد الملف");
            }
        }
    };

    const handleCreateSubfolder = async () => {
        if (!newFolderName.trim() || !node) {
            toast.error("يرجى إدخال اسم المجلد");
            return;
        }

        try {
            const rootHandle = await FileSystemService.getDirectoryHandle();
            if (!rootHandle) {
                toast.error("يرجى اختيار مجلد أولاً");
                return;
            }

            const nodePath = initialNodePath.length > 0 ? initialNodePath : [FileSystemService.sanitizeFolderName(node.title)];
            const fullPath = [...nodePath, ...currentPath];
            let currentHandle = rootHandle;
            for (const folderName of fullPath) {
                const foundHandle = await FileSystemService.findDirectoryByName(currentHandle, folderName);
                if (foundHandle) {
                    currentHandle = foundHandle;
                } else {
                    throw new Error(`Path not found: ${folderName}`);
                }
            }

            const sanitizedName = FileSystemService.sanitizeFolderName(newFolderName);
            await currentHandle.getDirectoryHandle(sanitizedName, { create: true });

            // Option: Add to Structure (Database)
            if (addToStructure) {
                // If we are deep inside folders, adding to structure might carry ambiguity 
                // about where exactly to link it in DB if the folder hierarchy doesn't match DB hierarchy perfectly.
                // For now, we assume: if I create a folder here, I want it as a child of the CURRENT Node (if at root) 
                // OR as a child of the node corresponding to the current folder (complex).

                // Simplified: Add as child of 'node'. 
                // NOTE: If we are in a subfolder, creating a DB node as child of 'node' is correct conceptually 
                // but physically the file is elsewhere.  Usage suggests matching hierarchy.

                // Let's stick to simple logic: New node is child of current 'node'. 
                // User can reorder later.

                await ThesisService.addNode({
                    project_id: projectId,
                    parent_id: node.id,
                    title: newFolderName,
                    type: 'section', // default
                    order_index: (node.children?.length || 0) + 1
                });
                toast.success("تم إنشاء المجلد وإضافته للهيكل");
                onRefresh(); // Refresh structure tree
            } else {
                toast.success("تم إنشاء المجلد");
            }

            setCreatingFolder(false);
            setNewFolderName("");
            setAddToStructure(false);
            loadFolderContents();
        } catch (error) {
            console.error(error);
            toast.error("فشل إنشاء المجلد");
        }
    };

    const navigateInto = (folderName: string) => {
        setCurrentPath(prev => [...prev, folderName]);
    };

    const navigateUp = () => {
        setCurrentPath(prev => prev.slice(0, -1));
    };

    const handleRename = async () => {
        if (!node || !newName.trim()) return;

        try {
            await ThesisService.updateNode(node.id, { title: newName });
            toast.success("تم تحديث الاسم");
            setRenaming(false);
            onRefresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("فشل إعادة التسمية");
        }
    };

    const handleMoveUp = async () => {
        if (!node) return;
        try {
            const newOrder = Math.max(0, (node.order_index || 0) - 1);
            await ThesisService.updateNode(node.id, { order_index: newOrder });
            toast.success("تم النقل لأعلى");
            onRefresh();
        } catch (error) {
            toast.error("فشل النقل");
        }
    };

    const handleMoveDown = async () => {
        if (!node) return;
        try {
            const newOrder = (node.order_index || 0) + 1;
            await ThesisService.updateNode(node.id, { order_index: newOrder });
            toast.success("تم النقل لأسفل");
            onRefresh();
        } catch (error) {
            toast.error("فشل النقل");
        }
    };

    const handleSaveSchedule = async () => {
        if (!node) return;

        try {
            // 1. Update Node (Original Logic)
            await ThesisService.updateNode(node.id, {
                milestone_date: milestoneDate,
                reminder_date: reminderDate
            });

            // 2. Global Barakah System (Appointments)
            if (milestoneDate) {
                // Appointment for Deadline
                await addAppointment({
                    title: `تسليم: ${node.title}`,
                    date: milestoneDate,
                    time: "09:00",
                    notes: "تمت الجدولة من مدير الهيكل (موعد نهائي)",
                    location: "العمل على الرسالة"
                });

                // 3. Academic Calendar (ThesisMilestones)
                await ThesisService.saveMilestone({
                    project_id: projectId,
                    title: `تسليم: ${node.title}`,
                    date: milestoneDate,
                    type: 'deadline',
                    notes: `موعد نهائي للفصل/المبحث: ${node.title}`
                });

                // 4. Academic Tasks (ThesisTasks)
                await ThesisService.saveTask({
                    project_id: projectId,
                    title: `إنجاز: ${node.title}`,
                    status: 'pending',
                    priority: 'high',
                    end_date: milestoneDate, // Due date
                    chapter_id: node.id,     // Link to this specific node
                    completed: false,
                    notes: "تم إنشاؤها تلقائياً عند تحديد موعد المجازة"
                });

                // Also schedule reminder if separate date
                if (reminderDate && reminderDate !== milestoneDate) {
                    await addAppointment({
                        title: `تذكير: ${node.title}`,
                        date: reminderDate,
                        time: "09:00",
                        notes: "تذكير قبل موعد التسليم",
                    });
                }
            }

            toast.success("تمت المزامنة: أضيفت للمهام، تقويم القسم، والتقويم العام");
        } catch (error) {
            console.error(error);
            toast.error("فشل حفظ المواعيد");
        }
    };

    const handleDelete = async () => {
        if (!node) return;
        if (!confirm("هل تريد حذف هذا العنصر؟")) return;

        try {
            await ThesisService.deleteNode(node.id);
            toast.success("تم الحذف");
            onRefresh();
            onClose();
        } catch (error) {
            toast.error("فشل الحذف");
        }
    };

    const handleOpenItem = async (item: FolderItem) => {
        if (!folderPath) {
            // Fallback for no project path - only for files
            if (item.type === 'file') {
                toast.info("جاري تحميل الملف...", {
                    description: "لم يتم تحديد مجلد المشروع الرئيسي، لذلك سيتم التحميل.",
                });
                downloadFile(item);
            }
            return;
        }

        const fullPath = [folderPath, ...currentPath, item.name].join('/');

        // 1. Try Native Shell Open (Electron)
        const opened = await FileSystemService.openInShell(fullPath);
        if (opened) {
            // toast.success("تم الفتح في المستكشف"); // Optional: clean experience presumably doesn't need toast if it works
            return;
        }

        // 2. Fallback to Copy Path (Browser)
        try {
            await navigator.clipboard.writeText(fullPath);
            toast.success("تم نسخ المسار", {
                description: "بسبب قيود المتصفح، لا يمكن فتح المجلد مباشرة. الصق المسار في Finder.",
                duration: 4000,
                action: item.type === 'file' ? {
                    label: "تحميل",
                    onClick: () => downloadFile(item)
                } : undefined
            });
        } catch (err) {
            toast.error("فشل نسخ المسار");
        }
    };

    const downloadFile = async (item: FolderItem) => {
        if (!item.handle) return;
        try {
            const file = await (item.handle as FileSystemFileHandle).getFile();
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (e) {
            console.error(e);
            toast.error("فشل التحميل");
        }
    };

    if (!node) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Folder className="w-5 h-5 text-amber-500" />
                        <span>{node.title}</span>
                        {currentPath.length > 0 && (
                            <>
                                <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                                <span className="text-sm text-muted-foreground">{currentPath.join(' / ')}</span>
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    {/* Primary Actions Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCreateWord} className="gap-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>ملف Word</span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={handleImportFile} className="gap-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                            <Upload className="w-4 h-4 text-emerald-500" />
                            <span>استيراد</span>
                        </Button>

                        <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

                        <Button variant="ghost" size="sm" onClick={() => setCreatingFolder(true)} className="gap-1.5 hover:bg-indigo-50 hover:text-indigo-600">
                            <FolderPlus className="w-4 h-4" />
                            <span>مجلد فرعي</span>
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => { setNewName(node.title); setRenaming(true); }} className="gap-1.5 hover:bg-amber-50 hover:text-amber-600">
                            <PenLine className="w-4 h-4" />
                            <span>تسمية</span>
                        </Button>
                    </div>

                    {/* Secondary/Navigation Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1">
                            {currentPath.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={navigateUp} className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground">
                                    <ArrowUp className="w-3.5 h-3.5" />
                                    <span className="text-xs">للأعلى</span>
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="flex rounded-md shadow-sm">
                                <Button variant="outline" size="sm" onClick={handleMoveUp} className="h-8 w-8 p-0 rounded-l-none border-l-0" title="تحريك لأعلى">
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleMoveDown} className="h-8 w-8 p-0 rounded-r-none" title="تحريك للأسفل">
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 px-2 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1">
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-xs">حذف</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Milestone & Reminder Section */}
                <div className="mx-3 mb-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> موعد المجازة (Deadline)
                        </Label>
                        <div className="flex gap-1">
                            <Input
                                type="date"
                                className="h-8 w-32 bg-white text-xs"
                                value={milestoneDate}
                                onChange={e => setMilestoneDate(e.target.value)}
                            />
                            <Input
                                type="time"
                                className="h-8 w-24 bg-white text-xs"
                            // Add state for time if needed, or rely on date only for now as requested
                            // For now we keep it simple or add time state later if requested explicitly for folders
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Bell className="w-3 h-3" /> تذكير
                        </Label>
                        <div className="flex gap-1">
                            <Input
                                type="date"
                                className="h-8 w-32 bg-white text-xs"
                                value={reminderDate}
                                onChange={e => setReminderDate(e.target.value)}
                            />
                            <Input
                                type="time"
                                className="h-8 w-24 bg-white text-xs"
                            />
                        </div>
                    </div>
                    <Button size="sm" onClick={handleSaveSchedule} className="bg-indigo-600 hover:bg-indigo-700 h-8">
                        حفظ المواعيد
                    </Button>
                </div>

                {creatingFolder && (
                    <div className="flex gap-2 p-3 bg-blue-50 rounded-lg flex-shrink-0">
                        <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="اسم المجلد الجديد"
                            className="flex-1"
                            dir="rtl"
                        />
                        <div className="flex items-center gap-2 bg-white px-2 rounded border">
                            <Checkbox
                                id="addToStructure"
                                checked={addToStructure}
                                onCheckedChange={(c) => setAddToStructure(c === true)}
                            />
                            <Label htmlFor="addToStructure" className="text-sm cursor-pointer select-none">إضافة للهيكل</Label>
                        </div>
                        <Button size="sm" onClick={handleCreateSubfolder}>إنشاء</Button>
                        <Button size="sm" variant="ghost" onClick={() => setCreatingFolder(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {renaming && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-lg flex-shrink-0">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="الاسم الجديد"
                            className="flex-1"
                            dir="rtl"
                        />
                        <Button size="sm" onClick={handleRename}>حفظ</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <div className="flex-1 overflow-auto border rounded-lg p-2 min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            جاري التحميل...
                        </div>
                    ) : contents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Folder className="w-12 h-12 opacity-30" />
                            <span>المجلد فارغ</span>
                            <span className="text-sm">استخدم الأزرار أعلاه لإضافة محتوى</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sortedContents.map((item, index) => (
                                <div
                                    key={index}
                                    className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors select-none"
                                    onClick={() => handleOpenItem(item)}
                                >
                                    {/* Reorder Buttons (Files Only) showing on hover */}
                                    {item.type === 'file' && (
                                        <div className="hidden group-hover:flex flex-col -ml-1 mr-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => { e.stopPropagation(); handleMoveFile(item.name, 'up'); }}
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => { e.stopPropagation(); handleMoveFile(item.name, 'down'); }}
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {item.type === 'folder' ? (
                                        <Folder className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <FileIcon className="w-5 h-5 text-blue-500" />
                                    )}
                                    <span className="flex-1 text-right">{item.name}</span>

                                    {/* Navigation Button for Folders */}
                                    {item.type === 'folder' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-gray-200"
                                            title="الدخول إلى المجلد"
                                            onClick={(e) => { e.stopPropagation(); navigateInto(item.name); }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    )}

                                    {item.type === 'file' && (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground p-2 bg-muted/30 rounded flex-shrink-0">
                    <span>📁 {contents.filter(c => c.type === 'folder').length} مجلدات</span>
                    <span>📄 {contents.filter(c => c.type === 'file').length} ملفات</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
