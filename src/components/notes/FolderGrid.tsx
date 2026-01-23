import React, { useState } from 'react';
import { Folder, Plus, Edit2, Trash2, FileText, Search, X } from 'lucide-react';
import { NoteFolder } from '@/hooks/useNoteFolders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface FolderGridProps {
    folders: NoteFolder[];
    notes: any[];
    onFolderClick: (folderId: string) => void;
    onNoteClick: (noteId: string) => void;
    onMoveNote?: (noteId: string, targetFolderId: string) => void;
    onCreateFolder: (name: string, color: string, icon: string) => void;
    onUpdateFolder: (id: string, updates: Partial<NoteFolder>) => void;
    onDeleteFolder: (id: string) => void;
    searchQuery?: string;
    onSearch?: (query: string) => void;
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
    notes = [],
    onFolderClick,
    onNoteClick,
    onMoveNote,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder,
    searchQuery = '',
    onSearch,
}) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null);
    const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);

    // General folder Definition (Fixed)
    const generalFolder: NoteFolder = {
        id: 'general',
        name: 'عام (كل الملاحظات)',
        color: '#64748b',
        icon: 'folder',
        user_id: 'system',
        created_at: new Date().toISOString(),
        // Add updated_at and order_index to satisfy interface if needed, relying on loose typing or optional props
    } as any;

    // Split other folders into two rows alternating
    const row1Folders = folders.filter((_, index) => index % 2 === 0);
    const row2Folders = folders.filter((_, index) => index % 2 !== 0);

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

    const openCreateDialog = () => {
        setNewFolderName('');
        setSelectedColor(FOLDER_COLORS[0].value);
        setShowCreateDialog(true);
    };

    const openDeleteConfirm = (folder: NoteFolder) => {
        setFolderToDelete(folder);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (folderToDelete) {
            onDeleteFolder(folderToDelete.id);
            setShowDeleteConfirm(false);
            setFolderToDelete(null);
        }
    };

    const FolderColumn = ({ folder, isFullHeight = false }: { folder: NoteFolder, isFullHeight?: boolean }) => {
        const isGeneral = folder.id === 'general';

        // Filter notes for this folder
        // If General, show all notes. If other folder, filter by folderId
        const folderNotes = isGeneral
            ? notes
            : notes.filter(n => (n.folderId === folder.id) || (n.folder_id === folder.id));

        const handleDragStart = (e: React.DragEvent, noteId: string) => {
            e.dataTransfer.setData('text/plain', noteId);
            e.dataTransfer.effectAllowed = 'move';
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('bg-blue-50/50');
        };

        const handleDragLeave = (e: React.DragEvent) => {
            e.currentTarget.classList.remove('bg-blue-50/50');
        };

        const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
            e.preventDefault();
            e.stopPropagation(); // Stop bubbling
            e.currentTarget.classList.remove('bg-blue-50/50');
            const noteId = e.dataTransfer.getData('text/plain');

            if (noteId && onMoveNote) {
                console.log(`Dropping note ${noteId} into folder ${targetFolderId}`);
                onMoveNote(noteId, targetFolderId);
            }
        };

        return (
            <div
                className={`flex-shrink-0 flex flex-col rounded-xl border-2 transition-all hover:shadow-md 
                    ${isFullHeight ? 'w-full h-full border-r-0 rounded-r-none rounded-l-none' : 'w-80 h-full'}`}
                style={{
                    backgroundColor: `${folder.color}08`,
                    borderColor: `${folder.color}20`
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
            >
                {/* Folder Header */}
                <div
                    className="p-3 border-b flex items-center justify-between pointer-events-auto min-h-[60px]"
                    style={{ borderColor: `${folder.color}20`, backgroundColor: `${folder.color}10` }}
                >
                    {isGeneral ? (
                        <div className="flex-1 flex gap-2 items-center w-full">
                            <div className="relative flex-1">
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => onSearch?.(e.target.value)}
                                    placeholder="بحث عام..."
                                    className="pr-8 h-9 text-right bg-white/80 border-gray-200 focus:border-blue-500 rounded-lg text-sm w-full"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => onSearch?.('')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full"
                                    >
                                        <X className="w-3 h-3 text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full font-medium shrink-0">
                                {folderNotes.length}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div
                                className="flex items-center gap-2 cursor-pointer flex-1"
                                onClick={() => onFolderClick(folder.id)}
                            >
                                <Folder className="w-5 h-5" style={{ color: folder.color }} fill={`${folder.color}40`} />
                                <span className="font-bold text-gray-800 line-clamp-1 text-sm">{folder.name}</span>
                                <span className="text-xs text-gray-500 bg-white/50 px-1.5 py-0.5 rounded-full">
                                    {folderNotes.length}
                                </span>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(folder); }}
                                    className="p-1 hover:bg-black/5 rounded transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openDeleteConfirm(folder); }}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {folderNotes.length > 0 ? (
                        folderNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => onNoteClick(note.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, note.id)}
                                className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group active:cursor-grabbing cursor-grab"
                            >
                                <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-blue-600">
                                    {note.title || 'بدون عنوان'}
                                </h4>
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        <span>نص</span>
                                    </div>
                                    <span>
                                        {new Date(note.updated_at).toLocaleDateString('ar-SA')}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-60">
                            <FileText className="w-8 h-8" />
                            <span className="text-xs">لا توجد ملاحظات</span>
                        </div>
                    )}
                </div>

                {/* Quick Add Button */}
                <button
                    onClick={() => {
                        onFolderClick(folder.id);
                    }}
                    className="m-2 p-2 rounded-lg border border-dashed border-gray-300 text-gray-500 text-xs flex items-center justify-center gap-1 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all bg-white/50"
                >
                    <Plus className="w-3 h-3" />
                    ملاحظة جديدة
                </button>
            </div>
        );
    };

    return (
        <div className="h-full flex text-right" dir="rtl">
            {/* 1. General Folder Sidebar (20% Width) */}
            <div className="w-[20%] h-full border-l border-gray-200 bg-gray-50/50">
                <FolderColumn folder={generalFolder} isFullHeight={true} />
            </div>

            {/* 2. Main Area (80% Width) - Contains Rows */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Row - Horizontal Scrolling */}
                <div className="flex-1 border-b border-gray-200 overflow-x-auto overflow-y-hidden">
                    <div className="flex h-full p-4 gap-4 min-w-max">
                        {/* New Folder Button */}
                        <button
                            onClick={openCreateDialog}
                            className="flex-shrink-0 w-80 h-full rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                            </div>
                            <span className="font-medium text-gray-500 group-hover:text-blue-600">إنشاء مجلد جديد</span>
                        </button>

                        {row1Folders.map(folder => (
                            <FolderColumn key={folder.id} folder={folder} />
                        ))}
                    </div>
                </div>

                {/* Bottom Row - Horizontal Scrolling */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex h-full p-4 gap-4 min-w-max">
                        {row2Folders.map(folder => (
                            <FolderColumn key={folder.id} folder={folder} />
                        ))}

                        {/* If we have no folders in row 2, show placeholder or nothing */}
                        {row2Folders.length === 0 && row1Folders.length > 0 && (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 opacity-50">
                                <span className="text-sm">اسحب لإضافة المزيد من المجلدات</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">إنشاء مجلد جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="اسم المجلد"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="text-right"
                        />
                        <div className="flex gap-2 justify-end">
                            {FOLDER_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setSelectedColor(color.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-gray-800 scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-start">
                        <Button onClick={handleCreateFolder}>إنشاء</Button>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Folder Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">تعديل المجلد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="اسم المجلد"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="text-right"
                        />
                        <div className="flex gap-2 justify-end">
                            {FOLDER_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setSelectedColor(color.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-gray-800 scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-start">
                        <Button onClick={handleEditFolder}>حفظ التغييرات</Button>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">حذف المجلد</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-right">
                        <p className="text-gray-600">هل أنت متأكد من حذف هذا المجلد؟</p>
                        <p className="text-sm text-red-500 mt-2">سيتم حذف جميع الملاحظات الموجودة بداخله.</p>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-start">
                        <Button variant="destructive" onClick={confirmDelete}>حذف</Button>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
