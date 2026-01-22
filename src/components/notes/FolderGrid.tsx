import React, { useState } from 'react';
import { Folder, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { NoteFolder } from '@/hooks/useNoteFolders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface FolderGridProps {
    folders: NoteFolder[];
    onFolderClick: (folderId: string) => void;
    onCreateFolder: (name: string, color: string, icon: string) => void;
    onUpdateFolder: (id: string, updates: Partial<NoteFolder>) => void;
    onDeleteFolder: (id: string) => void;
}

const FOLDER_COLORS = [
    { name: 'أخضر', value: '#22c55e' },
    { name: 'أزرق', value: '#3b82f6' },
    { name: 'أحمر', value: '#ef4444' },
    { name: 'برتقالي', value: '#f97316' },
    { name: 'أصفر', value: '#eab308' },
    { name: 'بنفسجي', value: '#8b5cf6' },
    { name: 'وردي', value: '#ec4899' },
    { name: 'سماوي', value: '#06b6d4' },
    { name: 'بني', value: '#a16207' },
    { name: 'رمادي', value: '#6b7280' },
];

export const FolderGrid: React.FC<FolderGridProps> = ({
    folders,
    onFolderClick,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder,
}) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        onCreateFolder(newFolderName, selectedColor, 'folder');
        setNewFolderName('');
        setSelectedColor(FOLDER_COLORS[0].value);
        setShowCreateDialog(false);
    };

    const handleEditFolder = () => {
        if (!editingFolder || !newFolderName.trim()) return;
        onUpdateFolder(editingFolder.id, {
            name: newFolderName,
            color: selectedColor,
        });
        setShowEditDialog(false);
        setEditingFolder(null);
        setNewFolderName('');
    };

    const openEditDialog = (folder: NoteFolder) => {
        setEditingFolder(folder);
        setNewFolderName(folder.name);
        setSelectedColor(folder.color);
        setShowEditDialog(true);
    };

    // Reset dialog state when opening
    const openCreateDialog = () => {
        setNewFolderName('');
        setSelectedColor(FOLDER_COLORS[0].value);
        setShowCreateDialog(true);
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">📂 المجلدات</h2>
                <button
                    onClick={openCreateDialog}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    جديد
                </button>
            </div>

            {/* Folder Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        className="group relative"
                    >
                        {/* Folder Card */}
                        <button
                            onClick={() => onFolderClick(folder.id)}
                            className="w-full aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                            style={{ backgroundColor: folder.color + '20' }}
                        >
                            <Folder
                                className="w-16 h-16"
                                style={{ color: folder.color }}
                                fill={folder.color + '40'}
                            />
                            <span className="font-medium text-gray-800 text-center line-clamp-2">
                                {folder.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {folder.notesCount || 0} ملاحظة
                            </span>
                        </button>

                        {/* Context Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="z-[9999]">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditDialog(folder);
                                    }}
                                    className="gap-2 cursor-pointer"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteFolder(folder.id);
                                    }}
                                    className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                {/* Add New Folder Card */}
                <button
                    onClick={openCreateDialog}
                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:border-green-500 hover:bg-green-50 active:scale-95"
                >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-500">مجلد جديد</span>
                </button>
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="z-[10002] max-w-sm">
                    <DialogHeader>
                        <DialogTitle>إنشاء مجلد جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">اسم المجلد</label>
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="مثال: العمل، الدراسة..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">اللون</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                                        <div
                                            className="w-5 h-5 rounded-full"
                                            style={{ backgroundColor: selectedColor }}
                                        />
                                        <span className="flex-1 text-right text-sm">
                                            {FOLDER_COLORS.find(c => c.value === selectedColor)?.name || 'اختر لون'}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    {FOLDER_COLORS.map((color) => (
                                        <DropdownMenuItem
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            className="gap-2 cursor-pointer"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>
                            إلغاء
                        </Button>
                        <Button size="sm" onClick={handleCreateFolder}>
                            إنشاء
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Folder Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="z-[10002] max-w-sm">
                    <DialogHeader>
                        <DialogTitle>تعديل المجلد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">اسم المجلد</label>
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditFolder()}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">اللون</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                                        <div
                                            className="w-5 h-5 rounded-full"
                                            style={{ backgroundColor: selectedColor }}
                                        />
                                        <span className="flex-1 text-right text-sm">
                                            {FOLDER_COLORS.find(c => c.value === selectedColor)?.name || 'اختر لون'}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    {FOLDER_COLORS.map((color) => (
                                        <DropdownMenuItem
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            className="gap-2 cursor-pointer"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>
                            إلغاء
                        </Button>
                        <Button size="sm" onClick={handleEditFolder}>
                            حفظ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
