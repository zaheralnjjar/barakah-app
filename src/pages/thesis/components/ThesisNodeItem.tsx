import React, { memo } from 'react';
import { ThesisNode, NODE_STATUS_CONFIG } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    BookOpen, Folder, FileText, GitBranch, List,
    ChevronDown, ChevronRight, CheckCircle2, MoreVertical,
    Plus, Edit, Calendar, Merge, Scissors, Trash2
} from 'lucide-react';
import { isAcademicReadOnly } from '@/utils/platformDetection';

interface ThesisNodeItemProps {
    node: ThesisNode;
    level: number;
    expandedIds: Record<string, boolean>;
    fileStatusMap: Record<string, boolean>;
    folderPath: string | null;
    onToggleExpand: (id: string) => void;
    onStatusChange: (node: ThesisNode, status: string) => void;
    onAdd: (node: ThesisNode) => void;
    onEdit: (node: ThesisNode) => void;
    onAppointment: (node: ThesisNode) => void;
    onMerge: (id: string) => void;
    onSplit: (id: string) => void;
    onDelete: (id: string) => void;
    onOpenFolder: (node: ThesisNode) => void;
}

const ThesisNodeItem = memo(({
    node,
    level,
    expandedIds,
    fileStatusMap,
    folderPath,
    onToggleExpand,
    onStatusChange,
    onAdd,
    onEdit,
    onAppointment,
    onMerge,
    onSplit,
    onDelete,
    onOpenFolder
}: ThesisNodeItemProps) => {
    const isReadOnly = isAcademicReadOnly(); // Read-only on Android
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedIds[node.id];
    const hasFile = !!fileStatusMap[node.id];

    let icon = BookOpen;
    let color = "text-blue-600";
    let label = "فصل";
    let borderClass = "";

    if (node.type === 'section') { icon = Folder; color = "text-amber-600"; label = "مبحث"; }
    if (node.type === 'subsection') { icon = FileText; color = "text-green-600"; label = "مطلب"; }
    if (node.type === 'branch') { icon = GitBranch; color = "text-red-600"; label = "فرع"; }
    if (node.type === 'issue') { icon = List; color = "text-purple-600"; label = "مسألة"; }

    const Icon = icon;

    if (level === 0) { borderClass = 'border-l-4 border-l-blue-500 shadow-sm'; }
    if (level === 1) { borderClass = 'mr-6 border-l-4 border-l-amber-500'; }
    if (level === 2) { borderClass = 'mr-12 border-l-4 border-l-green-500'; }
    if (level === 3) { borderClass = 'mr-16 border-l-4 border-l-red-500'; }
    if (level === 4) { borderClass = 'mr-20 border-l-4 border-l-purple-500'; }

    return (
        <div className="mb-2 select-none">
            <div className={`
                flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors
                ${borderClass}
            `}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpand(node.id)}
                    className="p-1 h-6 w-6 hover:bg-gray-200 rounded shrink-0"
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground text-rtl-flip" />
                    ) : <div className="w-4 h-4" />}
                </Button>

                <div className={`p-2 rounded-full bg-slate-100 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded`}>{label}</span>
                        <span className="font-semibold text-lg">{node.title}</span>

                        {/* Status Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full cursor-pointer flex items-center gap-1 ${node.status && NODE_STATUS_CONFIG[node.status] ? NODE_STATUS_CONFIG[node.status].color : 'bg-gray-100 text-gray-500'}`}
                                    title="انقر لتغيير الحالة"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {node.status && NODE_STATUS_CONFIG[node.status] ? (
                                        <>
                                            <span className={`inline-block w-2 h-2 rounded-full ${NODE_STATUS_CONFIG[node.status].dotColor}`}></span>
                                            {NODE_STATUS_CONFIG[node.status].label}
                                        </>
                                    ) : (
                                        "+ حالة"
                                    )}
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[150px]">
                                {Object.entries(NODE_STATUS_CONFIG).map(([key, config]) => (
                                    <DropdownMenuItem
                                        key={key}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(node, key);
                                        }}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                                        {config.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {node.file_path && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded truncate max-w-[100px]" title={node.file_path}>
                                {node.file_path}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Menu */}
                <div className="flex items-center gap-1">
                    {/* Open Folder Manager - Prominent Button */}
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenFolder(node)}
                        title={hasFile ? "فتح المجلد" : "إدارة المجلد"}
                        className={`${hasFile
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-[#D97706] hover:bg-[#B45309]"} !text-white px-3 h-7 rounded text-xs gap-1.5 ml-1 shadow-sm transition-all`}
                    >
                        {hasFile ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Folder className="w-3.5 h-3.5 text-white" />}
                        <span className="text-white">فتح</span>
                    </Button>

                    {/* Toolbar Actions - Icons Only - Hidden in Read-Only mode */}
                    {!isReadOnly && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {/* Add Child */}
                                {level < 4 && (
                                    <DropdownMenuItem onClick={() => onAdd(node)} className="gap-2 text-green-600 focus:text-green-700 focus:bg-green-50">
                                        <Plus className="w-4 h-4" />
                                        <span>إضافة فرعي</span>
                                    </DropdownMenuItem>
                                )}

                                {/* Edit */}
                                <DropdownMenuItem onClick={() => onEdit(node)} className="gap-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                    <Edit className="w-4 h-4" />
                                    <span>تعديل الاسم</span>
                                </DropdownMenuItem>

                                {/* Appointment - New Feature */}
                                <DropdownMenuItem onClick={() => onAppointment(node)} className="gap-2 text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                    <Calendar className="w-4 h-4" />
                                    <span>تعيين موعد/مجازة</span>
                                </DropdownMenuItem>

                                {/* Merge */}
                                <DropdownMenuItem onClick={() => onMerge(node.id)} className="gap-2 text-purple-600 focus:text-purple-700 focus:bg-purple-50">
                                    <Merge className="w-4 h-4" />
                                    <span>دمج مع التالي</span>
                                </DropdownMenuItem>

                                {/* Split */}
                                {node.children && node.children.length >= 2 && (
                                    <DropdownMenuItem onClick={() => onSplit(node.id)} className="gap-2 text-teal-600 focus:text-teal-700 focus:bg-teal-50">
                                        <Scissors className="w-4 h-4" />
                                        <span>تقسيم</span>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {/* Delete */}
                                <DropdownMenuItem onClick={() => onDelete(node.id)} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {
                isExpanded && node.children && (
                    <div className="mt-2 animate-in slide-in-from-top-2">
                        {node.children.map(child => (
                            <ThesisNodeItem
                                key={child.id}
                                node={child}
                                level={level + 1}
                                expandedIds={expandedIds}
                                fileStatusMap={fileStatusMap}
                                folderPath={folderPath}
                                onToggleExpand={onToggleExpand}
                                onStatusChange={onStatusChange}
                                onAdd={onAdd}
                                onEdit={onEdit}
                                onAppointment={onAppointment}
                                onMerge={onMerge}
                                onSplit={onSplit}
                                onDelete={onDelete}
                                onOpenFolder={onOpenFolder}
                            />
                        ))}
                    </div>
                )
            }
        </div >
    );
});

export default ThesisNodeItem;
