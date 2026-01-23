import React, { useState } from 'react';
import { Search, ArrowLeft, Download, Lock, Unlock, X } from 'lucide-react';
import { useNoteFolders } from '@/hooks/useNoteFolders';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useNoteRevisions } from '@/hooks/useNoteRevisions';
import { FolderGrid } from './FolderGrid';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { RevisionTimeline } from './RevisionTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'folders' | 'notes' | 'editor' | 'revisions';

interface NotesManagerProps {
    onClose?: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ onClose }) => {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<ViewMode>('folders');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLockDialog, setShowLockDialog] = useState(false);
    const [lockPin, setLockPin] = useState('');

    const { folders, createFolder, updateFolder, deleteFolder } = useNoteFolders();
    const {
        notesHistory,
        addNote,
        updateNoteById,
        searchNotes,
        lockNote,
        unlockNote,
        addTag,
        removeTag,
        exportNoteToTXT,
        exportNoteToPDF,
    } = useQuickNotes();
    const { revisions, createRevision, restoreRevision } = useNoteRevisions(selectedNoteId || undefined);

    const currentFolder = folders.find(f => f.id === selectedFolderId);
    const folderNotes = selectedFolderId
        ? notesHistory.filter(n => n.folderId === selectedFolderId)
        : notesHistory;
    const selectedNote = notesHistory.find(n => n.id === selectedNoteId);

    const handleFolderClick = (folderId: string) => {
        setSelectedFolderId(folderId);
        setViewMode('notes');
    };

    const handleNoteClick = async (noteId: string) => {
        const note = notesHistory.find(n => n.id === noteId);
        if (!note) return;

        if (note.isSecure) {
            setSelectedNoteId(noteId);
            setShowLockDialog(true);
        } else {
            setSelectedNoteId(noteId);
            setViewMode('editor');
        }
    };

    const handleUnlock = async () => {
        if (!selectedNoteId) return;
        const success = await unlockNote(selectedNoteId, lockPin);
        if (success) {
            setShowLockDialog(false);
            setLockPin('');
            setViewMode('editor');
        }
    };

    const handleSaveNote = async (title: string, content: string, tags: string[]) => {
        if (selectedNoteId) {
            // Update existing note
            await updateNoteById(selectedNoteId, { title, content, tags });

            // Create revision
            await createRevision(
                selectedNoteId,
                title || 'تعديل',
                content,
                'تم التحديث'
            );
        } else {
            // Create new note with folderId
            await addNote(content, 'quick', title, false, selectedFolderId || undefined);
        }
        setViewMode('notes');
        setSelectedNoteId(null);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // Smart search: only search after 3 characters
        if (query.length >= 3) {
            searchNotes(query);
        } else if (query.length === 0) {
            searchNotes(''); // Clear search
        }
    };

    const handleMoveNote = async (noteId: string, targetFolderId: string) => {
        if (targetFolderId === 'general') {
            // If moved to General, remove folder association (make it general only)
            // Or just do nothing as it is already visible in General. 
            // Let's remove specific folder ID to make it 'General' only.
            await updateNoteById(noteId, { folderId: undefined });
            toast({ title: 'تم نقل الملاحظة إلى العام ✅' });
        } else {
            await updateNoteById(noteId, { folderId: targetFolderId });
            toast({ title: 'تم نقل الملاحظة ✅' });
        }
    };

    const handleBack = () => {
        if (viewMode === 'revisions') {
            setViewMode('editor');
        } else if (viewMode === 'editor') {
            setViewMode('notes');
            setSelectedNoteId(null);
        } else if (viewMode === 'notes') {
            setViewMode('folders');
            setSelectedFolderId(null);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    {viewMode !== 'folders' && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            رجوع
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-gray-800 flex-1">
                        {viewMode === 'folders' && '📝 الملاحظات'}
                        {viewMode === 'notes' && `📂 ${currentFolder?.name || 'الملاحظات'}`}
                        {viewMode === 'editor' && (selectedNote?.title || 'ملاحظة جديدة')}
                        {viewMode === 'revisions' && 'سجل التعديلات'}
                    </h1>
                    {/* Search - shown in folders and notes view */}
                    {(viewMode === 'folders' || viewMode === 'notes') && (
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="بحث..."
                                className="pr-10 w-48 h-9 text-sm"
                            />
                        </div>
                    )}
                    {/* New Note button - shown in notes view */}
                    {viewMode === 'notes' && (
                        <button
                            onClick={() => {
                                setSelectedNoteId(null);
                                setViewMode('editor');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm transition-all"
                        >
                            ملاحظة جديدة
                        </button>
                    )}
                    {/* Close button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-sm transition-all"
                        >
                            <X className="w-4 h-4" />
                            إغلاق
                        </button>
                    )}
                    {viewMode === 'editor' && selectedNoteId && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewMode('revisions')}
                            >
                                سجل التعديلات ({revisions.length})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportNoteToTXT(selectedNoteId)}
                            >
                                <Download className="w-4 h-4 ml-1" />
                                TXT
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportNoteToPDF(selectedNoteId)}
                            >
                                <Download className="w-4 h-4 ml-1" />
                                PDF
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'folders' && (
                    <FolderGrid
                        folders={folders}
                        notes={notesHistory}
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                        onFolderClick={handleFolderClick}
                        onNoteClick={handleNoteClick}
                        onMoveNote={handleMoveNote}
                        onCreateFolder={createFolder}
                        onUpdateFolder={updateFolder}
                        onDeleteFolder={deleteFolder}
                    />
                )}

                {viewMode === 'notes' && (
                    <div className="p-6 h-full overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folderNotes.map(note => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onClick={() => handleNoteClick(note.id)}
                                    revisionsCount={note.id === selectedNoteId ? revisions.length : 0}
                                />
                            ))}
                        </div>
                        {folderNotes.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>لا توجد ملاحظات في هذا المجلد</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'editor' && (
                    <NoteEditor
                        initialTitle={selectedNote?.title}
                        initialContent={selectedNote?.content}
                        initialTags={selectedNote?.tags}
                        onSave={handleSaveNote}
                        onCancel={handleBack}
                    />
                )}

                {viewMode === 'revisions' && (
                    <RevisionTimeline
                        revisions={revisions}
                        onRestore={async (revisionId) => {
                            await restoreRevision(revisionId);
                            setViewMode('editor');
                        }}
                    />
                )}
            </div>

            {/* Lock Dialog */}
            <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
                <DialogContent>
                    <div className="text-center py-6">
                        <Lock className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-lg font-semibold mb-2">ملاحظة مقفلة</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            أدخل الرقم السري لفتح الملاحظة
                        </p>
                        <Input
                            type="password"
                            value={lockPin}
                            onChange={(e) => setLockPin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            placeholder="الرقم السري"
                            className="mb-4"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowLockDialog(false);
                                    setLockPin('');
                                    setSelectedNoteId(null);
                                }}
                            >
                                إلغاء
                            </Button>
                            <Button className="flex-1" onClick={handleUnlock}>
                                <Unlock className="w-4 h-4 ml-1" />
                                فتح
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
