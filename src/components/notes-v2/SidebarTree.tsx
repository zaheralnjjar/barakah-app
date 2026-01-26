import React from 'react';
import { useFolders } from '@/hooks/useFolders';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Hash, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2 as TrashIcon } from "lucide-react";
import { EditFolderDialog } from "./EditFolderDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarTreeProps {
    activeFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    onSearch?: (query: string) => void;
    collapsed?: boolean;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ activeFolderId, onSelectFolder, onSearch, collapsed }) => {
    const { folders, deleteFolder } = useFolders();
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
    const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);

    const editingFolder = React.useMemo(() =>
        folders.find(f => f.id === editingFolderId) || null
        , [folders, editingFolderId]);

    const [folderToDelete, setFolderToDelete] = React.useState<{ id: string, name: string } | null>(null);

    const handleDeleteFolder = (folderId: string, folderName: string) => {
        setFolderToDelete({ id: folderId, name: folderName });
    };

    const confirmDeleteFolder = async (folderId: string) => {
        // Find all descendants recursively
        const getAllDescendants = (parentId: string): string[] => {
            const children = folders.filter(f => f.parent_id === parentId);
            let ids = children.map(c => c.id);
            children.forEach(child => {
                ids = [...ids, ...getAllDescendants(child.id)];
            });
            return ids;
        };

        const idsToDelete = [folderId, ...getAllDescendants(folderId)];

        try {
            await Promise.all(idsToDelete.map(id => deleteFolder(id)));
            setFolderToDelete(null);
        } catch (error) {
            console.error("Error deleting folders:", error);
        }
    };

    const toggleFolder = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        const next = new Set(expandedFolders);
        if (next.has(folderId)) {
            next.delete(folderId);
        } else {
            next.add(folderId);
        }
        setExpandedFolders(next);
    };

    // Recursive render function
    const renderFolder = (folder: any, depth = 0) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isActive = activeFolderId === folder.id;

        // Find children
        const children = folders.filter(f => f.parent_id === folder.id);
        const hasChildren = children.length > 0;

        return (
            <div key={folder.id} className="select-none">
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div
                            onClick={() => onSelectFolder(folder.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm mb-0.5
                                ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}
                                ${collapsed ? 'justify-center px-1' : ''}
                            `}
                            style={!collapsed ? { paddingRight: `${depth * 12 + 12}px` } : {}} // RTL Padding only when not collapsed
                        >
                            {/* Expand Toggle */}
                            {!collapsed && (
                                <button
                                    onClick={(e) => toggleFolder(e, folder.id)}
                                    className={`p-0.5 rounded-md hover:bg-gray-200 transition-colors ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 rtl:rotate-180" />}
                                </button>
                            )}

                            {/* Icon */}
                            {isExpanded ?
                                <FolderOpen className="w-4 h-4" style={{ color: folder.color || '#818cf8' }} /> :
                                <Folder className="w-4 h-4" style={{ color: folder.color || '#9ca3af' }} />
                            }

                            {!collapsed && <span className="truncate">{folder.name}</span>}
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 text-right" dir="rtl">
                        <ContextMenuItem onClick={() => setEditingFolderId(folder.id)} className="flex items-center gap-2 cursor-pointer">
                            <Edit className="w-4 h-4" />
                            <span>تعديل المجلد</span>
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => handleDeleteFolder(folder.id, folder.name)}
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>حذف المجلد</span>
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>

                {isExpanded && hasChildren && !collapsed && (
                    <div>
                        {children.map(child => renderFolder(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Root folders (parent_id is null)
    const rootFolders = folders.filter(f => !f.parent_id);

    return (
        <div className={`flex flex-col h-full bg-gray-50/50 border-l border-gray-100 p-2 ${collapsed ? 'w-16 items-center' : 'w-64'}`}>

            {/* Search Bar - Global Search logic */}
            {!collapsed && (
                <div className="mb-4 px-1 mt-2">
                    <div className="relative">
                        <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder="بحث..."
                            className="w-full pr-8 h-9 text-sm bg-white/50 border-gray-200 focus:bg-white transition-colors"
                            onChange={(e) => onSearch?.(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {!collapsed && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">التنظيم</h3>}

            <div
                onClick={() => onSelectFolder(null)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm mb-1 font-medium w-full
                    ${activeFolderId === null ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
                    ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? "كل الملاحظات" : undefined}
            >
                <Hash className="w-4 h-4" />
                {!collapsed && <span>كل الملاحظات</span>}
            </div>

            <div className="mb-4" />

            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                {rootFolders.map(folder => renderFolder(folder))}

                {!collapsed && rootFolders.length === 0 && (
                    <p className="text-xs text-center text-gray-400 mt-4">لا توجد مجلدات</p>
                )}
            </div>

            <div
                onClick={() => onSelectFolder('trash')}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm mt-2 w-full
                    ${activeFolderId === 'trash' ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}
                    ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? "سلة المحذوفات" : undefined}
            >
                <Trash2 className="w-4 h-4" />
                {!collapsed && <span>سلة المحذوفات</span>}
            </div>

            <EditFolderDialog
                isOpen={!!editingFolderId}
                onClose={() => setEditingFolderId(null)}
                folder={editingFolder}
            />

            <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">حذف المجلد</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هل أنت متأكد من حذف مجلد "{folderToDelete?.name}" وكافة محتوياته؟
                            <br />
                            سيتم نقل المجلد والملاحظات بداخله إلى سلة المحذوفات.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (folderToDelete) {
                                    confirmDeleteFolder(folderToDelete.id);
                                }
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
