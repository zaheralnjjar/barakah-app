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
    { name: 'أخضر', value: '#4ade80' },
    { name: 'أزرق', value: '#3b82f6' },
    { name: 'أصفر', value: '#eab308' },
    { name: 'برتقالي', value: '#f97316' },
    { name: 'أحمر', value: '#ef4444' },
    { name: 'بنفسجي', value: '#8b5cf6' },
    { name: 'وردي', value: '#ec4899' },
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📂 المجلدات</h2>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    مجلد جديد
                </Button>
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
                                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => openEditDialog(folder)}
                                    className="gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDeleteFolder(folder.id)}
                                    className="gap-2 text-red-600"
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
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:border-primary hover:bg-primary/5 active:scale-95"
                >
                    <Plus className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-500">مجلد جديد</span>
                </button>
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إنشاء مجلد جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">اسم المجلد</label>
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="مثال: العمل، الدراسة، شخصي..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">اللون</label>
                            <div className="grid grid-cols-4 gap-2">
                                {FOLDER_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`h-12 rounded-lg transition-all ${selectedColor === color.value
                                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                                : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleCreateFolder}>
                            إنشاء
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Folder Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل المجلد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">اسم المجلد</label>
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditFolder()}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">اللون</label>
                            <div className="grid grid-cols-4 gap-2">
                                {FOLDER_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`h-12 rounded-lg transition-all ${selectedColor === color.value
                                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                                : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleEditFolder}>
                            حفظ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
