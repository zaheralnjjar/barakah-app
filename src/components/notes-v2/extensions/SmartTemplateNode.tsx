
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Unlock, Lock, Palette, X } from 'lucide-react';
import { ResizableBox } from 'react-resizable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import 'react-resizable/css/styles.css';

const BG_COLORS = [
    'transparent', '#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fefce8', '#fef2f2', '#faf5ff', '#fff7ed'
];
const BORDER_COLORS = [
    'transparent', '#e5e7eb', '#9ca3af', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
];

const SmartTemplateComponent = (props: any) => {
    const { node, updateAttributes, selected, deleteNode } = props;
    const { html, config, left, top, isFloating, width } = node.attrs;

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ left: left || 0, top: top || 0 });

    const contentRef = useRef<HTMLDivElement>(null);

    const bgColor = node.attrs.bgColor || 'transparent';
    const borderColor = node.attrs.borderColor || 'transparent';
    const borderWidth = node.attrs.borderWidth || 0;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isFloating) return;
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ left: node.attrs.left || 0, top: node.attrs.top || 0 });
    }, [isFloating, node.attrs.left, node.attrs.top]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (contentRef.current) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                contentRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDragging(false);
            if (contentRef.current) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                const newLeft = initialPos.left + dx;
                const newTop = initialPos.top + dy;

                updateAttributes({ left: newLeft, top: newTop });
                contentRef.current.style.transform = 'none';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, initialPos, updateAttributes]);

    const toggleFloating = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newFloatingState = !isFloating;
        updateAttributes({
            isFloating: newFloatingState,
            left: newFloatingState ? 50 : 0,
            top: newFloatingState ? 50 : 0
        });
    };

    const boxWidth = node.attrs.width || node.attrs.baseWidth || 400;
    const boxHeight = node.attrs.height || 200;
    const baseWidth = node.attrs.baseWidth || 400;
    const scale = Math.max(0.1, boxWidth / baseWidth);

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: Math.max(50, size.width), height: Math.max(30, size.height) });
    };

    const showControls = selected || false;
    const [isHovered, setIsHovered] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
    const controlsVisible = showControls || isHovered || popoverOpen;

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

    return (
        <NodeViewWrapper
            ref={contentRef}
            className={`smart-template-node-view group ${selected ? 'selected ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            data-drag-handle=""
            style={{
                position: isFloating ? 'absolute' : 'relative',
                left: isFloating ? `${left}px` : 'auto',
                top: isFloating ? `${top}px` : 'auto',
                zIndex: isFloating ? 50 : 1,
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
                borderRadius: '8px',
                userSelect: 'none',
                paddingTop: '36px',
                marginTop: '-36px',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Mini toolbar */}
            <div
                className={cn(
                    "absolute top-0 right-0 z-50 flex items-center gap-0.5 px-1 py-0.5 rounded-md border border-gray-200 bg-white shadow-md transition-all",
                    controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                )}
                contentEditable={false}
                onMouseEnter={handleMouseEnter}
            >
                <div
                    onMouseDown={handleMouseDown}
                    className={cn(
                        "drag-handle p-1 rounded flex items-center justify-center transition-colors",
                        isFloating ? 'cursor-grab active:cursor-grabbing hover:bg-gray-100 text-gray-400' : 'cursor-not-allowed text-gray-300'
                    )}
                >
                    <GripVertical size={14} />
                </div>

                <button
                    onClick={toggleFloating}
                    className={cn("p-1 rounded transition-colors hover:bg-gray-100", isFloating ? 'text-green-600' : 'text-gray-400')}
                    title={isFloating ? "تثبيت في النص" : "وضع حر"}
                >
                    {isFloating ? <Lock size={13} /> : <Unlock size={13} />}
                </button>

                {/* Color/border customization */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500" onClick={(e) => e.stopPropagation()}>
                            <Palette size={13} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-3" align="end" dir="rtl" sideOffset={8}>
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <h4 className="font-bold text-xs text-gray-600">تخصيص القالب</h4>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">لون الخلفية</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {BG_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateAttributes({ bgColor: c })}
                                            className={cn("w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform", bgColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                            style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                        >
                                            {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">لون الحد</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {BORDER_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateAttributes({ borderColor: c })}
                                            className={cn("w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform", borderColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                            style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                        >
                                            {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">سماكة الحد ({borderWidth}px)</label>
                                <Slider
                                    value={[borderWidth]}
                                    min={0}
                                    max={4}
                                    step={0.5}
                                    onValueChange={([val]) => updateAttributes({ borderWidth: val })}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-500 transition-colors"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Render the actual Smart Template Content wrapped in ResizableBox */}
            <div className="relative">
                <ResizableBox
                    width={boxWidth}
                    height={boxHeight}
                    onResizeStop={handleResize}
                    minConstraints={[100, 50]}
                    maxConstraints={[2000, 4000]}
                    resizeHandles={['se']}
                    handle={(handleAxis, ref) => {
                        if (!controlsVisible) return <div ref={ref} className="hidden" />;
                        return (
                            <div
                                ref={ref}
                                className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-full shadow-sm z-[60] cursor-se-resize"
                                style={{ transform: 'translate(50%, 50%)' }}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        );
                    }}
                >
                    <div
                        className="smart-layout-container outline-none rounded-lg transition-all"
                        data-smart-template-config={encodeURIComponent(JSON.stringify(config || []))}
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            gap: '0px',
                            width: `${baseWidth}px`,
                            height: 'auto',
                            minHeight: `${boxHeight / scale}px`,
                            pointerEvents: isDragging ? 'none' : 'auto',
                            transform: `scale(${scale})`,
                            transformOrigin: 'top right',
                            backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                            borderColor: borderColor === 'transparent' ? 'transparent' : borderColor,
                            borderWidth: `${borderWidth}px`,
                            borderStyle: borderWidth > 0 ? 'solid' : 'none',
                        }}
                    >
                        {/* Inner content from template */}
                        <div className="w-full h-full pointer-events-none" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                </ResizableBox>
            </div>
        </NodeViewWrapper>
    );
};

export const SmartTemplateNode = Node.create({
    name: 'smartTemplateNode',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            html: {
                default: '',
                parseHTML: (element) => {
                    const attr = element.getAttribute('data-smart-template-html');
                    if (attr) return decodeURIComponent(attr);
                    return element.innerHTML;
                },
                renderHTML: (attributes) => {
                    if (!attributes.html) return {};
                    return {
                        'data-smart-template-html': encodeURIComponent(attributes.html),
                    };
                },
            },
            config: {
                default: [],
                parseHTML: (element) => {
                    const attr = element.getAttribute('data-smart-template-config');
                    if (!attr) return [];
                    try {
                        return JSON.parse(decodeURIComponent(attr));
                    } catch (e) {
                        return [];
                    }
                },
                renderHTML: (attributes) => {
                    if (!attributes.config || attributes.config.length === 0) return {};
                    return {
                        'data-smart-template-config': encodeURIComponent(JSON.stringify(attributes.config)),
                    };
                },
            },
            left: {
                default: 0,
                renderHTML: (attributes) => ({
                    style: `left: ${attributes.left}px`,
                }),
            },
            top: {
                default: 0,
                renderHTML: (attributes) => ({
                    style: `top: ${attributes.top}px`,
                }),
            },
            width: {
                default: 400,
                renderHTML: (attributes) => ({
                    style: `width: ${attributes.width}px`,
                }),
            },
            height: {
                default: 200,
            },
            baseWidth: {
                default: 400,
            },
            isFloating: {
                default: false,
                renderHTML: (attributes) => ({
                    style: `position: ${attributes.isFloating ? 'absolute' : 'relative'}`,
                }),
            },
            bgColor: { default: 'transparent' },
            borderColor: { default: 'transparent' },
            borderWidth: { default: 0 },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div.smart-layout-container',
                getAttrs: (element: string | HTMLElement) => {
                    if (typeof element === 'string') return {};

                    const htmlAttr = element.getAttribute('data-smart-template-html');
                    let htmlContent = '';
                    if (htmlAttr) {
                        try {
                            htmlContent = decodeURIComponent(htmlAttr);
                        } catch (e) {
                            htmlContent = element.innerHTML;
                        }
                    } else {
                        htmlContent = element.innerHTML;
                    }

                    const configStr = element.getAttribute('data-smart-template-config');
                    let config = [];
                    try {
                        if (configStr) config = JSON.parse(decodeURIComponent(configStr));
                    } catch (e) {
                        console.error("Failed to parse config", e);
                    }
                    return {
                        html: htmlContent,
                        config: config,
                        isFloating: element.style.position === 'absolute',
                        left: parseFloat(element.style.left || '0'),
                        top: parseFloat(element.style.top || '0'),
                        width: element.style.width ? parseFloat(element.style.width) : 100,
                    };
                }
            },
            {
                tag: 'smart-template-block',
            }
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'smart-layout-container' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SmartTemplateComponent);
    },
});
