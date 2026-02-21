import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { GripVertical, X, Palette, Maximize2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import 'react-resizable/css/styles.css';

export const TextBoxNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const [isHovered, setIsHovered] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Attributes
    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const width = node.attrs.width || 300;
    const height = node.attrs.height || 200;
    const backgroundColor = node.attrs.backgroundColor || '#ffffff';
    const borderColor = node.attrs.borderColor || '#e2e8f0';
    const borderWidth = node.attrs.borderWidth || 1;
    const borderStyle = node.attrs.borderStyle || 'solid';
    const baseWidth = node.attrs.baseWidth || 400;
    const scale = width / baseWidth;
    const editorZoom = (editor.storage as any).textBox?.zoom || 100;
    const dragScale = editorZoom / 100;

    // Local state for smooth dragging
    const [dragPos, setDragPos] = useState({ x, y });

    // Sync if Tiptap state changes externally
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

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: size.width, height: size.height });
    };

    return (
        <NodeViewWrapper
            className="absolute z-10"
            style={{
                left: 0,
                top: 0,
                width: width,
                height: 0,
                direction: 'ltr', // Force LTR for coordinate consistency
            }}
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
                        "absolute group transition-shadow rounded-lg overflow-visible",
                        selected ? "ring-2 ring-indigo-500 ring-offset-2" : "",
                        isHovered ? "shadow-lg" : "shadow-sm"
                    )}
                    style={{ width, height }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <ResizableBox
                        width={width}
                        height={height}
                        onResizeStop={handleResize}
                        minConstraints={[100, 50]}
                        maxConstraints={[800, 1000]}
                        resizeHandles={['se']}
                        handle={
                            <div
                                className="absolute bottom-0 right-0 p-1 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    // Reset to default A4 or auto-calc based on content
                                    // For now, let's reset to a "standard" size that adapts
                                    updateAttributes({ width: 400, height: 560 });
                                }}
                            >
                                <Maximize2 size={12} className="text-gray-400 rotate-90" />
                            </div>
                        }
                    >
                        <div
                            className="w-full h-full flex flex-col overflow-hidden rounded-lg transition-all"
                            style={{
                                backgroundColor,
                                borderColor,
                                borderWidth: `${borderWidth}px`,
                                borderStyle,
                                direction: 'rtl', // Content remains RTL
                            }}
                        >
                            {/* Toolbar / Drag Handle (Visible on Hover/Select) */}
                            <div
                                contentEditable={false}
                                className={cn(
                                    "drag-handle h-8 min-h-[32px] w-full cursor-move flex items-center justify-between px-2 transition-opacity bg-gray-50 border-b border-gray-100",
                                    (isHovered || selected) ? "opacity-100" : "opacity-30 hover:opacity-100"
                                )}
                            >
                                <GripVertical size={12} className="text-gray-400" />
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {/* Style Settings Popover */}
                                    {/* ... rest of the toolbar content remains same ... */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="p-0.5 hover:bg-gray-200 rounded text-gray-500">
                                                <Palette size={12} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3" align="end" dir="rtl">
                                            <div className="space-y-3">
                                                <h4 className="font-bold text-xs text-gray-500">تخصيص الصندوق</h4>

                                                {/* Background Color */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-400">لون الخلفية</label>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {['#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fefce8', '#fef2f2', '#faf5ff'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => updateAttributes({ backgroundColor: c })}
                                                                className={cn("w-5 h-5 rounded-full border border-gray-200", backgroundColor === c && "ring-2 ring-indigo-500")}
                                                                style={{ backgroundColor: c }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Border Color */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-400">لون الإطار</label>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {['transparent', '#e2e8f0', '#94a3b8', '#64748b', '#000000', '#ef4444', '#3b82f6'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => updateAttributes({ borderColor: c })}
                                                                className={cn("w-5 h-5 rounded-full border border-gray-200", borderColor === c && "ring-2 ring-indigo-500")}
                                                                style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
                                                            >
                                                                {c === 'transparent' && <div className="w-full h-full rotate-45 border-r border-red-500" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Border Style */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-400">نمط الإطار</label>
                                                    <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                                                        {[
                                                            { id: 'solid', label: 'Solid', border: 'solid' },
                                                            { id: 'dashed', label: 'Dashed', border: 'dashed' },
                                                            { id: 'dotted', label: 'Dotted', border: 'dotted' }
                                                        ].map(s => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => updateAttributes({ borderStyle: s.id })}
                                                                className={cn(
                                                                    "flex-1 h-6 rounded text-[10px] border-gray-400",
                                                                    borderStyle === s.id ? "bg-white shadow-sm text-indigo-600" : "text-gray-500"
                                                                )}
                                                                style={{ borderBottomWidth: 2, borderBottomStyle: s.border as any }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Border Width */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-400">سماكة الإطار ({borderWidth}px)</label>
                                                    <Slider
                                                        value={[borderWidth]}
                                                        min={0}
                                                        max={10}
                                                        step={1}
                                                        onValueChange={([val]) => updateAttributes({ borderWidth: val })}
                                                    />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                                        className="p-0.5 hover:bg-red-100 hover:text-red-500 rounded text-gray-500"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Editor Content Area */}
                            <div
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left', // Better scaling anchor
                                    width: `${baseWidth}px`,
                                    height: `${height / scale}px`,
                                }}
                                className="flex-grow p-4 outline-none custom-scrollbar overflow-y-auto"
                            >
                                <NodeViewContent className="min-h-full" />
                            </div>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};
