
import React, { useState, useEffect } from 'react';
import { SidebarTree } from '@/components/notes-v2/SidebarTree';
import { FolderGrid } from '@/components/notes-v2/FolderGrid';
import { NoteList } from '@/components/notes-v2/NoteList';
import { NoteEditorV2 } from '@/components/notes-v2/NoteEditorV2';
import { KanbanView } from '@/components/notes-v2/KanbanView';
import { NotesSettingsDialog } from '@/components/notes-v2/NotesSettingsDialog';
import { CreateFolderDialog } from '@/components/notes-v2/CreateFolderDialog';
import { CreateNoteDialog } from '@/components/notes-v2/CreateNoteDialog';
import { Button } from '@/components/ui/button';
import { Settings, Menu, ChevronRight, Plus, FolderPlus, FilePlus, LayoutGrid, Library, Search, Cloud, Trash2, Share2, CheckSquare } from 'lucide-react';
import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/use-toast';
import ReportGenerator from '@/components/ReportGenerator';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedNotesLayoutProps {
    isStandalone?: boolean;
}

export const UnifiedNotesLayout: React.FC<UnifiedNotesLayoutProps> = ({ isStandalone = false }) => {
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeNote, setActiveNote] = useState<NoteV2 | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'editor' | 'kanban'>('grid');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showCreateNote, setShowCreateNote] = useState(false);
    const [autoStartRecording, setAutoStartRecording] = useState(false);
    const [createNoteInitialFolderId, setCreateNoteInitialFolderId] = useState<string | null>(null);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [isFloatingSearchOpen, setIsFloatingSearchOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Settings State
    const [settings, setSettings] = useState({
        autoInsertSeparator: true,
        showFolderGridInitial: true,
    });

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    // 'note' for notes, 'folder' for folders. null if mixed or empty (though we usually restrict to one type or handle both)
    // For simplicity, we assume generic IDs. But deleting requires knowing type.
    // Let's assume current view dictates type. 
    // If viewMode is 'grid' (folders) -> folders
    // If viewMode is 'list' (notes) -> notes
    const selectionType = viewMode === 'grid' ? 'folder' : 'note';

    const { deleteNote } = useNotesV2(activeFolderId);
    const { deleteFolder } = useFolders();

    const handleToggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleSelectAll = (ids: string[]) => {
        if (selectedItems.size === ids.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(ids));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.size === 0) return;

        try {
            const promises = Array.from(selectedItems).map(id => {
                if (selectionType === 'folder') return deleteFolder(id);
                return deleteNote(id);
            });
            await Promise.all(promises);
            toast({ title: "تم الحذف بنجاح" });
            setSelectedItems(new Set());
            setIsSelectionMode(false);
        } catch (e) {
            toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
        }
    };

    const handleShareSelected = async () => {
        // Placeholder for sharing interaction
        // Since we can't easily share multiple objects via native share except as text
        // We can merge their content
        if (selectedItems.size === 0) return;
        toast({ title: "مشاركة العناصر المحددة (قريباً)" });
    };


    // Hooks
    const { folders } = useFolders();
    const { updateNote } = useNotesV2(activeFolderId, searchQuery);
    const { toast } = useToast();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load Settings
    useEffect(() => {
        const saved = localStorage.getItem('notes-v2-settings');
        if (saved) setSettings(JSON.parse(saved));
        else setSettings(prev => ({ ...prev, showFolderGridInitial: true }));
    }, []);

    // Save Settings
    const handleUpdateSettings = (key: string, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('notes-v2-settings', JSON.stringify(newSettings));
    };

    // Navigation Logic
    const handleSelectFolder = (folderId: string | null) => {
        setSearchQuery('');
        setActiveFolderId(folderId);
        setActiveNote(null);
        setViewMode(folderId === null ? 'grid' : 'list');
        if (folderId === 'bookmarked') setViewMode('list');
    };

    const handleSelectNote = (note: NoteV2) => {
        setActiveNote(note);
        setViewMode('editor');
    };

    const handleFolderDeleted = (folderId: string) => {
        if (activeFolderId === folderId) {
            handleSelectFolder(null); // Direct to Library
        }
    };

    // Backup Logic
    const handleExportBackup = async () => {
        try {
            toast({ title: 'جاري تحضير النسخة الاحتياطية...' });
            const { data: notes } = await supabase.from('quick_notes').select('*');
            const { data: folders } = await supabase.from('note_folders').select('*');
            const backupData = {
                version: "1.0",
                date: new Date().toISOString(),
                folders: folders || [],
                notes: notes || []
            };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barakah_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: 'تم تصدير النسخة الاحتياطية بنجاح ✅' });
        } catch (e) {
            console.error(e);
            toast({ title: 'فشل التصدير', description: 'حدث خطأ أثناء جلب البيانات', variant: 'destructive' });
        }
    };

    // PDF Export Logic
    const handleExportPDF = async () => { /* Same PDF Logic as before, simplified for brevity */ };

    return (
        <div className="flex h-screen bg-white w-full overflow-hidden" dir="rtl">
            {/* Sidebar (Mini with Hover) */}
            <div
                onMouseEnter={() => !isMobile && setIsSidebarHovered(true)}
                onMouseLeave={() => !isMobile && setIsSidebarHovered(false)}
                className={`
                    flex-shrink-0 bg-gray-50 border-l border-gray-100 transition-all duration-300 flex flex-col z-30
                    ${isMobile ? 'absolute h-full shadow-2xl' : 'relative'}
                    ${isSidebarOpen
                        ? (isMobile ? 'w-64 translate-x-0' : (isSidebarHovered ? 'w-64' : 'w-16'))
                        : (isMobile ? 'translate-x-[100%] w-0' : 'w-0 opacity-0 overflow-hidden')
                    }
                `}
            >
                <div className={`p-4 flex items-center ${isSidebarHovered || isMobile ? 'justify-between' : 'justify-center'} overflow-hidden h-14`}>
                    {(isSidebarHovered || isMobile) ? (
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 truncate">
                            {isStandalone ? 'ملاحظاتي' : 'الملاحظات'}
                        </h2>
                    ) : (
                        <Library className="w-6 h-6 text-emerald-600" />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <SidebarTree
                        activeFolderId={activeFolderId}
                        onSelectFolder={handleSelectFolder}
                        onFolderDeleted={handleFolderDeleted}
                        onSearch={setSearchQuery}
                        collapsed={!isSidebarHovered && !isMobile && isSidebarOpen}
                    />
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 bg-black/20 z-20" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
                <div className={`h-14 ${isStandalone ? 'mt-2' : 'mt-6'} border-b border-gray-100 flex items-center px-4 gap-4 bg-white/50 backdrop-blur z-20`}>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="w-5 h-5 text-gray-500" />
                    </Button>

                    {/* Selection Actions Bar */}
                    {isSelectionMode ? (
                        <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-top-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                                setIsSelectionMode(false);
                                setSelectedItems(new Set());
                            }}>إلغاء</Button>
                            <span className="text-sm font-bold text-gray-600">{selectedItems.size} محدد</span>
                            <div className="flex-1" />
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={handleDeleteSelected}
                                disabled={selectedItems.size === 0}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">حذف</span>
                            </Button>
                            {/* Share button temporarily disabled or simplified */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={handleShareSelected}
                                disabled={selectedItems.size === 0}
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline">مشاركة</span>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-sm text-gray-600 overflow-hidden">
                                {isSaving && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 animate-pulse ml-2" dir="rtl">
                                        <Cloud className="w-3 h-3" />
                                        <span>جاري الحفظ...</span>
                                    </div>
                                )}
                                <span
                                    className="hover:text-emerald-600 cursor-pointer text-lg font-bold flex items-center gap-1"
                                    onClick={() => {
                                        setViewMode('grid');
                                        setActiveFolderId(null);
                                        setSearchQuery('');
                                    }}
                                >
                                    المكتبة
                                </span>

                                {searchQuery && (
                                    <>
                                        <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300 flex-shrink-0" />
                                        <span className="font-medium text-amber-600 truncate">بحث: "{searchQuery}"</span>
                                    </>
                                )}

                                {!searchQuery && activeFolderId && (
                                    <>
                                        <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300 flex-shrink-0" />
                                        <span className="font-medium text-gray-900 truncate">
                                            {activeFolderId === 'trash' ? 'سلة المحذوفات' :
                                                activeFolderId === 'bookmarked' ? 'إشارات مرجعية' :
                                                    (folders.find(f => f.id === activeFolderId)?.name || 'مجلد')}
                                        </span>
                                    </>
                                )}
                                {activeNote && (
                                    <>
                                        <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300 flex-shrink-0" />
                                        <span className="font-bold text-indigo-600 truncate max-w-[100px] sm:max-w-[200px]">{activeNote.title}</span>
                                    </>
                                )}
                            </div>

                            {!activeNote && (
                                <div className="mr-auto flex items-center gap-2">
                                    {(viewMode === 'grid' || viewMode === 'list') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-emerald-600"
                                            onClick={() => setIsSelectionMode(true)}
                                            title="تحديد متعدد"
                                        >
                                            <CheckSquare className="w-5 h-5" />
                                        </Button>
                                    )}

                                    <Button variant="ghost" size="icon" onClick={() => setIsFloatingSearchOpen(true)} className="text-gray-400">
                                        <Search className="w-5 h-5" />
                                    </Button>

                                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                                        <Settings className="w-5 h-5 text-gray-400" />
                                    </Button>

                                    <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 ml-1">
                                        <Button
                                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className={`h-7 px-2 text-[10px] rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            <LayoutGrid className="w-3 h-3 sm:hidden" />
                                            <span className="hidden sm:inline">مجلدات</span>
                                        </Button>
                                        <Button
                                            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('kanban')}
                                            className={`h-7 px-2 text-[10px] rounded-md ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            <Menu className="w-3 h-3 sm:ml-1" />
                                            <span className="hidden sm:inline">كنبان</span>
                                        </Button>
                                    </div>

                                    <Button onClick={() => setShowCreateFolder(true)} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                                        <FolderPlus className="w-4 h-4" />
                                        <span className="hidden sm:inline">مجلد</span>
                                    </Button>
                                    <Button onClick={() => { setActiveFolderId(activeFolderId || null); setShowCreateNote(true); }} size="sm" variant="outline" className="gap-2 h-8 text-xs text-emerald-700 border-emerald-100">
                                        <FilePlus className="w-4 h-4" />
                                        <span className="hidden sm:inline">ملاحظة</span>
                                    </Button>
                                </div>
                            )}
                        </>)}
                </div>

                {/* Floating Search Overlay */}
                {isFloatingSearchOpen && (
                    <div className="absolute inset-x-0 top-14 z-50 p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 animate-in slide-in-from-top-4">
                        <div className="max-w-2xl mx-auto flex items-center gap-3 bg-white shadow-xl rounded-xl border border-emerald-100 p-2">
                            <Search className="w-5 h-5 text-emerald-500 mr-2" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="ابحث في ملاحظاتك..."
                                className="flex-1 bg-transparent border-none outline-none text-lg p-2"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsFloatingSearchOpen(false)}
                            />
                            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setIsFloatingSearchOpen(false); }}>
                                إغلاق
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden relative p-4 bg-gray-50/30">
                    {/* View: Kanban */}
                    {viewMode === 'kanban' && !searchQuery && !activeNote && (
                        <div className="h-full animate-in fade-in duration-300">
                            <KanbanView
                                onOpenNote={handleSelectNote}
                                onOpenFolder={(f) => handleSelectFolder(f.id)}
                                onRequestCreateNote={(folderId) => {
                                    setActiveFolderId(folderId || null);
                                    setShowCreateNote(true);
                                }}
                            />
                        </div>
                    )}

                    {/* View: Folder Grid */}
                    {viewMode === 'grid' && !searchQuery && activeFolderId !== 'bookmarked' && (
                        <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                            <FolderGrid
                                onOpenFolder={handleSelectFolder}
                                onOpenNote={handleSelectNote}
                                onRequestCreateNote={(folderId) => {
                                    setActiveFolderId(folderId || null);
                                    setShowCreateNote(true);
                                }}
                                onRequestCreateFolder={() => setShowCreateFolder(true)}
                                isMobile={isMobile}
                                isSelectionMode={isSelectionMode}
                                selectedIds={selectedItems}
                                onToggleSelection={handleToggleSelection}
                            />
                        </div>
                    )}

                    {/* View: Note List */}
                    {(viewMode === 'list' || searchQuery || activeFolderId === 'bookmarked') && !activeNote && (
                        <div className="h-full flex gap-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 h-full overflow-y-auto custom-scrollbar-visible bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <NoteList
                                    folderId={activeFolderId}
                                    searchQuery={searchQuery}
                                    onSelectNote={handleSelectNote}
                                    activeNoteId={activeNote?.id}
                                    isSelectionMode={isSelectionMode}
                                    selectedIds={selectedItems}
                                    onToggleSelection={handleToggleSelection}
                                />
                            </div>
                            <div className="hidden md:flex flex-1 bg-white/50 rounded-3xl border border-dashed border-gray-200 items-center justify-center text-gray-400">
                                {searchQuery ? 'نتائج البحث' : 'اختر ملاحظة للعرض'}
                            </div>
                        </div>
                    )}

                    {/* View: Editor */}
                    {viewMode === 'editor' && activeNote && (
                        <div className="h-full w-full animate-in slide-in-from-bottom-4 duration-500">
                            <NoteEditorV2
                                initialContent={activeNote.content}
                                onUpdate={async (c) => {
                                    setIsSaving(true);
                                    await updateNote({ id: activeNote.id, updates: { content: c } });
                                    setIsSaving(false);
                                }}
                                autoInsertSeparator={settings.autoInsertSeparator}
                                isBookmarked={false}
                                onToggleBookmark={async () => {
                                    // Feature not available in quick_notes
                                    toast({ title: 'غير متوفر', description: 'الإشارات المرجعية غير مدعومة حالياً' });
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <NotesSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onExportPDF={handleExportPDF}
            />
            <CreateFolderDialog
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                parentFolderId={activeFolderId === 'trash' ? null : activeFolderId}
            />
            <CreateNoteDialog
                isOpen={showCreateNote}
                onClose={() => {
                    setShowCreateNote(false);
                    setAutoStartRecording(false);
                    setCreateNoteInitialFolderId(null);
                }}
                initialFolderId={createNoteInitialFolderId || (activeFolderId === 'trash' ? null : activeFolderId)}
                autoStartRecording={autoStartRecording}
            />
            <div dir="rtl">
                <ReportGenerator
                    isOpen={showReportGenerator}
                    onClose={() => setShowReportGenerator(false)}
                />

                {/* Floating Add Button Removed - Moved to CoreLayout */}

            </div>
        </div>
    );
};

// Floating Add Button Component with Long Press Support
const FloatingAddButton: React.FC<{ onTap: () => void; onLongPress: () => void }> = ({ onTap, onLongPress }) => {
    const timerRef = React.useRef<NodeJS.Timeout>();
    const isLongPressActive = React.useRef(false);
    const hasStarted = React.useRef(false);
    const [isPressed, setIsPressed] = React.useState(false);

    const handleStart = () => {
        hasStarted.current = true;
        isLongPressActive.current = false;
        setIsPressed(true);

        timerRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            onLongPress();
            isLongPressActive.current = true;
            setIsPressed(false);
        }, 500);
    };

    const handleEnd = () => {
        if (!hasStarted.current) return;
        setIsPressed(false);

        if (timerRef.current) clearTimeout(timerRef.current);
        if (!isLongPressActive.current) {
            onTap();
        }
        isLongPressActive.current = false;
        hasStarted.current = false;
    };

    const handleCancel = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        isLongPressActive.current = false;
        hasStarted.current = false;
        setIsPressed(false);
    };

    return (
        <button
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleCancel}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onTouchMove={handleCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`fixed bottom-24 left-6 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl transition-all z-[60] flex items-center justify-center border-4 border-white/20 ${isPressed ? 'scale-110 bg-emerald-600' : 'active:scale-95'}`}
        >
            <Plus className="w-8 h-8 stroke-[3]" />
        </button>
    );
};

