import React from 'react';
import { useFolders } from '@/hooks/useFolders';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Hash, Trash2, Search, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarTreeProps {
    activeFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    onSearch?: (query: string) => void;
    collapsed?: boolean;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ activeFolderId, onSelectFolder, onSearch, collapsed }) => {
    const { folders } = useFolders();
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());


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

                {/* If collapsed, we don't show children unless we want a popover tree. For now, hide children in collapsed mode or just render them flat?
                   Actually simpler: if collapsed, don't show children indent.
                   Wait, user said "Icons only". If hierarchy is important, maybe we shouldn't hide it.
                   But for "small icons only", typically we just show roots or flattening is hard.
                   Let's assume collapsed mode is simple list.
                   BUT if I hide children in collapsed mode, navigation is broken for subfolders.
                   Let's render children but without indentation in collapsed mode? No that's confusing.
                   Let's rendering children ONLY if expanded. Even if collapsed, user can't toggle expand because I hid the button.
                   So in collapsed mode, maybe we only show root folders?
                   Or we show ALL flat?
                   Let's keep rendering children, but user can't toggle. 
                   If they are already expanded, they show.
                   Let's better HIDE children in collapsed mode for simplicity, OR rely on `expandedFolders` but user can't click toggle.
                   Let's assume collapsed is mainly for quick access to *some* folders.
                   Actually, let's just hide children render if collapsed to avoid clutter.
                */}
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

            {/* Bookmarks Removed */}
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
        </div>
    );
};
