import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { Palette, ChevronUp, ChevronDown, Trash2, Settings2, Sparkles, Cpu, Activity } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';

const BG_COLORS = [
    'transparent', '#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fefce8', '#fef2f2', '#faf5ff', '#fff7ed'
];
const BORDER_COLORS = [
    'transparent', '#e5e7eb', '#9ca3af', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
];

const SmartTemplateNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const [isHovered, setIsHovered] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Attributes
    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const width = node.attrs.width || 300;
    const height = node.attrs.height || 200;
    const backgroundColor = node.attrs.backgroundColor || 'transparent';
    const borderColor = node.attrs.borderColor || 'transparent';
    const borderWidth = node.attrs.borderWidth || 0;
    const opacity = node.attrs.opacity ?? 1;
    const zIndex = node.attrs.zIndex || 50;
    const templateName = node.attrs.templateName || 'قالب ذكي';

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
        let newWidth = Math.max(150, newSize.width);
        let newHeight = Math.max(100, newSize.height);
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
                        minConstraints={[150, 100]}
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
                            className="w-full h-full rounded-xl overflow-hidden pointer-events-auto flex flex-col"
                            style={{
                                backgroundColor: backgroundColor === 'transparent' ? 'white' : backgroundColor,
                                borderColor: borderColor === 'transparent' ? '#E5E7EB' : borderColor,
                                borderWidth: `${borderWidth || 1}px`,
                                borderStyle: 'solid',
                                opacity: opacity,
                            }}
                            dir="rtl"
                        >
                            <div className="bg-indigo-50/50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <Sparkles size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{templateName}</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-200" />
                                    <div className="w-2 h-2 rounded-full bg-indigo-100" />
                                </div>
                            </div>

                            <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                                    <Cpu size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-800">جاري معالجة البيانات...</h3>
                                    <p className="text-[10px] text-gray-500 leading-relaxed max-w-[180px]">
                                        سيقوم الذكاء الاصطناعي بتوليد المحتوى بناءً على سياق الصفحة الحالية
                                    </p>
                                </div>
                                <button className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                                    توليد الآن
                                </button>
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
                                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Cpu size={13} />
                                </div>
                                <div className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: backgroundColor || '#fff' }} />
                            </div>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <button
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <Settings2 size={16} />
                            </button>

                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                                        <Palette size={16} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-xl" align="center" dir="rtl" sideOffset={12}>
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">إعدادات القالب</div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400">لون الخلفية</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {BG_COLORS.map(c => (
                                                    <button key={c} onClick={() => updateAttributes({ backgroundColor: c })}
                                                        className={cn("w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110", backgroundColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
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
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};

export const SmartTemplateNode = Node.create({
    name: 'smartTemplate',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            templateId: { default: null },
            templateName: { default: 'قالب ذكي' },
            x: { default: 100 },
            y: { default: 100 },
            width: { default: 300 },
            height: { default: 200 },
            backgroundColor: { default: 'transparent' },
            borderColor: { default: 'transparent' },
            borderWidth: { default: 0 },
            opacity: { default: 1 },
            zIndex: { default: 50 },
            content: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="smart-template"]',
                getAttrs: (element: HTMLElement | string) => {
                    if (typeof element === 'string') return {};
                    return {
                        templateId: element.getAttribute('data-id'),
                        templateName: element.getAttribute('data-name'),
                        x: parseInt(element.getAttribute('data-x') || '100', 10),
                        y: parseInt(element.getAttribute('data-y') || '100', 10),
                        width: parseInt(element.getAttribute('data-width') || '300', 10),
                        height: parseInt(element.getAttribute('data-height') || '200', 10),
                        backgroundColor: element.getAttribute('data-bg-color'),
                        borderColor: element.getAttribute('data-border-color'),
                        borderWidth: parseInt(element.getAttribute('data-border-width') || '0', 10),
                        opacity: parseFloat(element.getAttribute('data-opacity') || '1'),
                        zIndex: parseInt(element.getAttribute('data-z-index') || '50', 10),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'smart-template',
            'data-id': HTMLAttributes.templateId,
            'data-name': HTMLAttributes.templateName,
            'data-x': HTMLAttributes.x,
            'data-y': HTMLAttributes.y,
            'data-width': HTMLAttributes.width,
            'data-height': HTMLAttributes.height,
            'data-bg-color': HTMLAttributes.backgroundColor,
            'data-border-color': HTMLAttributes.borderColor,
            'data-border-width': HTMLAttributes.borderWidth,
            'data-opacity': HTMLAttributes.opacity,
            'data-z-index': HTMLAttributes.zIndex,
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SmartTemplateNodeView);
    },
});
