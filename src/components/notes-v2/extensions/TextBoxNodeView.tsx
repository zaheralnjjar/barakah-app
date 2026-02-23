import { NodeViewContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import { Palette, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
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

const BORDER_STYLES = [
    { id: 'none', label: 'بدون', style: 'none', width: 0 },
    { id: 'simple', label: 'بسيط', style: 'solid', width: 1 },
    { id: 'double', label: 'مزدوج', style: 'double', width: 3 },
    { id: 'thick', label: 'سميك', style: 'solid', width: 4 },
    { id: 'dashed', label: 'متقطع', style: 'dashed', width: 2 },
    { id: 'dotted', label: 'منقط', style: 'dotted', width: 2 },
    { id: 'double-thick', label: 'مزدوج سميك', style: 'double', width: 6 },
    { id: 'groove', label: 'محفور', style: 'groove', width: 3 },
    { id: 'ridge', label: 'بارز', style: 'ridge', width: 3 },
    { id: 'outline', label: 'محدد', style: 'solid', width: 2 },
];

export const TextBoxNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const [isHovered, setIsHovered] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

    // Attributes
    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const width = node.attrs.width || 200;
    const height = node.attrs.height || 100;
    const backgroundColor = node.attrs.backgroundColor || 'transparent';
    const borderColor = node.attrs.borderColor || '#d1d5db';
    const borderWidth = node.attrs.borderWidth || 1;
    const borderStyle = node.attrs.borderStyle || 'solid';
    const opacity = node.attrs.opacity ?? 1;
    const baseWidth = node.attrs.baseWidth || 200;
    const zIndex = node.attrs.zIndex || 10;
    const scale = width / baseWidth;
    const editorZoom = (editor.storage as any).textBox?.zoom || 100;
    const dragScale = editorZoom / 100;

    const [dragPos, setDragPos] = useState({ x, y });

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    useEffect(() => {
        return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
    }, []);

    const handleMouseEnter = () => {
        if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (popoverOpen) return;
        hoverTimeout.current = setTimeout(() => setIsHovered(false), 300);
    };

    const handleDrag = (_e: any, data: any) => {
        setDragPos({ x: data.x, y: data.y });
    };

    const handleStop = (_e: any, data: any) => {
        setDragPos({ x: data.x, y: data.y });
        updateAttributes({ x: data.x, y: data.y });
    };

    const handleResize = (e: any, { handle, size }: any) => {
        e.stopPropagation();

        let newWidth = Math.max(80, size.width);
        let newHeight = Math.max(30, size.height);
        let newX = x;
        let newY = y;

        if (e.shiftKey) {
            const ratio = width / height;
            if (handle === 'e' || handle === 'w' || (Math.abs(newWidth - width) > Math.abs(newHeight - height))) {
                newHeight = newWidth / ratio;
            } else {
                newWidth = newHeight * ratio;
            }
        }

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

    const showControls = isHovered || selected || popoverOpen;
    const [isDragging, setIsDragging] = useState(false);

    // Pixel to MM calculation (assuming 96 DPI: 1px ≈ 0.264583mm)
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
                direction: 'ltr',
            }}
        >
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-zone"
                position={dragPos}
                onStart={() => setIsDragging(true)}
                onStop={(e, data) => { setIsDragging(false); handleStop(e, data); }}
                onDrag={handleDrag}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn("absolute group overflow-visible", isDragging && "ring-2 ring-indigo-400/50 rounded-lg")}
                    style={{
                        paddingBottom: '60px',
                        marginBottom: '-60px',
                        willChange: isDragging ? 'transform' : 'auto',
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <ResizableBox
                        width={width}
                        height={height}
                        onResizeStart={() => setIsResizing(true)}
                        onResizeStop={(e, data) => { setIsResizing(false); handleResize(e, data); }}
                        onResize={(e, data) => handleResize(e, data)}
                        minConstraints={[80, 30]}
                        maxConstraints={[1200, 2000]}
                        resizeHandles={['s', 'e', 'w', 'n', 'sw', 'nw', 'se', 'ne']}
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
                            if (!cls) return <div ref={ref} className="hidden" />;

                            return (
                                <div
                                    ref={ref}
                                    className={cn("absolute w-3.5 h-3.5 z-[60] group/handle flex items-center justify-center", cls)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="w-2.5 h-2.5 bg-[#4B96FF] border-2 border-white rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                                </div>
                            );
                        }}
                    >
                        <div
                            className={cn(
                                "w-full h-full relative transition-all drag-zone rounded-sm",
                                showControls && borderColor === 'transparent' && borderStyle !== 'none'
                                    ? "outline outline-1 outline-dashed outline-blue-300"
                                    : ""
                            )}
                            style={{
                                backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
                                borderColor: borderColor === 'transparent' ? 'transparent' : borderColor,
                                borderWidth: borderStyle === 'none' ? 0 : `${borderWidth}px`,
                                borderStyle: borderStyle === 'none' ? 'none' : borderStyle,
                                opacity,
                                direction: 'rtl',
                            }}
                        >
                            <div
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top right',
                                    width: `${baseWidth}px`,
                                    height: 'auto',
                                    minHeight: `${height / scale}px`,
                                }}
                                className="p-2 outline-none overflow-y-auto"
                            >
                                <NodeViewContent className="min-h-full" />
                            </div>
                        </div>

                        {isResizing && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded-full border border-white/20 backdrop-blur-md z-[110] font-mono whitespace-nowrap shadow-2xl animate-in fade-in zoom-in duration-200">
                                {toMM(width)}mm × {toMM(height)}mm
                            </div>
                        )}

                        {/* Floating Pill Toolbar — Bottom Center */}
                        <div
                            contentEditable={false}
                            className={cn(
                                "absolute -bottom-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-gray-100 bg-white/95 backdrop-blur-md shadow-xl transition-all dir-rtl",
                                showControls && !isResizing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                            )}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-bold text-gray-700 px-1 border-e border-gray-100">أ</span>
                                <div className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: backgroundColor || '#fff' }} />
                            </div>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5">
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                            <Palette size={15} />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto" align="center" dir="rtl" sideOffset={12}>
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">إعدادات صندوق النص</div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400">نمط الإطار</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {BORDER_STYLES.map(bs => (
                                                        <button
                                                            key={bs.id}
                                                            onClick={() => updateAttributes({ borderStyle: bs.style, borderWidth: bs.width })}
                                                            className={cn(
                                                                "flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group/style",
                                                                borderStyle === bs.style && borderWidth === bs.width && "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
                                                            )}
                                                        >
                                                            <div
                                                                className="w-10 h-7 rounded border-gray-400 bg-white/50"
                                                                style={{
                                                                    borderStyle: bs.style,
                                                                    borderWidth: bs.id === 'none' ? 0 : Math.max(1, bs.width / 2)
                                                                }}
                                                            >
                                                                {bs.id === 'none' && <div className="w-full h-full flex items-center justify-center opacity-20"><X size={10} /></div>}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-500 group-hover/style:text-indigo-600">{bs.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400">لون المربع</label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {BG_COLORS.map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateAttributes({ backgroundColor: c })}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110",
                                                                backgroundColor === c && "ring-2 ring-indigo-500 ring-offset-1"
                                                            )}
                                                            style={{ backgroundColor: c === 'transparent' ? '#eee' : c }}
                                                        >
                                                            {c === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400">لون الحدود</label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {BORDER_COLORS.map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateAttributes({ borderColor: c, borderStyle: (c === 'transparent' && borderStyle === 'solid') ? 'none' : borderStyle })}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110",
                                                                borderColor === c && "ring-2 ring-indigo-500 ring-offset-1"
                                                            )}
                                                            style={{ backgroundColor: c === 'transparent' ? '#eee' : c }}
                                                        >
                                                            {c === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400">الشفافية ({Math.round(opacity * 100)}%)</label>
                                                <Slider
                                                    value={[opacity * 100]}
                                                    min={10}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={([val]) => updateAttributes({ opacity: val / 100 })}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                                                <div className="text-[10px] font-bold text-gray-400">الترتيب</div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => updateAttributes({ zIndex: zIndex + 1 })}
                                                        className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateAttributes({ zIndex: Math.max(1, zIndex - 1) })}
                                                        className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <button
                                onClick={() => deleteNode()}
                                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};
