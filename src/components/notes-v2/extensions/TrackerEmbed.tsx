import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { Activity, Check, Plus, Minus, X, GripVertical, BarChart3, Layout } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';
import { toast } from 'sonner';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
                    <XAxis
                        dataKey="date"
                        hide
                    />
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
            <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${tracker.color}15`, color: tracker.color }}>
                            {tracker.icon || <Activity size={14} />}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{tracker.label}</span>
                    </div>
                    <button onClick={handleQuickAdd} className="p-1 hover:bg-indigo-50 rounded-full text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">
                        <Plus size={16} />
                    </button>
                </div>
                <TrackerChart tracker={tracker} />
                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] text-gray-400 font-medium">آخر قيمة: {val}</span>
                    <span className="text-[10px] text-gray-400 font-medium">الهدف: {goal}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all min-w-[200px] flex-1">
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${tracker.color}15`, color: tracker.color || '#4F46E5' }}
            >
                {tracker.icon || <Activity size={18} />}
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span className="text-sm font-bold text-gray-800 truncate mb-1" title={tracker.label}>{tracker.label}</span>
                <div className="flex items-center justify-between gap-2">
                    <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(100, (val / goal) * 100)}%`,
                                backgroundColor: tracker.color || '#4F46E5'
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-medium">{val}/{goal}</span>
                </div>
            </div>

            <button
                onClick={handleQuickAdd}
                disabled={addEntryMutation.isPending}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-gray-200 hover:border-indigo-200 transition-colors active:scale-95 disabled:opacity-50"
            >
                {addEntryMutation.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div> : <Plus size={16} />}
            </button>
        </div>
    );
};

const TrackerNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const trackers: TrackerItem[] = Array.isArray(node.attrs.trackers) ? node.attrs.trackers : [];
    const displayMode = node.attrs.displayMode || 'chip';

    const [isHovered, setIsHovered] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const editorZoom = (editor.storage as any).textBox?.zoom || 100;
    const dragScale = editorZoom / 100;

    const [dragPos, setDragPos] = useState({ x, y });

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleStop = (_e: any, data: any) => {
        setDragPos({ x: data.x, y: data.y });
        updateAttributes({ x: data.x, y: data.y });
    };

    const width = node.attrs.width || 280;

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: size.width });
    };

    if (!trackers || trackers.length === 0) return null;

    return (
        <NodeViewWrapper className="absolute z-10" style={{ left: 0, top: 0, direction: 'ltr' }}>
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                position={dragPos}
                onStop={handleStop}
                onDrag={(_e, data) => setDragPos({ x: data.x, y: data.y })}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn(
                        "group relative transition-shadow rounded-2xl overflow-visible bg-white/50 backdrop-blur-md shadow-lg border border-indigo-100/50 flex flex-col",
                        selected ? "ring-2 ring-indigo-500 ring-offset-2" : "",
                        isHovered ? "shadow-xl" : "shadow-md"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div
                        contentEditable={false}
                        className={cn(
                            "absolute top-1 right-1 z-50 flex items-center gap-1 p-1 rounded-md shadow-sm border border-gray-200 transition-all bg-white/90 backdrop-blur-sm",
                            (isHovered || selected) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                        )}
                    >
                        <div className="drag-handle cursor-move p-1 hover:bg-gray-100 rounded text-gray-400">
                            <GripVertical size={14} />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); updateAttributes({ displayMode: displayMode === 'chip' ? 'chart' : 'chip' }); }}
                            className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-gray-500 transition-colors"
                            title={displayMode === 'chip' ? "عرض المخطط البياني" : "عرض البطاقة"}
                        >
                            {displayMode === 'chip' ? <BarChart3 size={14} /> : <Layout size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                            className="p-1 hover:bg-red-100 hover:text-red-500 rounded-md text-gray-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <ResizableBox
                        width={width}
                        // For trackers, we usually just want to resize width. We'll set height to 'auto' or a fixed size in CSS
                        height={100} // This prop is required by ResizableBox but we override it in child CSS 
                        axis="x"
                        onResizeStop={handleResize}
                        minConstraints={[200, 100]}
                        maxConstraints={[800, 400]}
                        resizeHandles={['e', 'w']}
                        handle={(handleAxis, ref) => {
                            if (!isHovered && !selected) return <div ref={ref} className="hidden" />;
                            let classes = "absolute bg-white border border-gray-300 shadow-sm z-[60] flex items-center justify-center transition-colors ";
                            // We only support E/W for now for trackers
                            if (handleAxis === 'w') classes += "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-8 cursor-w-resize hover:border-indigo-500 hover:bg-indigo-50 rounded-full";
                            if (handleAxis === 'e') classes += "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-8 cursor-e-resize hover:border-indigo-500 hover:bg-indigo-50 rounded-full";

                            return (
                                <div ref={ref} className={classes} onMouseDown={(e) => { e.stopPropagation(); }}>
                                    <div className="h-3 border-l border-r border-gray-400 w-[3px] opacity-70" />
                                </div>
                            );
                        }}
                    >
                        <div className="flex flex-col gap-3 p-3 h-auto" style={{ width: `${width}px` }} dir="rtl">
                            {trackers.map((tracker, index) => (
                                <TrackerChip key={tracker.id + index} tracker={tracker} displayMode={displayMode} />
                            ))}
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
            displayMode: { default: 'chip' }
        };
    },

    // ... we also need to change TrackerNodeView

    parseHTML() { return [{ tag: 'tracker-embed' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['tracker-embed', mergeAttributes(HTMLAttributes, {
            'trackers': JSON.stringify(HTMLAttributes.trackers)
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TrackerNodeView);
    },
});
