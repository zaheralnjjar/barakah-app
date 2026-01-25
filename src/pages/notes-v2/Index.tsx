
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
import { Settings, Menu, ChevronRight, Plus, FolderPlus, FilePlus, LayoutGrid } from 'lucide-react';
import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/use-toast';
import SideNavBar from '@/components/SideNavBar';
import { useNavigate } from 'react-router-dom';
import ReportGenerator from '@/components/ReportGenerator';

import { supabase } from '@/integrations/supabase/client';

const NotesLayoutV2 = () => {
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeNote, setActiveNote] = useState<NoteV2 | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'editor' | 'kanban'>('grid');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showCreateNote, setShowCreateNote] = useState(false);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [showNotesManager, setShowNotesManager] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();

    // Settings State (Persisted in localStorage for independence)
    const [settings, setSettings] = useState({
        autoInsertSeparator: true,
        showFolderGridInitial: true,
    });

    // Hooks
    const {
        folders,
        isLoading: foldersLoading
    } = useFolders();

    const {
        notes,
        updateNote
    } = useNotesV2(activeFolderId, searchQuery);

    const { toast } = useToast();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect: Load Settings
    useEffect(() => {
        const saved = localStorage.getItem('notes-v2-settings');
        if (saved) setSettings(JSON.parse(saved));
        else setSettings(prev => ({ ...prev, showFolderGridInitial: true }));
    }, []);

    // Effect: Save Settings
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

    const handleCloseEditor = () => {
        setActiveNote(null);
        setViewMode(searchQuery ? 'list' : (activeFolderId === null ? 'grid' : 'list'));
    };

    // Backup Export
    const handleExportBackup = async () => {
        try {
            toast({ title: 'جاري تحضير النسخة الاحتياطية...' });

            // Fetch all data
            const { data: notes } = await supabase.from('notes_v2').select('*');
            const { data: folders } = await supabase.from('folders').select('*');

            const backupData = {
                version: "1.0",
                date: new Date().toISOString(),
                folders: folders || [],
                notes: notes || []
            };

            // Download
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

    const handleExportPDF = async () => {
        try {
            toast({ title: 'جاري تحضير ملف PDF...' });

            // 1. Fetch Data
            const { data: allNotes } = await supabase.from('notes_v2').select('*');
            const { data: allFolders } = await supabase.from('folders').select('*');

            if (!allNotes || !allFolders) return;

            // 2. Prepare HTML Structure
            const dateStr = new Date().toLocaleDateString('ar-SA');

            let htmlContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <title>Barakah Notes Backup - ${dateStr}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                        body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #333; }
                        h1, h2, h3 { color: #1e1b4b; }
                        .cover-page { 
                            height: 100vh; display: flex; flex-direction: column; 
                            justify-content: center; align-items: center; text-align: center; 
                            page-break-after: always; 
                        }
                        .folder-section { margin-top: 40px; page-break-before: always; }
                        .note-card { 
                            border: 1px solid #eee; padding: 20px; margin-bottom: 20px; 
                            border-radius: 8px; break-inside: avoid;
                        }
                        .note-meta { color: #666; font-size: 0.8em; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .note-content { font-size: 1em; line-height: 1.6; }
                        img { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    <div class="cover-page">
                        <h1 style="font-size: 3em; margin-bottom: 10px;">دفتر ملاحظات بركة</h1>
                        <p style="font-size: 1.5em; color: #666;">نسخة احتياطية كاملة</p>
                        <p>${dateStr}</p>
                    </div>
            `;

            // 3. Iterate and Build
            // Group by folder
            const notesByFolder: Record<string, any[]> = {};
            allFolders.forEach(f => notesByFolder[f.id] = []);
            notesByFolder['uncategorized'] = [];

            allNotes.forEach(n => {
                const fid = n.folder_id || 'uncategorized';
                if (notesByFolder[fid]) notesByFolder[fid].push(n);
                else notesByFolder['uncategorized'].push(n);
            });

            // Render Folders
            for (const folder of [...allFolders, { id: 'uncategorized', name: 'غير مصنف' }]) {
                const folderNotes = notesByFolder[folder.id];
                if (!folderNotes || folderNotes.length === 0) continue;

                htmlContent += `
                    <div class="folder-section">
                        <h2 style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">📂 ${folder.name}</h2>
                        ${folderNotes.map(note => `
                            <div class="note-card">
                                <h3>${note.title || 'بدون عنوان'}</h3>
                                <div class="note-meta">
                                    تاريخ الإنشاء: ${new Date(note.created_at).toLocaleString('ar-SA')}
                                </div>
                                <div class="note-content">
                                    ${note.content || '<p class="text-gray-400">لا يوجد محتوى</p>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            htmlContent += `</body></html>`;

            // 4. Open Print Window
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                // Wait for images logic or just simple timeout
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }

        } catch (e) {
            console.error(e);
            toast({ title: 'فشل تصدير PDF', variant: 'destructive' });
        }
    };

    // Editor Auto-Save Wrapper
    useEffect(() => {
    }, [activeNote]);


    return (
        <div className="flex h-screen bg-white w-full overflow-hidden" dir="rtl">



            {/* Sidebar (Collapsible) - Shifted left to make room for fixed nav */}
            <div
                className={`
                    flex-shrink-0 bg-gray-50 border-l border-gray-100 transition-all duration-300 flex flex-col
                    ${isMobile ? 'mr-0' : 'mr-0'}
                    ${isSidebarOpen
                        ? (isMobile ? 'w-0 hidden' : 'w-64')
                        : 'w-0 opacity-0 overflow-hidden'
                    }
                `}
            >
                {/* Sidebar Header */}
                <div className={`p-4 flex items-center ${isMobile ? 'justify-center' : 'justify-between'}`}>
                    {!isMobile && <h2 className="font-bold text-gray-800 text-lg">الملاحظات</h2>}
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="w-5 h-5 text-gray-400" />
                    </Button>
                </div>

                {/* Tree */}
                <div className="flex-1 overflow-hidden">
                    <SidebarTree
                        activeFolderId={activeFolderId}
                        onSelectFolder={handleSelectFolder}
                        onSearch={setSearchQuery}
                        collapsed={isMobile}
                    />
                </div>

                {/* Footer Actions Removed as per request */}
                <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                    {/* Buttons removed */}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">

                {/* Top Navigation Bar - Lowered for Android */}
                <div className="h-14 mt-6 border-b border-gray-100 flex items-center px-4 gap-4 bg-white/50 backdrop-blur z-20">
                    {/* Sidebar Toggle Removed as per request */}

                    {/* Breadcrumbs / Title */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span
                            className="hover:text-indigo-600 cursor-pointer text-lg font-bold"
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
                                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300" />
                                <span className="font-medium text-amber-600">نتائج البحث: "{searchQuery}"</span>
                            </>
                        )}

                        {!searchQuery && activeFolderId && (
                            <>
                                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300" />
                                <span className="font-medium text-gray-900">
                                    {activeFolderId === 'trash' ? 'سلة المحذوفات' :
                                        activeFolderId === 'bookmarked' ? 'إشارات مرجعية' :
                                            (folders.find(f => f.id === activeFolderId)?.name || 'مجلد')}
                                </span>
                            </>
                        )}
                        {activeNote && (
                            <>
                                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-300" />
                                <span className="font-bold text-indigo-600 truncate max-w-[150px]">{activeNote.title}</span>
                            </>
                        )}
                    </div>

                    {/* Header Actions (New Folder/Note) - Shown when not in Editor */}
                    {!activeNote && (
                        <div className="mr-auto flex items-center gap-2">
                            {/* View Switcher */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 ml-1">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className={`h-7 px-2 text-[10px] rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <span className="inline">مجلدات</span>
                                </Button>
                                {!isMobile && (
                                    <Button
                                        variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('kanban')}
                                        className={`h-7 px-2 text-[10px] rounded-md ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
                                    >
                                        <Menu className="w-3 h-3 sm:ml-1" />
                                        <span className="hidden xs:inline">كنبان</span>
                                    </Button>
                                )}
                            </div>

                            <Button
                                onClick={() => setShowCreateFolder(true)}
                                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3 text-xs md:text-sm rounded-lg shadow-sm"
                            >
                                <FolderPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">مجلد جديد</span>
                            </Button>
                            <Button
                                onClick={() => {
                                    setActiveFolderId(activeFolderId || null);
                                    setShowCreateNote(true);
                                }}
                                variant="outline"
                                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-9 px-3 text-xs md:text-sm rounded-lg"
                            >
                                <FilePlus className="w-4 h-4" />
                                <span className="hidden sm:inline">ملاحظة جديدة</span>
                            </Button>
                        </div>
                    )}


                </div>

                {/* Content Views */}
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

                    {/* View: Folder Grid (Library) */}
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
                            />
                        </div>
                    )}

                    {/* View: Note List */}
                    {(viewMode === 'list' || searchQuery || activeFolderId === 'bookmarked') && !activeNote && (
                        <div className="h-full flex gap-4 animate-in slide-in-from-right-4 duration-300">
                            {/* Notes List Column */}
                            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 h-full overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <NoteList
                                    folderId={activeFolderId}
                                    searchQuery={searchQuery} // Passing search query
                                    onSelectNote={handleSelectNote}
                                    activeNoteId={activeNote?.id}
                                />
                            </div>

                            {/* Empty State placeholder for desktop */}
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
                                    await updateNote({ id: activeNote.id, updates: { content: c } });
                                }}
                                autoInsertSeparator={settings.autoInsertSeparator}
                                isBookmarked={activeNote.is_bookmarked}
                                onToggleBookmark={async () => {
                                    const updated = await updateNote({
                                        id: activeNote.id,
                                        updates: { is_bookmarked: !activeNote.is_bookmarked }
                                    });
                                    if (updated) setActiveNote({ ...activeNote, is_bookmarked: !activeNote.is_bookmarked });
                                }}
                            />
                        </div>
                    )}

                </div>

            </div>

            {/* Settings Dialog */}
            <NotesSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onExportPDF={handleExportPDF}
            />

            {/* Create Dialogs */}
            <CreateFolderDialog
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                parentFolderId={activeFolderId === 'trash' ? null : activeFolderId}
            />

            <CreateNoteDialog
                isOpen={showCreateNote}
                onClose={() => setShowCreateNote(false)}
                initialFolderId={activeFolderId === 'trash' ? null : activeFolderId}
            />

            {/* Report Generator Dialog */}
            <div dir="rtl">
                <ReportGenerator
                    isOpen={showReportGenerator}
                    onClose={() => setShowReportGenerator(false)}
                />
            </div>

        </div>
    );
};

export default NotesLayoutV2;
