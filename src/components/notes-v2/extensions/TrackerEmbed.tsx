import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { Activity, Plus, Trash2, BarChart3, Layout, Palette, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';
import { toast } from 'sonner';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const BG_COLORS = [
    'transparent', '#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fefce8', '#fef2f2', '#faf5ff', '#fff7ed'
];
const BORDER_COLORS = [
    'transparent', '#e5e7eb', '#9ca3af', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
];

interface TrackerItem {
    id: string;
    label: string;
    type: string;
    icon?: string;
    color?: string;
    value?: number;
    goal?: number;
    unit?: string;
}

const TrackerChart = ({ tracker }: { tracker: TrackerItem }) => {
    const { data: history } = useQuery({
        queryKey: ['tracker-history-full', tracker.id],
        queryFn: async () => {
            const data = await trackingService.getHistory(tracker.id, 7);
            return data.map(entry => ({
                date: new Date(entry.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
                value: entry.value,
                originalDate: new Date(entry.date)
            })).reverse();
        }
    });

    if (!history || history.length === 0) {
        return (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-[10px]">لا توجد بيانات كافية للرسم البياني</span>
            </div>
        );
    }

    return (
        <div className="h-40 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                    <defs>
                        <linearGradient id={`color-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={tracker.color || '#4F46E5'} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={tracker.color || '#4F46E5'} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={[0, 'auto']} />
                    <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={tracker.color || '#4F46E5'}
                        fillOpacity={1}
                        fill={`url(#color-${tracker.id})`}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const TrackerChip = ({ tracker, displayMode }: { tracker: TrackerItem, displayMode: 'chip' | 'chart' }) => {
    const queryClient = useQueryClient();

    const { data: latestEntry } = useQuery({
        queryKey: ['tracker-latest', tracker.id],
        queryFn: async () => {
            const history = await trackingService.getHistory(tracker.id, 1);
            return history && history.length > 0 ? history[0] : null;
        },
    });

    const addEntryMutation = useMutation({
        mutationFn: trackingService.addEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tracker-latest', tracker.id] });
            queryClient.invalidateQueries({ queryKey: ['tracker-history-full', tracker.id] });
            toast.success("تم التحديث");
        }
    });

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addEntryMutation.mutate({
            tracker_id: tracker.id,
            value: 1,
            date: new Date(),
        });
    };

    const val = latestEntry?.value || 0;
    const goal = tracker.goal || 10;

    if (displayMode === 'chart') {
        return (
            <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-100 min-w-[240px]">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${tracker.color}15`, color: tracker.color }}>
                            {tracker.icon || <Activity size={13} />}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{tracker.label}</span>
                    </div>
                    <button onClick={handleQuickAdd} className="p-0.5 hover:bg-indigo-50 rounded-full text-indigo-600 transition-all">
                        <Plus size={14} />
                    </button>
                </div>
                <TrackerChart tracker={tracker} />
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-gray-400">آخر قيمة: {val}</span>
                    <span className="text-[10px] text-gray-400">الهدف: {goal}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-all min-w-[160px] flex-1">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: `${tracker.color}15`, color: tracker.color || '#4F46E5' }}
            >
                {tracker.icon || <Activity size={14} />}
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span className="text-xs font-bold text-gray-800 truncate" title={tracker.label}>{tracker.label}</span>
                <div className="flex items-center justify-between gap-1.5">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(100, (val / goal) * 100)}%`,
                                backgroundColor: tracker.color || '#4F46E5'
                            }}
                        />
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono font-medium">{val}/{goal}</span>
                </div>
            </div>

            <button
                onClick={handleQuickAdd}
                disabled={addEntryMutation.isPending}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-gray-200 hover:border-indigo-200 transition-colors active:scale-95 disabled:opacity-50"
            >
                {addEntryMutation.isPending ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div> : <Plus size={14} />}
            </button>
        </div>
    );
};

const TrackerNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const trackers: TrackerItem[] = Array.isArray(node.attrs.trackers) ? node.attrs.trackers : [];
    const displayMode = node.attrs.displayMode || 'chip';

    const [isHovered, setIsHovered] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const width = node.attrs.width || 280;
    const height = node.attrs.height || 100;
    const bgColor = node.attrs.bgColor || 'transparent';
    const borderColor = node.attrs.borderColor || 'transparent';
    const borderWidth = node.attrs.borderWidth || 0;
    const zIndex = node.attrs.zIndex || 50;
    const opacity = node.attrs.opacity ?? 1;

    const editorZoom = (editor.storage as any).page?.zoom || 100;
    const dragScale = editorZoom / 100;

    const [dragPos, setDragPos] = useState({ x, y });

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleStop = (_e: any, data: any) => {
        setIsDragging(false);
        setDragPos({ x: data.x, y: data.y });
        updateAttributes({ x: data.x, y: data.y });
    };

    const handleResize = (e: any, { handle, size: newSize }: any) => {
        e.stopPropagation();
        let newWidth = Math.max(200, newSize.width);
        let newHeight = Math.max(60, newSize.height);
        let newX = x;
        let newY = y;

        if (handle.includes('w')) {
            newX = x - (newWidth - width);
        }
        if (handle.includes('n')) {
            newY = y - (newHeight - height);
        }

        setDragPos({ x: newX, y: newY });
        updateAttributes({
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY
        });
    };

    const showControls = isHovered || selected || popoverOpen || isDragging;
    const toMM = (px: number) => Math.round(px * 0.264583);

    if (!trackers || trackers.length === 0) return null;

    return (
        <NodeViewWrapper
            className="absolute z-10"
            style={{
                left: 0,
                top: 0,
                width: width,
                height: 0,
                zIndex: isDragging ? 9999 : zIndex,
                direction: 'ltr'
            }}
        >
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                position={dragPos}
                onStart={() => setIsDragging(true)}
                onStop={handleStop}
                onDrag={(_e, data) => setDragPos({ x: data.x, y: data.y })}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn(
                        "absolute group",
                        !isDragging && !isResizing && "transition-transform"
                    )}
                    style={{
                        paddingBottom: '60px',
                        marginBottom: '-60px',
                        willChange: (isDragging || isResizing) ? 'transform' : 'auto',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => { if (!popoverOpen) setIsHovered(false); }}
                >
                    <ResizableBox
                        width={width}
                        height={height}
                        onResizeStart={() => setIsResizing(true)}
                        onResizeStop={(e, data) => { setIsResizing(false); handleResize(e, data); }}
                        onResize={handleResize}
                        minConstraints={[200, 60]}
                        maxConstraints={[1200, 1200]}
                        resizeHandles={['s', 'e', 'w', 'n', 'sw', 'nw', 'se', 'ne']}
                        className={cn(
                            "relative drag-handle",
                            showControls ? "ring-2 ring-indigo-500/50 rounded-xl shadow-xl" : ""
                        )}
                        handle={(handleAxis, ref) => {
                            if (!showControls) return <div ref={ref} className="hidden" />;
                            const handleClasses: Record<string, string> = {
                                's': 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
                                'e': 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
                                'se': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
                                'sw': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
                                'nw': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
                                'ne': 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
                                'w': 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
                                'n': 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
                            };
                            const cls = handleClasses[handleAxis];
                            return (
                                <div ref={ref} className={cn("absolute w-3.5 h-3.5 z-[60] group/handle flex items-center justify-center", cls)}>
                                    <div className="w-2.5 h-2.5 bg-[#4B96FF] border-2 border-white rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                                </div>
                            );
                        }}
                    >
                        <div
                            className="w-full h-full rounded-xl overflow-hidden pointer-events-auto"
                            style={{
                                backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                                borderColor: borderColor === 'transparent' ? 'transparent' : borderColor,
                                borderWidth: `${borderWidth}px`,
                                borderStyle: borderWidth > 0 ? 'solid' : 'none',
                                opacity: opacity,
                            }}
                            dir="rtl"
                        >
                            <div className="p-1.5 flex flex-col gap-1.5 min-h-full">
                                {trackers.map((tracker, index) => (
                                    <TrackerChip key={tracker.id + index} tracker={tracker} displayMode={displayMode} />
                                ))}
                            </div>
                        </div>

                        {isResizing && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded-full border border-white/20 backdrop-blur-md z-[110] font-mono whitespace-nowrap shadow-2xl animate-in fade-in zoom-in duration-200">
                                {toMM(width)}mm × {toMM(height)}mm
                            </div>
                        )}

                        {/* Floating Pill Toolbar — Bottom Center */}
                        <div
                            className={cn(
                                "absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl px-2 py-1.5 rounded-full z-[100] transition-all cursor-default dir-rtl",
                                showControls && !isResizing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                            )}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <Activity size={13} className="text-indigo-600" />
                                </div>
                                <div className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: bgColor || '#fff' }} />
                            </div>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <button
                                onClick={() => updateAttributes({ displayMode: displayMode === 'chip' ? 'chart' : 'chip' })}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                title={displayMode === 'chip' ? "عرض المخطط" : "عرض البطاقة"}
                            >
                                {displayMode === 'chip' ? <BarChart3 size={15} /> : <Layout size={15} />}
                            </button>

                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                                        <Palette size={15} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-xl" align="center" dir="rtl" sideOffset={12}>
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">إعدادات المتعقب</div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400">لون المربع</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {BG_COLORS.map(c => (
                                                    <button key={c} onClick={() => updateAttributes({ bgColor: c })}
                                                        className={cn("w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110", bgColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                                        style={{ backgroundColor: c === 'transparent' ? '#eee' : c }}>
                                                        {c === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400">لون الحدود</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {BORDER_COLORS.map(c => (
                                                    <button key={c} onClick={() => updateAttributes({ borderColor: c, borderWidth: c === 'transparent' ? 0 : Math.max(1, borderWidth) })}
                                                        className={cn("w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110", borderColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                                        style={{ backgroundColor: c === 'transparent' ? '#eee' : c }}>
                                                        {c === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400">الشفافية ({Math.round(opacity * 100)}%)</label>
                                            <Slider value={[opacity * 100]} min={10} max={100} step={1} onValueChange={([val]) => updateAttributes({ opacity: val / 100 })} />
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <div className="text-[10px] font-bold text-gray-400">الترتيب</div>
                                            <div className="flex gap-1">
                                                <button onClick={() => updateAttributes({ zIndex: zIndex + 1 })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronUp size={14} /></button>
                                                <button onClick={() => updateAttributes({ zIndex: Math.max(1, zIndex - 1) })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronDown size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <button onClick={() => deleteNode()} className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors">
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};

export const TrackerEmbed = Node.create({
    name: 'trackerEmbed',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            trackers: { default: [] },
            x: { default: 50 },
            y: { default: 50 },
            width: { default: 280 },
            height: { default: 100 },
            displayMode: { default: 'chip' },
            bgColor: { default: 'transparent' },
            borderColor: { default: 'transparent' },
            borderWidth: { default: 0 },
            zIndex: { default: 50 },
            opacity: { default: 1 },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="tracker-embed"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        trackers: JSON.parse(element.getAttribute('data-trackers') || '[]'),
                        x: parseInt(element.getAttribute('data-x') || '50', 10),
                        y: parseInt(element.getAttribute('data-y') || '50', 10),
                        width: parseInt(element.getAttribute('data-width') || '280', 10),
                        height: parseInt(element.getAttribute('data-height') || '100', 10),
                        displayMode: element.getAttribute('data-mode') || 'chip',
                        bgColor: element.getAttribute('data-bg-color') || 'transparent',
                        borderColor: element.getAttribute('data-border-color') || 'transparent',
                        borderWidth: parseFloat(element.getAttribute('data-border-width') || '0'),
                        zIndex: parseInt(element.getAttribute('data-z-index') || '50', 10),
                        opacity: parseFloat(element.getAttribute('data-opacity') || '1'),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'tracker-embed',
            'data-trackers': JSON.stringify(HTMLAttributes.trackers),
            'data-x': HTMLAttributes.x,
            'data-y': HTMLAttributes.y,
            'data-width': HTMLAttributes.width,
            'data-height': HTMLAttributes.height,
            'data-mode': HTMLAttributes.displayMode,
            'data-bg-color': HTMLAttributes.bgColor,
            'data-border-color': HTMLAttributes.borderColor,
            'data-border-width': HTMLAttributes.borderWidth,
            'data-z-index': HTMLAttributes.zIndex,
            'data-opacity': HTMLAttributes.opacity,
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TrackerNodeView);
    },
});
