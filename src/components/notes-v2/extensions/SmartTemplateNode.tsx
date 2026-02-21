
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Move, GripHorizontal, Unlock, Lock, GripVertical } from 'lucide-react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const SmartTemplateComponent = (props: any) => {
    const { node, updateAttributes, selected, getPos } = props;
    const { html, config, left, top, isFloating, width } = node.attrs;

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ left: left || 0, top: top || 0 });

    // We use a ref to the DOM element to update position during drag for performance (avoiding re-renders)
    const contentRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isFloating) return;

        // Only start drag if left click
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

                // Visual update only
                contentRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDragging(false);
            if (contentRef.current) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;

                // Commit new position
                const newLeft = initialPos.left + dx;
                const newTop = initialPos.top + dy;

                updateAttributes({
                    left: newLeft,
                    top: newTop
                });

                // Reset transform as the new position essentially "moves" the element to the transform target
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
        // If enabling floating, set initial position to something visible (e.g., current scroll + 50px)
        // For simplicity, we default to 50, 50 relative to editor
        const newFloatingState = !isFloating;

        updateAttributes({
            isFloating: newFloatingState,
            left: newFloatingState ? 50 : 0,
            top: newFloatingState ? 50 : 0
        });
    };

    const boxWidth = node.attrs.width || 400;
    const boxHeight = node.attrs.height || 200;
    const baseWidth = node.attrs.baseWidth || 400;
    const scale = boxWidth / baseWidth;

    const handleResize = (e: any, { size }: any) => {
        e.stopPropagation();
        updateAttributes({ width: size.width, height: size.height });
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
                zIndex: isFloating ? 50 : 1, // Higher z-index when floating
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
                borderRadius: '8px',
                userSelect: 'none' // Prevent text selection inside while dragging setup
            }}
        >
            {/* Controls Overlay - Visible on Hover or Selection */}
            {/* We render controls OUTSIDE the content flow so they don't affect layout */}
            <div
                className={`absolute top-1 right-1 z-50 flex items-center gap-1 p-1 rounded-md shadow-sm border border-gray-200 transition-all bg-white/90 backdrop-blur-sm ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto'}`}
                contentEditable={false}
            >
                {/* Drag Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`drag-handle p-0.5 rounded flex items-center justify-center transition-colors ${isFloating ? 'cursor-grab active:cursor-grabbing hover:bg-gray-100 text-gray-400' : 'cursor-not-allowed hover:bg-red-50 text-gray-300'}`}
                    title={isFloating ? "اسحب للتحريك" : "فعل الوضع الحر للتحريك"}
                >
                    <GripVertical size={14} />
                </div>

                {/* Toggle Float Button */}
                <button
                    onClick={toggleFloating}
                    className={`p-1 rounded flex items-center justify-center transition-colors hover:bg-gray-100 ${isFloating ? 'text-green-600' : 'text-gray-400'}`}
                    title={isFloating ? "تثبيت في النص (إلغاء وضع الحر)" : "تفعيل الوضع الحر (تحريك في أي مكان)"}
                >
                    {isFloating ? <Lock size={14} /> : <Unlock size={14} />}
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
                        if (!selected) return <div ref={ref} className="hidden" />;
                        return (
                            <div
                                ref={ref}
                                className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-300 shadow-sm z-[60] flex items-center justify-center cursor-se-resize hover:border-indigo-500 hover:bg-indigo-50 rounded-br-lg rounded-tl-lg pointer-events-auto"
                                style={{ transform: 'translate(50%, 50%)' }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="w-1.5 h-1.5 border-r border-b border-gray-400" />
                            </div>
                        );
                    }}
                >
                    <div
                        className="smart-layout-container outline-none"
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
                            transformOrigin: 'top right'
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
    atom: true, // Treated as a single unit
    draggable: true, // Allow standard ProseMirror dragging for non-floating state? 
    // Actually, if we want custom react dragging, we should set this to false or handle it carefully.
    // But for 'floating' mode, we handle drag ourselves.

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
                default: 100,
                renderHTML: (attributes) => ({
                    style: `width: ${attributes.width}%`,
                }),
            },
            isFloating: {
                default: false,
                renderHTML: (attributes) => ({
                    style: `position: ${attributes.isFloating ? 'absolute' : 'relative'}`,
                }),
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div.smart-layout-container',
                getAttrs: (element: string | HTMLElement) => {
                    if (typeof element === 'string') return {};

                    // Recover HTML from attribute if possible, fallback to innerHTML
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
                        // If style has position absolute, preserve it
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
        // We render as a div with the class to ensure it looks right if the extension is missing (fallback)
        // But for the editor, NodeView takes over.
        return ['div', mergeAttributes(HTMLAttributes, { class: 'smart-layout-container' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SmartTemplateComponent);
    },
});
