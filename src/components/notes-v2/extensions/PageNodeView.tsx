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
    const backgroundColor = storage.backgroundColor || '#ffffff';
    const orientation = storage.orientation || 'portrait';
    const margin = storage.margin ?? 20;
    const pageBorder = storage.border || 'none';

    // A4 dimensions in px (at 96dpi: 210mm ≈ 794px, 297mm ≈ 1123px)
    const pageWidthPx = orientation === 'portrait' ? 794 : 1123;
    const pageHeightPx = orientation === 'portrait' ? 1123 : 794;
    const scale = zoom / 100;

    // The rendered dimensions after scale
    const renderedWidth = pageWidthPx * scale;
    const renderedHeight = pageHeightPx * scale;

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
        return {};
    };

    // Generate border style
    const getBorderStyle = (): React.CSSProperties => {
        switch (pageBorder) {
            case 'simple': return { border: '2px solid #9ca3af' };
            case 'double': return { border: '4px double #6b7280' };
            case 'dashed': return { border: '2px dashed #9ca3af' };
            case 'thick': return { border: '4px solid #4b5563' };
            case 'decorative': return { border: '4px double #6366f1', boxShadow: 'inset 0 0 0 4px #ffffff, inset 0 0 0 6px #a5b4fc' };
            default: return {};
        }
    };

    return (
        <NodeViewWrapper
            className="page-node-view flex justify-center"
            style={{
                // Reserve exact space for the scaled page + gap
                width: '100%',
                marginBottom: '40px',
                paddingTop: '0px',
            }}
        >
            <div
                style={{
                    width: `${renderedWidth}px`,
                    minHeight: `${renderedHeight}px`,
                    position: 'relative',
                }}
            >
                {/* The actual A4 page */}
                <div
                    className={cn(
                        "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 relative",
                        pageBorder === 'none' && "border border-gray-200/80",
                    )}
                    style={(() => {
                        const baseStyle: React.CSSProperties = {
                            width: `${pageWidthPx}px`,
                            minHeight: `${pageHeightPx}px`,
                            padding: `${margin}mm`,
                            backgroundColor: backgroundColor,
                            transform: `scale(${scale})`,
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
                    {/* Header */}
                    <div
                        contentEditable={false}
                        className="absolute top-2 border-b border-gray-100/80 pb-1 flex justify-between text-[10px] text-gray-400 font-medium z-10 select-none"
                        style={{ left: `${margin}mm`, right: `${margin}mm` }}
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

                    {/* Inner bordered area (borders inside margins) */}
                    <div
                        style={{
                            ...getBorderStyle(),
                            ...getLayoutBackground(),
                            minHeight: '95%',
                            padding: pageBorder !== 'none' ? '8px' : '0',
                            marginTop: '20px',
                        }}
                    >
                        <NodeViewContent className="flex-grow prose prose-lg max-w-none focus:outline-none text-gray-700 leading-relaxed dir-rtl min-h-[200px]" />
                    </div>

                    {/* Footer */}
                    <div
                        contentEditable={false}
                        className="absolute bottom-2 border-t border-gray-100/80 pt-1 flex justify-between items-center text-[10px] text-gray-400 font-medium z-10 select-none"
                        style={{ left: `${margin}mm`, right: `${margin}mm` }}
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
