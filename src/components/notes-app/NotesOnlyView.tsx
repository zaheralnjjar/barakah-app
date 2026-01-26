import React, { useState } from 'react';
import NotesHeaderSimple from './NotesHeaderSimple';
import NotesBottomNav from './NotesBottomNav';
import { QuadrantNotes } from '../dashboard/QuadrantNotes';
import { QuickNoteDialog } from '@/components/notes-v2/QuickNoteDialog';
import { GlobalSearchDialog } from '../GlobalSearchDialog';
import { cn } from '@/lib/utils';

const NotesOnlyView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            <NotesHeaderSimple />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* We reuse the powerful QuadrantNotes component */}
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <QuadrantNotes />
                </div>
            </div>

            <NotesBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddNote={() => setIsAddDialogOpen(true)}
                onSearch={() => setIsSearchOpen(true)}
            />

            <QuickNoteDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
            />

            <GlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigateToTab={() => { }}
                onOpenNewMuslims={() => { }}
            />
        </div>
    );
};

export default NotesOnlyView;
