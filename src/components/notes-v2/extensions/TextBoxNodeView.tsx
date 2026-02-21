import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { GripVertical, X, Palette, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import 'react-resizable/css/styles.css';

const BG_COLORS = [
    '#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fefce8', '#fef2f2', '#faf5ff',
    '#fff7ed', '#ecfdf5', '#eff6ff', '#fdf2f8', 'transparent'
];
const BORDER_COLORS = [
    'transparent', '#d1d5db', '#9ca3af', '#6b7280', '#000000',
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
];

export const TextBoxNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const [isHovered, setIsHovered] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Attributes
    const x = node.attrs.x || 0;
    const y = node.attrs.y || 0;
    const width = node.attrs.width || 200;
    const height = node.attrs.height || 100;
    const backgroundColor = node.attrs.backgroundColor || 'transparent';
    const borderColor = node.attrs.borderColor || '#d1d5db';
    const borderWidth = node.attrs.borderWidth || 1;
    const borderStyle = node.attrs.borderStyle || 'solid';
    const baseWidth = node.attrs.baseWidth || 200;
    const zIndex = node.attrs.zIndex || 10;
    const scale = width / baseWidth;
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

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: size.width, height: size.height });
    };

    const showControls = isHovered || selected;

    return (
        <NodeViewWrapper
            className="absolute z-10"
            style={{
                left: 0,
                top: 0,
                width: width,
                height: 0,
                zIndex: zIndex,
                direction: 'ltr',
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
                    className="absolute group overflow-visible"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Floating mini-toolbar — Word style */}
                    <div
                        contentEditable={false}
                        className={cn(
                            "absolute -top-9 right-0 z-50 flex items-center gap-0.5 px-1 py-0.5 rounded-md border border-gray-200 bg-white shadow-md transition-all",
                            showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                        )}
                    >
                        <div className="drag-handle cursor-move p-1 hover:bg-gray-100 rounded text-gray-400">
                            <GripVertical size={14} />
                        </div>

                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5">
                            {/* Style popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                        <Palette size={13} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3" align="end" dir="rtl" sideOffset={8}>
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-xs text-gray-600">تخصيص مربع النص</h4>

                                        {/* Background Color */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-400">لون الخلفية</label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {BG_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateAttributes({ backgroundColor: c })}
                                                        className={cn(
                                                            "w-5 h-5 rounded-full border border-gray-200 transition-transform hover:scale-110",
                                                            backgroundColor === c && "ring-2 ring-indigo-500 ring-offset-1"
                                                        )}
                                                        style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                                    >
                                                        {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Border Color */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-400">لون الإطار</label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {BORDER_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateAttributes({ borderColor: c })}
                                                        className={cn(
                                                            "w-5 h-5 rounded-full border border-gray-200 transition-transform hover:scale-110",
                                                            borderColor === c && "ring-2 ring-indigo-500 ring-offset-1"
                                                        )}
                                                        style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                                    >
                                                        {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Border Style */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-400">نمط الإطار</label>
                                            <div className="flex gap-1 bg-gray-50 p-1 rounded-md">
                                                {[
                                                    { id: 'solid', label: '─' },
                                                    { id: 'dashed', label: '╌' },
                                                    { id: 'dotted', label: '┈' },
                                                    { id: 'none', label: '✕' }
                                                ].map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => updateAttributes({ borderStyle: s.id })}
                                                        className={cn(
                                                            "flex-1 h-7 rounded text-xs font-mono",
                                                            borderStyle === s.id ? "bg-white shadow-sm text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-100"
                                                        )}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Border Width */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-400">سماكة الإطار ({borderWidth}px)</label>
                                            <Slider
                                                value={[borderWidth]}
                                                min={0}
                                                max={6}
                                                step={0.5}
                                                onValueChange={([val]) => updateAttributes({ borderWidth: val })}
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <button
                                onClick={() => updateAttributes({ zIndex: zIndex + 1 })}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                title="رفع الترتيب"
                            >
                                <ChevronUp size={13} />
                            </button>
                            <button
                                onClick={() => updateAttributes({ zIndex: Math.max(1, zIndex - 1) })}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                title="خفض الترتيب"
                            >
                                <ChevronDown size={13} />
                            </button>

                            <div className="w-px h-4 bg-gray-200 mx-0.5" />

                            <button
                                onClick={() => deleteNode()}
                                className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-400"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* The text box itself — Word-style clean frame */}
                    <ResizableBox
                        width={width}
                        height={height}
                        onResizeStop={handleResize}
                        minConstraints={[80, 30]}
                        maxConstraints={[1200, 2000]}
                        resizeHandles={['s', 'e', 'se']}
                        handle={(handleAxis, ref) => {
                            if (!showControls) return <div ref={ref} className="hidden" />;

                            if (handleAxis === 'se') {
                                return (
                                    <div
                                        ref={ref}
                                        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-[60]"
                                        style={{ transform: 'translate(50%, 50%)' }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="w-full h-full bg-indigo-500 rounded-full shadow-sm" />
                                    </div>
                                );
                            }
                            if (handleAxis === 's') {
                                return (
                                    <div
                                        ref={ref}
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-2 cursor-s-resize z-[60] rounded-full bg-white border border-gray-300 shadow-sm hover:border-indigo-400 transition-colors"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                );
                            }
                            if (handleAxis === 'e') {
                                return (
                                    <div
                                        ref={ref}
                                        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-6 cursor-e-resize z-[60] rounded-full bg-white border border-gray-300 shadow-sm hover:border-indigo-400 transition-colors"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                );
                            }
                            return <div ref={ref} className="hidden" />;
                        }}
                    >
                        <div
                            className={cn(
                                "w-full h-full relative transition-all",
                                showControls && borderColor === 'transparent' && borderStyle !== 'none'
                                    ? "outline outline-1 outline-dashed outline-blue-300"
                                    : ""
                            )}
                            style={{
                                backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
                                borderColor: borderColor === 'transparent' ? 'transparent' : borderColor,
                                borderWidth: borderStyle === 'none' ? 0 : `${borderWidth}px`,
                                borderStyle: borderStyle === 'none' ? 'none' : borderStyle,
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
                    </ResizableBox>
                </div>
            </Draggable>
        </NodeViewWrapper>
    );
};
