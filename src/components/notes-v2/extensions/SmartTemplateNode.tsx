
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Palette, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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

    const templateWidth = node.attrs.width || 'auto';

    // Resize by dragging handle
    const [isResizing, setIsResizing] = useState(false);
    const resizeStart = useRef({ x: 0, startWidth: 0 });

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentWidth = contentRef.current?.offsetWidth || 300;
        resizeStart.current = { x: e.clientX, startWidth: currentWidth };
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;
        const onMove = (e: MouseEvent) => {
            const dx = resizeStart.current.x - e.clientX; // RTL: drag left = wider
            const newW = Math.max(100, resizeStart.current.startWidth + dx);
            if (contentRef.current) contentRef.current.style.width = `${newW}px`;
        };
        const onUp = (e: MouseEvent) => {
            setIsResizing(false);
            const dx = resizeStart.current.x - e.clientX;
            updateAttributes({ width: Math.max(100, resizeStart.current.startWidth + dx) });
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [isResizing, updateAttributes]);

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
            className={cn(
                "smart-template-node-view group",
                selected && "ring-2 ring-indigo-500 ring-offset-1"
            )}
            data-drag-handle=""
            style={{
                position: isFloating ? 'absolute' : 'relative',
                left: isFloating ? `${left}px` : 'auto',
                top: isFloating ? `${top}px` : 'auto',
                zIndex: isFloating ? 50 : 1,
                width: templateWidth === 'auto' ? 'auto' : `${templateWidth}px`,
                maxWidth: '100%',
                display: 'inline-block',
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
                userSelect: 'none',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Mini toolbar */}
            <div
                className={cn(
                    "absolute -top-8 right-0 z-50 flex items-center gap-0.5 px-1 py-0.5 rounded-md border border-gray-200 bg-white shadow-md transition-all",
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
                                        <button key={c} onClick={() => updateAttributes({ bgColor: c })}
                                            className={cn("w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform", bgColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                            style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}>
                                            {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">لون الحد</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {BORDER_COLORS.map(c => (
                                        <button key={c} onClick={() => updateAttributes({ borderColor: c })}
                                            className={cn("w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform", borderColor === c && "ring-2 ring-indigo-500 ring-offset-1")}
                                            style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}>
                                            {c === 'transparent' && <div className="w-full h-full rotate-45 flex items-center justify-center"><div className="w-[1px] h-4 bg-red-400" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">سماكة الحد ({borderWidth}px)</label>
                                <Slider value={[borderWidth]} min={0} max={4} step={0.5} onValueChange={([val]) => updateAttributes({ borderWidth: val })} />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                <button onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-500 transition-colors">
                    <X size={13} />
                </button>
            </div>

            {/* Template content - tight wrapper */}
            <div
                className="smart-layout-container outline-none rounded-lg"
                data-smart-template-config={encodeURIComponent(JSON.stringify(config || []))}
                style={{
                    width: '100%',
                    pointerEvents: isDragging ? 'none' : 'auto',
                    backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                    borderColor: borderColor === 'transparent' ? 'transparent' : borderColor,
                    borderWidth: `${borderWidth}px`,
                    borderStyle: borderWidth > 0 ? 'solid' : 'none',
                }}
            >
                <div className="w-full pointer-events-none" dangerouslySetInnerHTML={{ __html: html }} />
            </div>

            {/* Resize handle */}
            {controlsVisible && (
                <div
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 left-0 w-3 h-3 bg-indigo-500 rounded-full shadow-sm z-[60] cursor-nw-resize"
                    style={{ transform: 'translate(-50%, 50%)' }}
                    contentEditable={false}
                />
            )}
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
