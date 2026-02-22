import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { cn } from '@/lib/utils';
import { RotateCcw, Trash2 } from 'lucide-react';
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

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleStop = (_e: any, data: any) => {
        setIsDragging(false);
        updateAttributes({ x: data.x, y: data.y });
    };

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: size.width, height: size.height });
    };

    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
                    className="absolute group transition-transform"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        willChange: isDragging ? 'transform' : 'auto',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <ResizableBox
                        width={currentWidth}
                        height={currentHeight}
                        onResizeStop={handleResize}
                        minConstraints={[40, 40]}
                        maxConstraints={[1200, 1200]}
                        resizeHandles={['se', 's', 'e']}
                        className={cn(
                            "relative drag-handle cursor-move",
                            (isHovered || selected || isDragging) ? "ring-2 ring-emerald-500/50 rounded-lg outline outline-1 outline-dashed outline-emerald-300" : ""
                        )}
                        handle={(handleAxis, ref) => {
                            if (!isHovered && !selected) return <div ref={ref} className="hidden" />;

                            if (handleAxis === 'se') {
                                return (
                                    <div ref={ref} className="absolute bottom-0 right-0 w-3 h-3 translate-x-1/2 translate-y-1/2 cursor-se-resize z-[60]">
                                        <div className="w-full h-full bg-emerald-500 rounded-full shadow-sm" />
                                    </div>
                                );
                            }
                            if (handleAxis === 's') {
                                return <div ref={ref} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-2 cursor-s-resize z-[60] rounded-full bg-white border border-gray-300 shadow-sm hover:border-emerald-400" />;
                            }
                            if (handleAxis === 'e') {
                                return <div ref={ref} className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-6 cursor-e-resize z-[60] rounded-full bg-white border border-gray-300 shadow-sm hover:border-emerald-400" />;
                            }
                            return <div ref={ref} className="hidden" />;
                        }}
                    >
                        <img
                            src={src}
                            alt="Sticker"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            draggable={false}
                            style={{ opacity: currentOpacity, transition: 'opacity 0.2s' }}
                        />

                        {/* Controls on Hover */}
                        <div
                            className={cn(
                                "absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-xl p-1 rounded-xl z-[100] transition-opacity cursor-default",
                                (isHovered && !isDragging) || selected ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => updateAttributes({ rotation: (rotation + 45) % 360 })}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                title="تدوير"
                            >
                                <RotateCcw size={14} />
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-0.5" />
                            <button
                                onClick={() => updateAttributes({ opacity: Math.max(0.1, currentOpacity - 0.2) })}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors text-xs font-bold"
                                title="شفافية أقل"
                            >
                                -
                            </button>
                            <span className="text-[10px] text-gray-500 font-mono w-6 text-center">{Math.round(currentOpacity * 100)}%</span>
                            <button
                                onClick={() => updateAttributes({ opacity: Math.min(1, currentOpacity + 0.2) })}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors text-xs font-bold"
                                title="شفافية أكثر"
                            >
                                +
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-0.5" />
                            <button
                                onClick={() => deleteNode()}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};
