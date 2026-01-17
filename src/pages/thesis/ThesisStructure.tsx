
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisNode, NODE_STATUS_CONFIG } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ThesisNodeItem from './components/ThesisNodeItem';
import { ArrowLeft, Plus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit, FileDown, BookOpen, GitBranch, List, Home, FolderOpen, RefreshCw, Merge, Scissors, MoreVertical, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DocxGenerator } from '@/services/thesis/DocxGenerator';
import { FileSystemService } from '@/services/thesis/FileSystemService';
import { FolderManagerDialog } from './FolderManagerDialog';

export default function ThesisStructure() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [structure, setStructure] = useState<ThesisNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [folderPath, setFolderPath] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Dialog State
    const [showDialog, setShowDialog] = useState(false);
    const [editingNode, setEditingNode] = useState<ThesisNode | null>(null);
    const [parentNode, setParentNode] = useState<ThesisNode | null>(null);
    const [formData, setFormData] = useState({ title: '', type: 'chapter' });

    // Folder Manager Dialog State
    const [selectedFolderNode, setSelectedFolderNode] = useState<ThesisNode | null>(null);
    const [nodeFileStatus, setNodeFileStatus] = useState<Record<string, boolean>>({});

    // Appointment Dialog State
    const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
    const [appointmentData, setAppointmentData] = useState({ milestone_date: '', reminder_date: '' });

    // Check for file existence recursively
    const checkFilesExistence = async (nodes: ThesisNode[]) => {
        if (!folderPath || !FileSystemService.isSupported()) return;

        const newStatuses: Record<string, boolean> = {};

        const checkNode = async (node: ThesisNode) => {
            const path = buildNodePath(node);
            const hasFile = await FileSystemService.checkNodeHasFile(path, node.title);
            newStatuses[node.id] = hasFile;

            if (node.children) {
                for (const child of node.children) {
                    await checkNode(child);
                }
            }
        };

        for (const node of nodes) {
            await checkNode(node);
        }

        setNodeFileStatus(prev => ({ ...prev, ...newStatuses }));
    };

    useEffect(() => {
        if (structure.length > 0 && folderPath) {
            checkFilesExistence(structure);
        }
    }, [structure, folderPath]);


    // Helper to generate DOCX (Single Node)
    const generateDoc = async (node: ThesisNode) => {
        try {
            const projects = await ThesisService.getProjects();
            const project = projects.find(p => p.id === projectId);

            if (folderPath && FileSystemService.isSupported()) {
                const rootHandle = await FileSystemService.getDirectoryHandle();
                if (!rootHandle) {
                    toast.error("يرجى اختيار مجلد أولاً");
                    return;
                }

                // Build path to node's folder (this is the folder FOR this node)
                const nodePath = buildNodePath(node);

                // Navigate to or create the folder hierarchy
                let currentHandle = rootHandle;
                for (const folderName of nodePath) {
                    currentHandle = await currentHandle.getDirectoryHandle(folderName, { create: true });
                }

                // الملف يُنشأ داخل مجلد العنصر نفسه
                const sanitizedTitle = FileSystemService.sanitizeFolderName(node.title);
                const filename = `${sanitizedTitle}.docx`;

                let fileExists = false;
                let existingFileHandle: FileSystemFileHandle | null = null;
                try {
                    existingFileHandle = await currentHandle.getFileHandle(filename);
                    fileExists = true;
                } catch {
                    fileExists = false;
                }

                if (fileExists && existingFileHandle) {
                    // الملف موجود - تحميله للفتح
                    toast.info("جاري فتح الملف...");
                    const file = await existingFileHandle.getFile();
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success(`تم تحميل: ${filename} `);
                } else {
                    // إنشاء ملف جديد داخل مجلد العنصر
                    toast.info("جاري إنشاء الملف...");
                    const blob = await DocxGenerator.generateNodeDoc(node, project?.settings);

                    // حفظ الملف داخل المجلد الحالي (مجلد العنصر)
                    const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();

                    toast.success(`تم إنشاء الملف في: ${nodePath.join('/')}/${filename}`);
                }
            } else {
                // No folder selected - download file
                toast.info("جاري إنشاء الملف...");
                const blob = await DocxGenerator.generateNodeDoc(node, project?.settings);
                const filename = `${node.title}.docx`;
                saveAs(blob, filename);
                toast.success("تم تحميل الملف");
            }
        } catch (e) {
            console.error("File creation error:", e);
            const errorMessage = e instanceof Error ? e.message : "خطأ غير معروف";
            toast.error(`فشل إنشاء الملف: ${errorMessage}`);
        }
    };

    // Helper to build path to node's folder (with sanitized names - simple naming)
    const buildNodePath = (node: ThesisNode): string[] => {
        const path: string[] = [];
        const findPath = (nodes: ThesisNode[], targetId: string, currentPath: string[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const sanitizedTitle = FileSystemService.sanitizeFolderName(n.title);
                // Use simple naming (no prefix number)
                const folderName = sanitizedTitle;
                const newPath = [...currentPath, folderName];

                if (n.id === targetId) {
                    path.push(...newPath);
                    return true;
                }

                if (n.children && findPath(n.children, targetId, newPath)) {
                    return true;
                }
            }
            return false;
        };

        findPath(structure, node.id, []);
        return path;
    };

    useEffect(() => {
        if (projectId) loadStructure();
    }, [projectId]);

    async function loadStructure() {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await ThesisService.getStructure(projectId);
            setStructure(data);

            // Try to set folder path from project settings if available
            const projects = await ThesisService.getProjects();
            const project = projects.find(p => p.id === projectId);
            if (project) {
                if (project.path) {
                    setFolderPath(project.path);
                } else if (project.settings?.folderPath) {
                    setFolderPath(project.settings.folderPath);
                }
            }
            // Expand all by default
            const expandState: Record<string, boolean> = {};
            const traverse = (nodes: ThesisNode[]) => {
                nodes.forEach(n => {
                    expandState[n.id] = true;
                    if (n.children) traverse(n.children);
                });
            };
            traverse(data);
            setExpanded(expandState);
        } catch (error) {
            toast.error("فشل تحميل الهيكل");
        } finally {
            setLoading(false);
        }
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // File System Functions
    const handleSelectFolder = async () => {
        if (!FileSystemService.isSupported()) {
            toast.error('المتصفح لا يدعم File System Access API. استخدم Chrome أو Edge.');
            return;
        }

        try {
            const handle = await FileSystemService.requestProjectDirectory();
            if (handle) {
                setFolderPath(handle.name);
                toast.success(`تم اختيار المجلد: ${handle.name}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل اختيار المجلد');
        }
    };

    const handleCreateStructure = async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            toast.info('جاري إنشاء هيكل المجلدات والملفات...');

            const projects = await ThesisService.getProjects();
            const project = projects.find(p => p.id === projectId);

            if (!project) {
                toast.error('المشروع غير موجود');
                return;
            }

            // 1. Create folder structure
            await FileSystemService.createStructure(structure, undefined, '', project.settings);

            // 2. Create DOCX files for all nodes
            const createAllDocx = async (nodes: ThesisNode[], pathPrefix: string[] = []) => {
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const sanitizedTitle = FileSystemService.sanitizeFolderName(node.title);
                    const folderName = `${String(i + 1).padStart(2, '0')}_${sanitizedTitle}`;
                    const currentPath = [...pathPrefix, folderName];

                    // Generate and save DOCX
                    const blob = await DocxGenerator.generateNodeDoc(node, project.settings);
                    const filename = `${sanitizedTitle}.docx`;
                    await FileSystemService.saveDocxFile(blob, currentPath, filename);

                    // Process children recursively
                    if (node.children && node.children.length > 0) {
                        await createAllDocx(node.children, currentPath);
                    }
                }
            };

            await createAllDocx(structure);

            // 3. Create master document that links everything
            toast.info('جاري إنشاء الملف الرئيسي...');
            const masterBlob = await DocxGenerator.generateMasterDoc(project, structure);
            await FileSystemService.saveDocxFile(masterBlob, [], `${project.name}_الملف_الرئيسي.docx`);

            toast.success('تم إنشاء هيكل المجلدات والملفات والملف الرئيسي بنجاح ✓');
        } catch (error) {
            console.error(error);
            toast.error('فشل إنشاء هيكل المجلدات');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncFromFileSystem = async () => {
        if (!projectId) return;

        try {
            setIsSyncing(true);
            toast.info('جاري قراءة هيكل الملفات...');

            const fsStructure = await FileSystemService.readStructureFromFileSystem();

            // Get current DB structure for comparison
            // We need full structure, not just the state 'structure' which might be partial or filtered
            const dbStructure = await ThesisService.getStructure(projectId);

            await FileSystemService.syncToDatabase(
                projectId,
                dbStructure,
                fsStructure,
                (msg) => toast.info(msg)
            );

            toast.success('تمت المزامنة بنجاح ✓');
            await loadStructure();

        } catch (error) {
            console.error(error);
            toast.error(`فشل المزامنة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdd = (parent: ThesisNode | null) => {
        setParentNode(parent);
        setEditingNode(null);
        let type = 'chapter';
        if (parent?.type === 'chapter') type = 'section';
        if (parent?.type === 'section') type = 'subsection';
        if (parent?.type === 'subsection') type = 'branch';
        if (parent?.type === 'branch') type = 'issue';

        setFormData({ title: '', type });
        setShowDialog(true);
    };

    const handleEdit = (node: ThesisNode) => {
        setEditingNode(node);
        setParentNode(null);
        setFormData({ title: node.title, type: node.type });
        setShowDialog(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا القسم وكل محتوياته؟")) return;
        try {
            await ThesisService.deleteNode(id);
            toast.success("تم الحذف");
            loadStructure();
        } catch (e) {
            toast.error("فشل الحذف");
        }
    };

    // نقل عنصر لأعلى
    const handleMoveUp = async (nodeId: string) => {
        try {
            // Find node and its index
            const findNodeInfo = (nodes: ThesisNode[], parentId: string | null): { node: ThesisNode | null, index: number, siblings: ThesisNode[] } | null => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === nodeId) {
                        return { node: nodes[i], index: i, siblings: nodes };
                    }
                    if (nodes[i].children) {
                        const result = findNodeInfo(nodes[i].children!, nodes[i].id);
                        if (result) return result;
                    }
                }
                return null;
            };

            const info = findNodeInfo(structure, null);
            if (!info || info.index === 0) {
                toast.info("العنصر في أعلى القائمة بالفعل");
                return;
            }

            // Swap with previous node
            const prevNode = info.siblings[info.index - 1];
            await ThesisService.updateNode(info.node!.id, { order_index: info.index - 1 });
            await ThesisService.updateNode(prevNode.id, { order_index: info.index });

            toast.success("تم تحريك العنصر لأعلى ⬆️");
            loadStructure();
        } catch (e) {
            toast.error("فشل النقل");
        }
    };

    // نقل عنصر لأسفل
    const handleMoveDown = async (nodeId: string) => {
        try {
            const findNodeInfo = (nodes: ThesisNode[], parentId: string | null): { node: ThesisNode | null, index: number, siblings: ThesisNode[] } | null => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === nodeId) {
                        return { node: nodes[i], index: i, siblings: nodes };
                    }
                    if (nodes[i].children) {
                        const result = findNodeInfo(nodes[i].children!, nodes[i].id);
                        if (result) return result;
                    }
                }
                return null;
            };

            const info = findNodeInfo(structure, null);
            if (!info || info.index >= info.siblings.length - 1) {
                toast.info("العنصر في أسفل القائمة بالفعل");
                return;
            }

            // Swap with next node
            const nextNode = info.siblings[info.index + 1];
            await ThesisService.updateNode(info.node!.id, { order_index: info.index + 1 });
            await ThesisService.updateNode(nextNode.id, { order_index: info.index });

            toast.success("تم تحريك العنصر لأسفل ⬇️");
            loadStructure();
        } catch (e) {
            toast.error("فشل النقل");
        }
    };

    // دمج عنصرين متجاورين
    const handleMergeNodes = async (nodeId: string) => {
        // العثور على العنصر والعنصر التالي له
        const findNodeAndNext = (nodes: ThesisNode[], parentId: string | null): { node: ThesisNode | null, next: ThesisNode | null, parent: ThesisNode[] } => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === nodeId) {
                    return {
                        node: nodes[i],
                        next: i < nodes.length - 1 ? nodes[i + 1] : null,
                        parent: nodes
                    };
                }
                if (nodes[i].children) {
                    const result = findNodeAndNext(nodes[i].children!, nodes[i].id);
                    if (result.node) return result;
                }
            }
            return { node: null, next: null, parent: [] };
        };

        const { node, next } = findNodeAndNext(structure, null);

        if (!node || !next) {
            toast.error("لا يوجد عنصر تالٍ للدمج معه");
            return;
        }

        if (node.type !== next.type) {
            toast.error("لا يمكن دمج عناصر من أنواع مختلفة");
            return;
        }

        if (!confirm(`هل تريد دمج "${node.title}" مع "${next.title}"؟\nسيتم نقل محتويات العنصر الثاني إلى الأول ثم حذفه.`)) {
            return;
        }

        try {
            // نقل أبناء العنصر الثاني إلى الأول
            if (next.children) {
                for (const child of next.children) {
                    await ThesisService.updateNode(child.id, { parent_id: node.id });
                }
            }

            // تحديث عنوان العنصر الأول ليشمل الثاني
            await ThesisService.updateNode(node.id, {
                title: `${node.title} + ${next.title}`
            });

            // حذف العنصر الثاني
            await ThesisService.deleteNode(next.id);

            toast.success("تم الدمج بنجاح");
            loadStructure();
        } catch (e) {
            console.error(e);
            toast.error("فشل الدمج");
        }
    };

    // تقسيم عنصر إلى عنصرين
    const handleSplitNode = async (nodeId: string) => {
        const findNode = (nodes: ThesisNode[]): ThesisNode | null => {
            for (const n of nodes) {
                if (n.id === nodeId) return n;
                if (n.children) {
                    const found = findNode(n.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(structure);
        if (!node || !node.children || node.children.length < 2) {
            toast.error("يجب أن يحتوي العنصر على عنصرين فرعيين على الأقل للتقسيم");
            return;
        }

        const halfIndex = Math.floor(node.children.length / 2);
        const newTitle = prompt("أدخل عنوان الجزء الثاني:", `${node.title} (الجزء 2)`);

        if (!newTitle) return;

        try {
            // إنشاء عنصر جديد بنفس النوع
            const newNode = await ThesisService.addNode({
                project_id: projectId!,
                parent_id: node.parent_id,
                title: newTitle,
                type: node.type,
                order_index: (node.order_index || 0) + 1
            });

            // نقل النصف الثاني من الأبناء
            const childrenToMove = node.children.slice(halfIndex);
            for (const child of childrenToMove) {
                await ThesisService.updateNode(child.id, { parent_id: newNode.id });
            }

            toast.success("تم التقسيم بنجاح");
            loadStructure();
        } catch (e) {
            console.error(e);
            toast.error("فشل التقسيم");
        }
    };



    const handleAppointment = (node: ThesisNode) => {
        setEditingNode(node);
        // Safely parse dates if they exist
        const formatDate = (dateStr?: string | Date) => {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toISOString().split('T')[0];
            } catch { return ''; }
        };

        setAppointmentData({
            milestone_date: formatDate(node.milestone_date),
            reminder_date: formatDate(node.reminder_date)
        });
        setIsAppointmentOpen(true);
    };

    const handleSaveAppointment = async () => {
        if (!editingNode) return;
        try {
            await ThesisService.updateNode(editingNode.id, {
                ...editingNode, // Keep other fields
                milestone_date: appointmentData.milestone_date || null, // Send null if empty
                reminder_date: appointmentData.reminder_date || null
            });
            toast.success("تم تحديث الموعد");
            setIsAppointmentOpen(false);
            loadStructure();
        } catch (e) {
            console.error(e);
            toast.error("فشل تحديث الموعد");
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error("الرجاء إدخال العنوان");
            return;
        }

        if (!projectId) {
            toast.error("المشروع غير محدد");
            return;
        }

        try {
            if (editingNode) {
                // Edit existing
                await ThesisService.updateNode(editingNode.id, { title: formData.title });
                toast.success("تم التعديل");
            } else {
                // Add new
                const newNode: Partial<ThesisNode> = {
                    project_id: projectId,
                    parent_id: parentNode?.id || null,
                    title: formData.title,
                    type: formData.type as any,
                    order_index: parentNode?.children?.length || structure.length,
                };

                const savedNode = await ThesisService.addNode(newNode);

                // Generate DOCX
                let docxCreated = false;
                try {
                    const projects = await ThesisService.getProjects();
                    const project = projects.find(p => p.id === projectId);
                    const blob = await DocxGenerator.generateNodeDoc(savedNode, project?.settings);
                    const sanitizedTitle = FileSystemService.sanitizeFolderName(savedNode.title);
                    const filename = `${sanitizedTitle}.docx`;

                    // Try to save to file system if folder is selected
                    if (folderPath && FileSystemService.isSupported()) {
                        const rootHandle = await FileSystemService.getDirectoryHandle();
                        if (rootHandle) {
                            try {
                                toast.info("جاري إنشاء المجلد والملف...");

                                // Build path to parent folder
                                const parentPath = parentNode ? buildNodePath(parentNode) : [];

                                // Create folder for new node - using simple name (no prefix)
                                const folderName = sanitizedTitle;
                                const nodePath = [...parentPath, folderName];

                                // Create folders iteratively
                                let currentHandle = rootHandle;
                                for (const folder of nodePath) {
                                    const cleanFolder = FileSystemService.sanitizeFolderName(folder);
                                    currentHandle = await currentHandle.getDirectoryHandle(cleanFolder, { create: true });
                                }

                                // Save DOCX
                                await FileSystemService.saveDocxFile(blob, nodePath.map(f => FileSystemService.sanitizeFolderName(f)), filename);
                                await ThesisService.updateNode(savedNode.id, { file_path: filename });

                                toast.success(`تم إنشاء المجلد والملف: ${folderName}`);
                                docxCreated = true;
                            } catch (fsError) {
                                console.error("File system error:", fsError);
                                // Fall through to download
                            }
                        }
                    }

                    // Fallback: download DOCX
                    if (!docxCreated) {
                        saveAs(blob, filename);
                        await ThesisService.updateNode(savedNode.id, { file_path: filename });
                        toast.success("تم تحميل الملف");
                    }
                } catch (docError) {
                    console.error("DOCX generation error:", docError);
                    toast.warning("تم إنشاء القسم لكن فشل إنشاء ملف Word");
                }

                toast.success("تمت الإضافة");
            }
            setShowDialog(false);
            setTimeout(loadStructure, 100);
        } catch (e) {
            console.error("Save error:", e);
            toast.error(`فشل الحفظ: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
        }
    };

    // Feature: Master Doc Generation
    const generateMasterDoc = async () => {
        if (structure.length === 0 || !projectId) {
            toast.error("الهيكل فارغ أو المشروع غير محدد");
            return;
        }

        try {
            toast.info("جاري إعداد الملف...");
            const project = (await ThesisService.getProjects()).find(p => p.id === projectId);
            if (!project) throw new Error("Project not found");

            const blob = await DocxGenerator.generateMasterDoc(project, structure);
            saveAs(blob, `${project.name || 'Thesis'}_Master.docx`);
            toast.success("تم تحميل الملف الرئيسي");
        } catch (e) {
            console.error(e);
            toast.error("فشل حفظ الملف");
        }
    };

    // Feature: Colored Tags - Status Change
    const handleStatusChange = async (node: ThesisNode, specificStatus?: ThesisNode['status']) => {
        const statuses: (typeof node.status)[] = ['draft', 'in_progress', 'review', 'completed', 'on_hold'];

        let nextStatus;
        if (specificStatus) {
            nextStatus = specificStatus;
        } else {
            const currentIndex = node.status ? statuses.indexOf(node.status) : -1;
            nextStatus = statuses[(currentIndex + 1) % statuses.length];
        }

        try {
            await ThesisService.updateNode(node.id, { status: nextStatus });
            toast.success(`تم تغيير الحالة إلى: ${NODE_STATUS_CONFIG[nextStatus!].label}`);
            await loadStructure();
        } catch (e) {
            console.error(e);
            toast.error("فشل تغيير الحالة");
        }
    };

    // Feature: Move/Reorder Nodes
    const handleMoveNode = async (nodeId: string, direction: 'up' | 'down' | 'out' | 'into', targetId?: string) => {
        try {
            const findNode = (nodes: ThesisNode[], id: string): { node: ThesisNode, parent: ThesisNode | null, siblings: ThesisNode[], index: number } | null => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) {
                        return { node: nodes[i], parent: null, siblings: nodes, index: i };
                    }
                    if (nodes[i].children) {
                        const result = findNodeWithParent(nodes[i].children!, id, nodes[i]);
                        if (result) return result;
                    }
                }
                return null;
            };

            const findNodeWithParent = (nodes: ThesisNode[], id: string, parent: ThesisNode): { node: ThesisNode, parent: ThesisNode, siblings: ThesisNode[], index: number } | null => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) {
                        return { node: nodes[i], parent, siblings: nodes, index: i };
                    }
                    if (nodes[i].children) {
                        const result = findNodeWithParent(nodes[i].children!, id, nodes[i]);
                        if (result) return result;
                    }
                }
                return null;
            };

            const nodeInfo = findNode(structure, nodeId);
            if (!nodeInfo) return;

            const { node, siblings, index } = nodeInfo;

            if (direction === 'up' && index > 0) {
                // Swap with previous
                await ThesisService.updateNode(node.id, { order_index: index - 1 });
                await ThesisService.updateNode(siblings[index - 1].id, { order_index: index });
                toast.success("تم تحريك العنصر لأعلى");
            } else if (direction === 'down' && index < siblings.length - 1) {
                // Swap with next
                await ThesisService.updateNode(node.id, { order_index: index + 1 });
                await ThesisService.updateNode(siblings[index + 1].id, { order_index: index });
                toast.success("تم تحريك العنصر لأسفل");
            } else if (direction === 'into' && targetId) {
                // Move to another parent
                await ThesisService.updateNode(node.id, { parent_id: targetId, order_index: 0 });
                toast.success("تم نقل العنصر");
            }

            await loadStructure();
        } catch (e) {
            console.error(e);
            toast.error("فشل تحريك العنصر");
        }
    };

    // Feature: Import Plan
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importText, setImportText] = useState("");

    const handleImportPlan = async () => {
        if (!importText.trim() || !projectId) {
            toast.error("الرجاء إدخال نص الخطة");
            return;
        }

        try {
            setLoading(true);
            toast.info("جاري استيراد الخطة...");

            const lines = importText.split('\n').filter(l => l.trim());
            const imported: ThesisNode[] = [];

            // Track current parent for each level
            let currentChapter: ThesisNode | null = null;
            let currentSection: ThesisNode | null = null;
            let currentSubsection: ThesisNode | null = null;
            let currentBranch: ThesisNode | null = null;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let type: ThesisNode['type'] = 'chapter';
                let parentId: string | null = null;
                let orderIndex = 0;

                // Determine type and parent based on keywords
                if (trimmed.includes('فصل') || trimmed.includes('الفصل')) {
                    type = 'chapter';
                    parentId = null;
                    orderIndex = imported.filter(n => n.type === 'chapter').length;
                } else if (trimmed.includes('مبحث') || trimmed.includes('المبحث')) {
                    type = 'section';
                    parentId = currentChapter?.id || null;
                    orderIndex = currentChapter?.children?.length || 0;
                } else if (trimmed.includes('مطلب') || trimmed.includes('المطلب')) {
                    type = 'subsection';
                    parentId = currentSection?.id || null;
                    orderIndex = currentSection?.children?.length || 0;
                } else if (trimmed.includes('فرع') || trimmed.includes('الفرع')) {
                    type = 'branch';
                    parentId = currentSubsection?.id || null;
                    orderIndex = currentSubsection?.children?.length || 0;
                } else if (trimmed.includes('مسألة') || trimmed.includes('المسألة')) {
                    type = 'issue';
                    parentId = currentBranch?.id || null;
                    orderIndex = currentBranch?.children?.length || 0;
                }

                const node = await ThesisService.addNode({
                    project_id: projectId,
                    parent_id: parentId,
                    title: trimmed,
                    type,
                    order_index: orderIndex
                });

                imported.push(node);

                // Update current parent trackers
                if (type === 'chapter') {
                    currentChapter = node;
                    currentSection = null;
                    currentSubsection = null;
                    currentBranch = null;
                } else if (type === 'section') {
                    currentSection = node;
                    currentSubsection = null;
                    currentBranch = null;
                } else if (type === 'subsection') {
                    currentSubsection = node;
                    currentBranch = null;
                } else if (type === 'branch') {
                    currentBranch = node;
                }
            }

            setShowImportDialog(false);
            setImportText("");
            await loadStructure();

            toast.success(`تم استيراد ${imported.length} عنصر`);

            // Auto-create folders and files if folder is selected
            if (folderPath && FileSystemService.isSupported() && imported.length > 0) {
                const shouldCreate = confirm(
                    `تم استيراد ${imported.length} عنصر.\n\nهل تريد إنشاء المجلدات والملفات تلقائياً في المجلد المحدد؟`
                );

                if (shouldCreate) {
                    try {
                        toast.info("جاري إنشاء المجلدات والملفات للخطة المستوردة...");

                        const projects = await ThesisService.getProjects();
                        const project = projects.find(p => p.id === projectId);

                        // Reload structure to get the imported nodes with proper hierarchy
                        const freshStructure = await ThesisService.getStructure(projectId);

                        // Create folders
                        await FileSystemService.createStructure(freshStructure, undefined, '', project?.settings);

                        // Create DOCX files for all imported nodes
                        const createAllDocx = async (nodes: ThesisNode[], pathPrefix: string[] = []) => {
                            for (let i = 0; i < nodes.length; i++) {
                                const node = nodes[i];
                                const sanitizedTitle = FileSystemService.sanitizeFolderName(node.title);
                                const folderName = `${String(i + 1).padStart(2, '0')}_${sanitizedTitle}`;
                                const currentPath = [...pathPrefix, folderName];

                                const blob = await DocxGenerator.generateNodeDoc(node, project?.settings);
                                const filename = `${sanitizedTitle}.docx`;
                                await FileSystemService.saveDocxFile(blob, currentPath, filename);

                                if (node.children && node.children.length > 0) {
                                    await createAllDocx(node.children, currentPath);
                                }
                            }
                        };

                        await createAllDocx(freshStructure);

                        toast.success("تم إنشاء جميع المجلدات والملفات للخطة المستوردة ✓");
                    } catch (error) {
                        console.error("Failed to create structure for imported plan:", error);
                        toast.error(`فشل إنشاء المجلدات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            toast.error(`فشل الاستيراد: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFolder = useCallback(async (node: ThesisNode) => {
        // Prioritize opening in native shell if supported
        if (folderPath && FileSystemService.isSupported()) {
            const pathSegments = buildNodePath(node);
            const path = pathSegments.join('/');

            // Let's rely on opening the FOLDER primarily as requested
            // Construct absolute path assuming folderPath is absolute (common in Electron w/ fs access)
            // or relative if web (but web doesn't support openInShell usually)
            const targetPath = `${folderPath}/${path}`;

            console.log("Opening path in shell:", targetPath);
            const opened = await FileSystemService.openInShell(targetPath);
            if (opened) return;
        }

        // Fallback to dialog if shell open fails or not supported
        setSelectedFolderNode(node);
    }, [folderPath, nodeFileStatus]);

    if (!projectId) return <div className="p-8 text-center bg-background min-h-screen">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
                                <Home className="w-4 h-4" /> الرئيسية
                            </Button>
                            <Button variant="ghost" className="gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                                <ArrowLeft className="w-4 h-4" /> العودة للمشروع
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold">هيكل الرسالة</h1>
                        <p className="text-muted-foreground">إدارة الفصول والمباحث والمطالب والمسائل</p>
                    </div>
                    <div className="flex gap-2">
                        {FileSystemService.isSupported() && (
                            <>
                                {/* Select Folder Button */}
                                <Button variant="outline" onClick={async () => {
                                    try {
                                        const handle = await FileSystemService.getDirectoryHandle();
                                        if (handle) {
                                            setFolderPath(handle.name);
                                            toast.success(`تم اختيار المجلد: ${handle.name}`);
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }} title="اختيار مجلد المشروع">
                                    <FolderOpen className="w-4 h-4 ml-2" />
                                    {folderPath ? folderPath : "اختيار مجلد"}
                                </Button>
                                {folderPath && (
                                    <>
                                        <Button variant="outline" onClick={handleCreateStructure} title="إنشاء هيكل المجلدات">
                                            <Folder className="w-4 h-4 ml-2" />
                                            إنشاء الهيكل
                                        </Button>
                                        <Button variant="outline" onClick={handleSyncFromFileSystem} disabled={isSyncing} title="مزامنة التعديلات اليدوية">
                                            <RefreshCw className={`w-4 h-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                            مزامنة
                                        </Button>
                                        <Button
                                            onClick={async () => {
                                                setIsSyncing(true);
                                                try {
                                                    const projects = await ThesisService.getProjects();
                                                    const project = projects.find(p => p.id === projectId);

                                                    toast.info("جاري فحص وتوليد الملفات الناقصة...");
                                                    await FileSystemService.createStructure(structure, undefined, '', project?.settings, true);

                                                    toast.success("تم توليد الملفات بنجاح");
                                                    checkFilesExistence(structure);
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error("فشل توليد الملفات");
                                                } finally {
                                                    setIsSyncing(false);
                                                }
                                            }}
                                            variant="outline"
                                            className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                            title="إنشاء ملفات وورد لكل العناصر التي لا تملك ملفات"
                                        >
                                            <FileDown className="w-4 h-4 ml-2" />
                                            توليد الملفات
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                            <FileText className="w-4 h-4 ml-2" />
                            استيراد خطة
                        </Button>
                        <Button variant="outline" onClick={generateMasterDoc}>
                            <BookOpen className="w-4 h-4 ml-2" />
                            الملف الرئيسي
                        </Button>
                        <Button onClick={() => handleAdd(null)} className="bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة فصل
                        </Button>
                    </div>
                </div>

                {/* Import Dialog */}
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>استيراد خطة البحث</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                الصق خطة البحث هنا. كل سطر سيعتبر عنصراً جديداً.
                                <br />- السطور التي تبدأ بـ (-) تعتبر مباحث.
                                <br />- السطور التي تبدأ بـ (--) تعتبر مطالب.
                                <br />- السطور العادية تعتبر فصولاً.
                            </p>
                            <Textarea
                                className="w-full h-64 p-3 border rounded-md"
                                placeholder={"الفصل الأول: ...\n- مبحث 1\n-- مطلب أ\nالفصل الثاني..."}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowImportDialog(false)}>إلغاء</Button>
                            <Button onClick={handleImportPlan}>استيراد</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10">جاري التحميل...</div>
                    ) : structure.length > 0 ? (
                        structure.map(node => (
                            <ThesisNodeItem
                                key={node.id}
                                node={node}
                                level={0}
                                expandedIds={expanded}
                                fileStatusMap={nodeFileStatus}
                                folderPath={folderPath}
                                onToggleExpand={toggleExpand}
                                onStatusChange={handleStatusChange}
                                onAdd={handleAdd}
                                onEdit={handleEdit}
                                onAppointment={handleAppointment}
                                onMerge={handleMergeNodes}
                                onSplit={handleSplitNode}
                                onDelete={handleDelete}
                                onOpenFolder={handleOpenFolder}
                            />
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-medium text-gray-900">الهيكل فارغ</h3>
                            <p className="text-gray-500 mb-6">ابدأ بإنشاء الهيكل التنظيمي لرسالتك</p>
                            <Button onClick={() => handleAdd(null)}>إضافة الفصل الأول</Button>
                        </div>
                    )}
                </div>

                {/* Add/Edit Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingNode ? 'تعديل العنوان' : 'إضافة قسم جديد'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>النوع</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                    disabled={!!parentNode} // Auto-determined if adding child
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chapter">فصل</SelectItem>
                                        <SelectItem value="section">مبحث</SelectItem>
                                        <SelectItem value="subsection">مطلب</SelectItem>
                                        <SelectItem value="branch">فرع</SelectItem>
                                        <SelectItem value="issue">مسألة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>العنوان</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="مثال: الفصل الأول: الإطار النظري"
                                    className="text-right"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
                            <Button onClick={handleSave}>حفظ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Appointment Dialog */}
                <Dialog open={isAppointmentOpen} onOpenChange={setIsAppointmentOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تعيين موعد / مجازة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>تاريخ المجازة (Milestone)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={appointmentData.milestone_date}
                                        onChange={(e) => setAppointmentData(prev => ({ ...prev, milestone_date: e.target.value }))}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="time"
                                        className="w-32"
                                    // Keeping it simple for now or adding time to state if needed
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>تاريخ التذكير</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={appointmentData.reminder_date}
                                        onChange={(e) => setAppointmentData(prev => ({ ...prev, reminder_date: e.target.value }))}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="time"
                                        className="w-32"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAppointmentOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSaveAppointment}>حفظ الموعد</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Folder Manager Dialog */}
            <FolderManagerDialog
                open={selectedFolderNode !== null}
                onClose={() => setSelectedFolderNode(null)}
                node={selectedFolderNode}
                projectId={projectId || ''}
                onRefresh={loadStructure}
                folderPath={folderPath || undefined}
                initialNodePath={selectedFolderNode ? buildNodePath(selectedFolderNode) : []}
            />
        </div>
    );
}
