import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { cn } from '@/lib/utils';
import { RotateCcw, Trash2, Maximize } from 'lucide-react';

export const StickerNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const { src, x, y, size, rotation, zIndex } = node.attrs;

    const [dragPos, setDragPos] = useState({ x, y });
    const nodeRef = useRef<HTMLDivElement>(null);
    const editorZoom = (editor.storage as any).page?.zoom || 100;
    const dragScale = editorZoom / 100;

    useEffect(() => {
        setDragPos({ x, y });
    }, [x, y]);

    const handleStop = (_e: any, data: any) => {
        updateAttributes({ x: data.x, y: data.y });
    };

    return (
        <NodeViewWrapper
            className="absolute"
            style={{
                left: 0,
                top: 0,
                zIndex: zIndex || 50,
                width: size,
                height: 0,
            }}
        >
            <Draggable
                nodeRef={nodeRef}
                position={dragPos}
                onStop={handleStop}
                scale={dragScale}
            >
                <div
                    ref={nodeRef}
                    className={cn(
                        "relative group cursor-move transition-transform",
                        selected ? "ring-2 ring-emerald-500 rounded-lg" : ""
                    )}
                    style={{
                        width: size,
                        height: size,
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    <img
                        src={src}
                        alt="Sticker"
                        className="w-full h-full object-contain pointer-events-none select-none"
                    />

                    {/* Controls on Hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-xl p-1 rounded-xl z-[100]">
                        <button
                            onClick={() => updateAttributes({ rotation: (rotation + 45) % 360 })}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={() => updateAttributes({ size: size + 20 })}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                        >
                            <Maximize size={14} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-0.5" />
                        <button
                            onClick={() => deleteNode()}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};
