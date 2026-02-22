import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

export const PageNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, editor, updateAttributes } = props;

    // Auto-calculate page number based on position in document
    let pageNumber = 1;
    const pos = props.getPos();
    if (typeof pos === 'number') {
        let count = 0;
        editor.state.doc.descendants((n, npos) => {
            if (n.type.name === 'page') {
                count++;
                if (npos >= pos) return false;
            }
            return true;
        });
        pageNumber = count || 1;
    }

    // Values from storage
    const storage = (editor.storage as any).page || {};
    const zoom = storage.zoom || 100;
    const pageLayout = storage.layout || 'blank'; // 'blank' | 'ruled' | 'dotted'
    const rulingSpacing = storage.rulingSpacing || 32;
    const pageBackground = storage.background || null;
    const pageOuterColor = storage.backgroundColor || '#ffffff';
    const backgroundColor = storage.pageBgColor || '#ffffff';
    const orientation = storage.orientation || 'portrait';
    const margin = storage.margin ?? 20;
    const pageBorder = storage.border || 'none';
    const borderColor = storage.borderColor || '#6b7280';
    const borderWidth = storage.borderWidth || 2;
    const cornerRadius = storage.cornerRadius || 0;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // A4 dimensions in px (at 96dpi: 210mm ≈ 794px, 297mm ≈ 1123px)
    const pageWidthPx = orientation === 'portrait' ? 794 : 1123;
    const pageHeightPx = orientation === 'portrait' ? 1123 : 794;
    const scale = isMobile ? 1 : zoom / 100;

    // The rendered dimensions after scale
    const renderedWidth = isMobile ? '100%' : `${pageWidthPx * scale}px`;
    const renderedHeight = isMobile ? 'calc(100vh - 180px)' : `${pageHeightPx * scale}px`;

    // Generate background based on layout type
    const getLayoutBackground = (): React.CSSProperties => {
        const sp = rulingSpacing;
        if (pageLayout === 'ruled') {
            return {
                backgroundImage: `repeating-linear-gradient(transparent, transparent ${sp - 1}px, #d1d5db40 ${sp - 1}px, #d1d5db40 ${sp}px)`,
                backgroundAttachment: 'local',
                lineHeight: `${sp}px`,
            };
        }
        if (pageLayout === 'dotted') {
            return {
                backgroundImage: `radial-gradient(circle, #c0c4cc 0.8px, transparent 0.8px)`,
                backgroundSize: `${sp}px ${sp}px`,
                backgroundAttachment: 'local',
            };
        }
        if (pageLayout === 'squared') {
            return {
                backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
                backgroundSize: `${sp}px ${sp}px`,
                backgroundAttachment: 'local',
            };
        }
        return {};
    };

    // Generate border style
    const getBorderStyle = (): React.CSSProperties => {
        const w = Math.max(1, borderWidth);
        const c = borderColor;
        const radius = `${cornerRadius}px`;

        const baseStyle: React.CSSProperties = { borderRadius: radius };

        switch (pageBorder) {
            case 'simple': return { ...baseStyle, border: `${w}px solid ${c}` };
            case 'double': return { ...baseStyle, border: `${Math.max(3, w * 2)}px double ${c}` };
            case 'dashed': return { ...baseStyle, border: `${w}px dashed ${c}` };
            case 'dotted': return { ...baseStyle, border: `${w}px dotted ${c}` };
            case 'thick': return { ...baseStyle, border: `${w * 2 + 1}px solid ${c}` };
            case 'double-thick': return { ...baseStyle, border: `${Math.max(5, w * 3)}px double ${c}` };
            case 'outlined': return { ...baseStyle, border: `${w}px solid ${c}`, outline: `1px solid ${c}`, outlineOffset: `-${w + 2}px` };
            default: return baseStyle;
        }
    };

    return (
        <NodeViewWrapper
            className={cn("page-node-view flex justify-center", isMobile ? "px-0" : "")}
            style={{
                // Reserve exact space for the scaled page + gap
                width: '100%',
                marginBottom: isMobile ? '0px' : '40px',
                paddingTop: '0px',
            }}
        >
            <div
                style={{
                    width: renderedWidth as any,
                    height: renderedWidth === '100%' ? 'auto' : renderedHeight as any,
                    minHeight: renderedHeight as any,
                    position: 'relative',
                }}
            >
                {/* The actual A4 page */}
                <div
                    className={cn(
                        "bg-white transition-colors duration-300 relative",
                        !isMobile && "shadow-[0_2px_12px_rgba(0,0,0,0.08)]",
                        pageBorder === 'none' && !isMobile && "border border-gray-200/80",
                        isMobile && ""
                    )}
                    style={(() => {
                        const baseStyle: React.CSSProperties = {
                            width: isMobile ? '100%' : `${pageWidthPx}px`,
                            height: isMobile ? 'auto' : `${pageHeightPx}px`,
                            minHeight: isMobile ? 'calc(100vh - 180px)' : `${pageHeightPx}px`,
                            backgroundColor: pageOuterColor,
                            transform: isMobile ? 'none' : `scale(${scale})`,
                            transformOrigin: 'top center',
                        };

                        if (pageBackground) {
                            let bgImage = pageBackground;
                            let bgSize = 'cover';
                            let bgRepeat = 'no-repeat';

                            try {
                                if (pageBackground.startsWith('{')) {
                                    const parsed = JSON.parse(pageBackground);
                                    bgImage = parsed.image;
                                    bgSize = parsed.size || 'cover';
                                    bgRepeat = parsed.repeat || 'no-repeat';
                                }
                            } catch (e) { }

                            return {
                                ...baseStyle,
                                backgroundImage: bgImage,
                                backgroundSize: bgSize,
                                backgroundAttachment: 'local',
                                backgroundRepeat: bgRepeat,
                            };
                        }
                        return baseStyle;
                    })()}
                >
                    {/* Header - Above the margin boundary */}
                    <div
                        contentEditable={false}
                        className="absolute flex justify-between text-[9px] text-gray-400 font-medium z-10 select-none opacity-60 hover:opacity-100 transition-opacity"
                        style={{
                            left: isMobile ? '0.5mm' : `${margin}mm`,
                            right: isMobile ? '0.5mm' : `${margin}mm`,
                            top: isMobile ? '0px' : `${Math.max(2, margin - 10)}mm`,
                            height: '15px'
                        }}
                    >
                        <input
                            type="text"
                            value={node.attrs.header ?? 'بركة'}
                            onChange={(e) => updateAttributes({ header: e.target.value })}
                            className="bg-transparent border-none outline-none focus:text-indigo-600 focus:font-bold transition-all w-1/2 text-gray-400"
                            placeholder="العنوان العلوي..."
                        />
                        <span>{new Date().toLocaleDateString('ar-SA')}</span>
                    </div>

                    {/* Main content area that follows the margin and border settings */}
                    <div
                        style={{
                            ...getBorderStyle(),
                            position: 'absolute',
                            top: isMobile ? '2px' : `${margin}mm`,
                            bottom: isMobile ? '2mm' : `${margin}mm`,
                            left: isMobile ? '0.5mm' : `${margin}mm`,
                            right: isMobile ? '0.5mm' : `${margin}mm`,
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}
                    >
                        <div style={{
                            ...getLayoutBackground(),
                            backgroundColor: backgroundColor,
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 0
                        }}></div>
                        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: pageBorder !== 'none' ? '12px' : '0px' }}>
                            <NodeViewContent className="flex-grow prose prose-lg max-w-none focus:outline-none text-gray-700 leading-relaxed dir-rtl" />
                        </div>
                    </div>

                    {/* Footer - Below the margin boundary */}
                    <div
                        contentEditable={false}
                        className="absolute flex justify-between items-center text-[9px] text-gray-400 font-medium z-10 select-none opacity-60 hover:opacity-100 transition-opacity"
                        style={{
                            left: isMobile ? '2mm' : `${margin}mm`,
                            right: isMobile ? '2mm' : `${margin}mm`,
                            bottom: isMobile ? '0px' : `${Math.max(2, margin - 8)}mm`,
                            height: '15px'
                        }}
                    >
                        <span>صفحة {pageNumber}</span>
                        <input
                            type="text"
                            value={node.attrs.footer ?? ''}
                            onChange={(e) => updateAttributes({ footer: e.target.value })}
                            className="bg-transparent border-none outline-none focus:text-indigo-600 focus:font-bold transition-all text-left w-1/2 text-gray-400"
                            placeholder="تذييل..."
                        />
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};
