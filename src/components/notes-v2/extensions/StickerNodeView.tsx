import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { cn } from '@/lib/utils';
import { RotateCcw, Trash2, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import 'react-resizable/css/styles.css';

export const StickerNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const { src, x, y, size, width, height, rotation, zIndex, opacity } = node.attrs;

    const currentWidth = width || size || 120;
    const currentHeight = height || size || 120;
    const currentOpacity = opacity ?? 1;

    const [dragPos, setDragPos] = useState({ x, y });
    const nodeRef = useRef<HTMLDivElement>(null);
    const editorZoom = (editor.storage as any).page?.zoom || 100;
    const dragScale = editorZoom / 100;

    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleStop = (_e: any, data: any) => {
        setIsDragging(false);
        updateAttributes({ x: data.x, y: data.y });
    };

    const handleResize = (e: any, { handle, size: newSize }: any) => {
        e.stopPropagation();

        let newWidth = Math.max(40, newSize.width);
        let newHeight = Math.max(40, newSize.height);
        let newX = x;
        let newY = y;

        if (e.shiftKey) {
            const ratio = (width || size || 120) / (height || size || 120);
            if (handle === 'e' || handle === 'w' || (Math.abs(newWidth - currentWidth) > Math.abs(newHeight - currentHeight))) {
                newHeight = newWidth / ratio;
            } else {
                newWidth = newHeight * ratio;
            }
        }

        if (handle.includes('w')) {
            newX = x - (newWidth - currentWidth);
        }
        if (handle.includes('n')) {
            newY = y - (newHeight - currentHeight);
        }

        setDragPos({ x: newX, y: newY });
        updateAttributes({
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY
        });
    };

    const showControls = isHovered || selected || isDragging;
    const toMM = (px: number) => Math.round(px * 0.264583);

    return (
        <NodeViewWrapper
            className="absolute"
            style={{
                left: 0,
                top: 0,
                zIndex: isDragging ? 9999 : (zIndex || 50),
                width: currentWidth,
                height: 0,
            }}
        >
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                position={dragPos}
                onStart={() => setIsDragging(true)}
                onStop={handleStop}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn(
                        "absolute group",
                        !isDragging && !isResizing && "transition-transform"
                    )}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        willChange: (isDragging || isResizing) ? 'transform' : 'auto',
                        paddingBottom: '60px',
                        marginBottom: '-60px',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <ResizableBox
                        width={currentWidth}
                        height={currentHeight}
                        onResizeStart={() => setIsResizing(true)}
                        onResizeStop={(e, data) => {
                            setIsResizing(false);
                            handleResize(e, data);
                        }}
                        onResize={handleResize}
                        minConstraints={[40, 40]}
                        maxConstraints={[1200, 1200]}
                        resizeHandles={['s', 'e', 'w', 'n', 'sw', 'nw', 'se', 'ne']}
                        className={cn(
                            "relative drag-handle cursor-move",
                            (showControls) ? "ring-2 ring-emerald-500/50 rounded-lg outline outline-1 outline-dashed outline-emerald-300 shadow-xl" : ""
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
                            if (!cls) return <div ref={ref} className="hidden" />;

                            return (
                                <div ref={ref} className={cn("absolute w-3.5 h-3.5 z-[60] group/handle flex items-center justify-center", cls)}>
                                    <div className="w-2.5 h-2.5 bg-[#4B96FF] border-2 border-white rounded-full shadow-md group-hover/handle:scale-125 transition-transform" />
                                </div>
                            );
                        }}
                    >
                        <img
                            src={src}
                            alt="Sticker"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            draggable={false}
                            style={{ opacity: currentOpacity, transition: 'opacity 0.2s' }}
                        />

                        {isResizing && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded-full border border-white/20 backdrop-blur-md z-[110] font-mono whitespace-nowrap shadow-2xl animate-in fade-in zoom-in duration-200">
                                {toMM(currentWidth)}mm × {toMM(currentHeight)}mm
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
                            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-emerald-600">S</span>
                            </div>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600" title="إعدادات الملصق">
                                        <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center text-[8px] font-bold">{Math.round(currentOpacity * 100)}%</div>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-3 shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-xl">
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">إعدادات الملصق</div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الشفافية ({Math.round(currentOpacity * 100)}%)</div>
                                            <Slider
                                                value={[currentOpacity * 100]}
                                                min={10}
                                                max={100}
                                                step={1}
                                                onValueChange={([val]) => updateAttributes({ opacity: val / 100 })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <div className="text-[10px] font-bold text-gray-400">الترتيب</div>
                                            <div className="flex gap-1">
                                                <button onClick={() => updateAttributes({ zIndex: (zIndex || 50) + 1 })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronUp size={14} /></button>
                                                <button onClick={() => updateAttributes({ zIndex: Math.max(1, (zIndex || 50) - 1) })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronDown size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <button
                                onClick={() => updateAttributes({ rotation: (rotation + 45) % 360 })}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-full transition-colors"
                                title="تدوير"
                            >
                                <RotateCcw size={15} />
                            </button>

                            <button
                                onClick={() => deleteNode()}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                                title="حذف"
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
