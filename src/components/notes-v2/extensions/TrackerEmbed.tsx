import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { Activity, GripHorizontal, Check, Plus, Minus, X, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';
import { toast } from 'sonner';
import Draggable from 'react-draggable';
import { cn } from '@/lib/utils';
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


const TrackerChip = ({ tracker }: { tracker: TrackerItem }) => {
    const queryClient = useQueryClient();

    // 1. Fetch latest entry to show current status
    const { data: latestEntry } = useQuery({
        queryKey: ['tracker-latest', tracker.id],
        queryFn: async () => {
            const history = await trackingService.getHistory(tracker.id, 1);
            return history && history.length > 0 ? history[0] : null;
        },
    });

    // 2. Mutation to add new entry
    const addEntryMutation = useMutation({
        mutationFn: trackingService.addEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tracker-latest', tracker.id] });
            queryClient.invalidateQueries({ queryKey: ['tracker-entries'] });
            queryClient.invalidateQueries({ queryKey: ['trackers'] });
            toast.success("تم تحديث المتتبع");
        },
        onError: () => {
            toast.error("فشل التحديث");
        }
    });

    const handleQuickAdd = () => {
        // Simple increment logic or default value based on type
        // For now, we assume numeric increment or toggle for checklist
        // You might want to expand this logic based on tracker.type

        let value = 1;
        if (tracker.type === 'numeric' || tracker.type === 'scale') {
            // If we have a previous entry today, maybe we want to increment that? 
            // But existing logic in AddEntryDialog adds NEW entry.
            // To keep it simple and consistent with "History", we add a new entry.
            // OR: we could look at latestEntry. If it's today, update it?
            // For "Counter" behavior, users usually expect +1 to the *total*.
            // The dashboard shows *sum* or *avg* depending on implementation.
            // Let's stick to "Add +1 Entry" for now.
            value = 1;
        }

        addEntryMutation.mutate({
            tracker_id: tracker.id,
            value: value,
            date: new Date(),
        });
    };

    // Calculate display value (mock logic or real logic depending on how you interpret "current state")
    // If it's a "Daily Goal", maybe we want to show SUM of today's entries?
    // trackingService.getLatestEntry only gives the *last* log.
    // For a progress bar, we might need "Today's Total". 
    // Let's assume for now we just show the LATEST value for things like Mood/Weight, 
    // but for "Water" (numeric), we might want the sum. 
    // FIXME: To support "Daily Progress", we need a "getTodayTotal" method. 
    // allowing "getLatestEntry" to be the heuristic for now.

    const val = latestEntry?.value || 0;
    const goal = tracker.goal || 10;

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all min-w-[180px] max-w-[250px] flex-1">
            {/* Icon */}
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${tracker.color}15`, color: tracker.color || '#4F46E5' }}
            >
                {tracker.icon || <Activity size={18} />}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span className="text-sm font-bold text-gray-800 truncate mb-1" title={tracker.label}>{tracker.label}</span>
                <div className="flex items-center justify-between gap-2">
                    {/* Mini Progress - Visualizing the LATEST entry's value relative to goal */}
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

            {/* Simple Quick Action (e.g. +) */}
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
    const rawTrackers = node.attrs.trackers;
    const trackers: TrackerItem[] = Array.isArray(rawTrackers) ? rawTrackers : [];

    const [isHovered, setIsHovered] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Attributes for dragging
    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const editorZoom = (editor.storage as any).textBox?.zoom || 100;
    const dragScale = editorZoom / 100;

    const [dragPos, setDragPos] = useState({ x, y });

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleDrag = (_e: any, data: any) => {
        setDragPos({ x: data.x, y: data.y });
    };

    const handleStop = (_e: any, data: any) => {
        setDragPos({ x: data.x, y: data.y });
        updateAttributes({ x: data.x, y: data.y });
    };

    if (!trackers || trackers.length === 0) return null;

    return (
        <NodeViewWrapper
            className="absolute z-10"
            style={{ left: 0, top: 0, direction: 'ltr' }}
        >
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                position={dragPos}
                onStop={handleStop}
                onDrag={handleDrag}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn(
                        "group relative transition-shadow rounded-2xl overflow-visible bg-white/50 backdrop-blur-md shadow-lg border border-indigo-100/50 flex flex-col min-w-[200px]",
                        selected ? "ring-2 ring-indigo-500 ring-offset-2" : "",
                        isHovered ? "shadow-xl" : "shadow-md"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Drag Handle & Toolbar */}
                    <div
                        contentEditable={false}
                        className={cn(
                            "absolute top-1 right-1 z-50 flex items-center gap-1 p-1 rounded-md shadow-sm border border-gray-200 transition-all bg-white/90 backdrop-blur-sm",
                            (isHovered || selected) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                        )}
                    >
                        <div className="drag-handle cursor-move p-0.5 hover:bg-gray-100 rounded text-gray-400">
                            <GripVertical size={14} />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                            className="p-1 hover:bg-red-100 hover:text-red-500 rounded-md text-gray-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col gap-3 p-3 max-w-[300px] sm:max-w-md w-full mx-auto" dir="rtl">
                        {trackers.map((tracker, index) => (
                            <TrackerChip key={tracker.id + index} tracker={tracker} />
                        ))}
                    </div>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};

export const TrackerEmbed = Node.create({
    name: 'trackerEmbed',
    group: 'block',
    atom: false, // Must be false to support absolute positioning nodes better in Tiptap, or true if we want it isolated. True works better for Draggable sometimes, but since TextBox is atom:false, let's keep consistent if needed. Actually it was true before, keep it true.

    addAttributes() {
        return {
            trackers: {
                default: [],
                parseHTML: element => {
                    const trackers = element.getAttribute('trackers');
                    try {
                        return trackers ? JSON.parse(trackers) : [];
                    } catch (e) {
                        return [];
                    }
                },
            },
            x: {
                default: window.innerWidth > 768 ? 50 : 20, // Initial default offset
            },
            y: {
                default: 50,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'tracker-embed',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['tracker-embed', mergeAttributes(HTMLAttributes, {
            'trackers': JSON.stringify(HTMLAttributes.trackers)
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TrackerNodeView);
    },
});
