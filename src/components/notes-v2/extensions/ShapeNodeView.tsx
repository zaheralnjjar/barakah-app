import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { cn } from '@/lib/utils';
import { RotateCcw, Trash2, Palette, Type, AlignLeft, AlignCenter, AlignRight, Type as TypeIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import 'react-resizable/css/styles.css';

const shapes: Record<string, string> = {
    // Basic & Geometry
    rectangle: 'M 0 0 H 100 V 100 H 0 Z',
    rounded_rect: 'M 10 0 H 90 A 10 10 0 0 1 100 10 V 90 A 10 10 0 0 1 90 100 H 10 A 10 10 0 0 1 0 90 V 10 A 10 10 0 0 1 10 0 Z',
    circle: 'M 50, 0 a 50,50 0 1,0 0,100 a 50,50 0 1,0 0,-100',
    triangle: 'M 50 0 L 100 100 L 0 100 Z',
    right_triangle: 'M 0 0 L 0 100 L 100 100 Z',
    pentagon: 'M 50 0 L 100 38 L 81 100 H 19 L 0 38 Z',
    hexagon: 'M 50 0 L 100 25 V 75 L 50 100 L 0 75 V 25 Z',
    octagon: 'M 30 0 H 70 L 100 30 V 70 L 70 100 H 30 L 0 70 V 30 Z',
    diamond: 'M 50 0 L 100 50 L 50 100 L 0 50 Z',
    trapezoid: 'M 20 0 H 80 L 100 100 H 0 Z',
    parallelogram: 'M 25 0 H 100 L 75 100 H 0 Z',
    plus: 'M 33 0 H 67 V 33 H 100 V 67 H 67 V 100 H 33 V 67 H 0 V 33 H 33 Z',
    cross: 'M 37 0 H 63 V 37 H 100 V 63 H 63 V 100 H 37 V 63 H 0 V 37 H 37 Z',
    rhombus: 'M 50 0 L 100 50 L 50 100 L 0 50 Z',
    semicircle: 'M 0 50 A 50 50 0 0 1 100 50 Z',

    // Objects
    home: 'M 0 45 L 50 0 L 100 45 V 100 H 70 V 65 H 30 V 100 H 0 Z',
    gear: 'M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35 M 50 0 L 58 12 L 72 12 L 80 0 L 90 10 L 88 24 L 98 32 L 98 46 L 88 54 L 90 68 L 80 78 L 66 76 L 58 84 L 58 98 L 42 98 L 34 84 L 20 86 L 10 76 L 12 62 L 2 54 L 2 40 L 12 32 L 10 18 L 20 8 L 34 10 L 42 0 Z',
    bell: 'M 50 0 C 30 0 20 15 20 40 V 70 L 0 85 H 100 L 80 70 V 40 C 80 15 70 0 50 0 M 40 85 A 10 10 0 0 0 60 85',
    tag: 'M 0 25 L 25 0 H 100 V 50 L 75 100 L 0 100 Z',
    speech_bubble: 'M 0 0 H 100 V 75 H 60 L 50 100 L 40 75 H 0 Z',
    bookmark: 'M 20 0 H 80 V 100 L 50 80 L 20 100 Z',
    key: 'M 35 30 A 15 15 0 1 0 35 60 A 15 15 0 1 0 35 30 M 50 40 H 100 V 60 H 80 V 75 H 65 V 60 H 50 Z',
    trash: 'M 30 10 V 0 H 70 V 10 H 100 V 25 H 0 V 10 Z M 15 30 H 85 L 75 100 H 25 Z',
    clock: 'M 50 0 A 50 50 0 1 0 50 100 A 50 50 0 1 0 50 0 M 50 50 L 50 15 M 50 50 L 75 50',
    wrench: 'M 85 15 L 70 30 M 15 85 L 35 65 M 35 65 A 15 15 0 1 0 15 45 L 5 55 L 15 85 Z',
    hammer: 'M 0 100 L 50 50 M 40 40 L 100 0 L 100 25 L 40 65 Z',
    lightbulb: 'M 50 0 A 35 35 0 1 0 50 70 V 90 H 65 V 100 H 35 V 90 H 50',
    smartphone: 'M 25 0 H 75 V 100 H 25 Z M 45 90 H 55',
    camera: 'M 0 25 H 100 V 90 H 0 Z M 50 35 A 20 20 0 1 0 50 80 A 20 20 0 1 0 50 35 M 75 10 H 90 V 25 H 75 Z',
    gift: 'M 10 35 H 90 V 100 H 10 Z M 50 35 V 100 M 10 55 H 90 M 30 10 Q 50 0 70 10 Q 50 30 30 10',

    // Nature
    leaf: 'M 50 100 C 50 100 100 75 100 35 A 50 50 0 0 0 0 35 C 0 75 50 100 50 100',
    cloud: 'M 25 65 C 5 65 5 45 25 45 C 25 25 45 25 55 35 C 65 25 85 25 85 45 C 105 45 105 65 85 65 Z',
    moon: 'M 50 0 A 50 50 0 1 0 100 50 A 40 40 0 1 1 50 0 Z',
    sun: 'M 50 25 A 25 25 0 1 0 50 75 A 25 25 0 1 0 50 25 M 50 0 V 15 M 50 85 V 100 M 0 50 H 15 M 85 50 H 100',

    // Symbols
    star: 'M 50 0 L 61 35 L 100 35 L 69 57 L 80 95 L 50 72 L 20 95 L 31 57 L 0 35 L 39 35 Z',
    heart: 'M 50 100 L 43 93 C 10 60 0 50 0 35 C 0 15 15 0 32 0 C 42 0 52 5 60 14 C 68 5 78 0 88 0 C 105 0 120 15 120 35 C 120 50 110 60 77 93 Z',

    // Arrows
    arrow_right: 'M 0 40 H 70 V 20 L 100 50 L 70 80 V 60 H 0 Z',
    arrow_left: 'M 100 40 H 30 V 20 L 0 50 L 30 80 V 60 H 100 Z',
    arrow_up: 'M 40 100 V 30 H 20 L 50 0 L 80 30 H 60 V 100 Z',
    arrow_down: 'M 40 0 V 70 H 20 L 50 100 L 80 70 H 60 V 0 Z',
};

export const ShapeNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, updateAttributes, deleteNode, selected, editor } = props;
    const {
        type, x, y, width, height, fill, stroke, strokeWidth, rotation,
        zIndex, opacity, text, textColor, fontSize, fontFamily, textAlign
    } = node.attrs;

    const [dragPos, setDragPos] = useState({ x, y });
    const [isResizing, setIsResizing] = useState(false);
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

    const handleResize = (e: any, { handle, size }: any) => {
        e.stopPropagation();

        let newWidth = Math.max(20, size.width);
        let newHeight = Math.max(20, size.height);
        let newX = x;
        let newY = y;

        // Shift key to maintain aspect ratio
        if (e.shiftKey) {
            const ratio = width / height;
            if (handle === 'e' || handle === 'w' || (Math.abs(newWidth - width) > Math.abs(newHeight - height))) {
                newHeight = newWidth / ratio;
            } else {
                newWidth = newHeight * ratio;
            }
        }

        // Adjust position if resizing from top or left handles
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

    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const path = shapes[type] || shapes.rectangle;

    const textRef = useRef<HTMLDivElement>(null);

    const handleFocusText = () => {
        if (textRef.current) {
            textRef.current.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    };

    const showControls = isHovered || selected || isDragging;

    return (
        <NodeViewWrapper
            className="absolute"
            style={{
                left: 0,
                top: 0,
                zIndex: isDragging ? 9999 : (zIndex || 70),
                width: width,
                height: 0,
            }}
        >
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                cancel="[contenteditable], .no-drag"
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
                        width={width}
                        height={height}
                        onResizeStart={() => setIsResizing(true)}
                        onResizeStop={(e, data) => {
                            setIsResizing(false);
                            handleResize(e, data);
                        }}
                        onResize={handleResize}
                        minConstraints={[20, 20]}
                        maxConstraints={[2000, 2000]}
                        resizeHandles={['s', 'e', 'w', 'n', 'sw', 'nw', 'se', 'ne']}
                        className={cn(
                            "relative drag-handle cursor-move flex items-center justify-center",
                            (showControls) ? "ring-2 ring-indigo-500/50 rounded outline outline-1 outline-dashed outline-indigo-300" : ""
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
                        <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible"
                            style={{ opacity, transition: 'opacity 0.2s' }}
                        >
                            <path
                                d={path}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fillRule="evenodd"
                            />
                        </svg>

                        {/* Text Content Area */}
                        <div
                            className={cn(
                                "absolute inset-0 z-10 w-full h-full flex items-center justify-center p-6 overflow-hidden",
                                selected ? "pointer-events-auto" : "pointer-events-none"
                            )}
                        >
                            <div
                                ref={textRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => updateAttributes({ text: e.currentTarget.innerText })}
                                onBlur={(e) => updateAttributes({ text: e.currentTarget.innerText })}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    // Ensure focus
                                    if (document.activeElement !== e.currentTarget) {
                                        e.currentTarget.focus();
                                    }
                                }}
                                className={cn(
                                    "outline-none w-full transition-all cursor-text",
                                    !text && "text-gray-400/30"
                                )}
                                style={{
                                    color: textColor,
                                    fontSize: `${fontSize}px`,
                                    fontFamily: fontFamily,
                                    textAlign: textAlign as any,
                                    minWidth: '20px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    pointerEvents: 'auto'
                                }}
                            >
                                {text || (selected ? "" : "")}
                            </div>
                            {!text && !selected && <span className="absolute text-gray-400/20 text-[10px] pointer-events-none font-bold">اكتب...</span>}
                        </div>

                        {/* Controls Toolbar — Bottom Center Pill */}
                        <div
                            className={cn(
                                "absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl px-2 py-1.5 rounded-full z-[100] transition-all cursor-default dir-rtl",
                                showControls && !isResizing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                            )}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-bold text-gray-700 px-1 border-e border-gray-100">أ</span>
                                <div className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: fill === 'transparent' ? '#fff' : fill }} />
                            </div>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600" title="لون التعبئة">
                                        <Palette size={15} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-52 p-3 border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-tight">إعدادات الشكل</div>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {['#6366f1', '#43a047', '#D32F2F', '#1976D2', '#FBC02D', '#7B1FA2', '#E64A19', '#0097A7', '#455A64', '#000000', '#FFFFFF', 'transparent'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateAttributes({ fill: c })}
                                                        className={cn("w-7 h-7 rounded-full border border-gray-100 transition-transform hover:scale-110", fill === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                                        style={{ backgroundColor: c === 'transparent' ? '#eee' : c }}
                                                    >
                                                        {c === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الشفافية ({Math.round(opacity * 100)}%)</div>
                                            <Slider
                                                value={[opacity * 100]}
                                                min={10}
                                                max={100}
                                                step={1}
                                                onValueChange={([val]) => updateAttributes({ opacity: val / 100 })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <div className="text-[10px] font-bold text-gray-400">الترتيب</div>
                                            <div className="flex gap-1">
                                                <button onClick={() => updateAttributes({ zIndex: (zIndex || 70) + 1 })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronUp size={14} /></button>
                                                <button onClick={() => updateAttributes({ zIndex: Math.max(1, (zIndex || 70) - 1) })} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronDown size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={handleFocusText}
                                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"
                                        title="تنسيق النص"
                                    >
                                        <TypeIcon size={15} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-xl dir-rtl">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-2">لون الخط</div>
                                            <div className="grid grid-cols-6 gap-1.5">
                                                {['#ffffff', '#000000', '#D32F2F', '#1976D2', '#43a047', '#FBC02D'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateAttributes({ textColor: c })}
                                                        className={cn("w-6 h-6 rounded-full border border-gray-100", textColor === c && "ring-2 ring-indigo-500")}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-2">حجم الخط ({fontSize}px)</div>
                                            <Slider
                                                value={[fontSize]}
                                                min={8}
                                                max={120}
                                                step={1}
                                                onValueChange={([val]) => updateAttributes({ fontSize: val })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                                            <button onClick={() => updateAttributes({ textAlign: 'left' })} className={cn("p-1.5 rounded-lg flex-1 flex justify-center", textAlign === 'left' ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50")}><AlignLeft size={14} /></button>
                                            <button onClick={() => updateAttributes({ textAlign: 'center' })} className={cn("p-1.5 rounded-lg flex-1 flex justify-center", textAlign === 'center' ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50")}><AlignCenter size={14} /></button>
                                            <button onClick={() => updateAttributes({ textAlign: 'right' })} className={cn("p-1.5 rounded-lg flex-1 flex justify-center", textAlign === 'right' ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50")}><AlignRight size={14} /></button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="w-px h-4 bg-gray-100 mx-1" />

                            <button
                                onClick={() => updateAttributes({ rotation: (rotation + 45) % 360 })}
                                className="p-1.5 hover:bg-gray-50 text-indigo-500 rounded-full transition-colors"
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
