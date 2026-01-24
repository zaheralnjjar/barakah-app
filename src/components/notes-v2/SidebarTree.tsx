
import React from 'react';
import { useFolders } from '@/hooks/useFolders';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Hash } from 'lucide-react';

interface SidebarTreeProps {
    activeFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ activeFolderId, onSelectFolder }) => {
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
        const width = 100 - (depth * 5); // visual fake depth

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
                    `}
                    style={{ paddingRight: `${depth * 12 + 12}px` }} // RTL Padding
                >
                    {/* Expand Toggle */}
                    <button
                        onClick={(e) => toggleFolder(e, folder.id)}
                        className={`p-0.5 rounded-md hover:bg-gray-200 transition-colors ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 rtl:rotate-180" />}
                    </button>

                    {/* Icon */}
                    {isExpanded ? <FolderOpen className="w-4 h-4 text-indigo-400" /> : <Folder className="w-4 h-4 text-gray-400" />}

                    <span className="truncate">{folder.name}</span>
                </div>

                {isExpanded && hasChildren && (
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
        <div className="flex flex-col h-full bg-gray-50/50 border-l border-gray-100 p-3 w-64">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">التنظيم</h3>

            <div
                onClick={() => onSelectFolder(null)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm mb-2 font-medium
                    ${activeFolderId === null ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
                `}
            >
                <Hash className="w-4 h-4" />
                <span>كل الملاحظات</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rootFolders.map(folder => renderFolder(folder))}

                {rootFolders.length === 0 && (
                    <p className="text-xs text-center text-gray-400 mt-4">لا توجد مجلدات</p>
                )}
            </div>
        </div>
    );
};
