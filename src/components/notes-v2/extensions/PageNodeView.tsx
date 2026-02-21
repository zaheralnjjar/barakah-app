import React, { useRef } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

export const PageNodeView: React.FC<NodeViewProps> = (props) => {
    const { node, editor, updateAttributes } = props;
    const pageNumber = node.attrs.pageNumber || 1;

    // Values from storage/state if we want to sync
    const storage = (editor.storage as any).page || {};
    const zoom = storage.zoom || 100;
    const pageRuling = storage.ruling || false;
    const pageBackground = storage.background || null;
    const backgroundColor = storage.backgroundColor || '#ffffff';

    return (
        <NodeViewWrapper className="page-node-view relative mb-8 last:mb-0 first:mt-4">
            <div className="flex flex-col items-center">
                {/* Page content container */}
                <div
                    className={cn(
                        "bg-white shadow-xl border border-gray-200 transition-all duration-300 origin-top flex flex-col relative",
                        pageRuling ? 'ruled-paper' : '',
                        "w-[210mm] min-h-[297mm] max-w-full"
                    )}
                    style={(() => {
                        const baseStyle: React.CSSProperties = {
                            transform: `scale(${zoom / 100})`,
                            padding: '20mm',
                            backgroundColor: backgroundColor,
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
                        } else if (pageRuling) {
                            return {
                                ...baseStyle,
                                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                                backgroundAttachment: 'local',
                                lineHeight: '32px',
                                paddingTop: '4px',
                            };
                        }
                        return baseStyle;
                    })()}
                >
                    {/* Header */}
                    <div className="absolute top-4 left-[20mm] right-[20mm] border-b border-gray-100 pb-1 flex justify-between text-[10px] text-gray-400 font-medium z-10">
                        <input
                            type="text"
                            value={node.attrs.header ?? (editor.storage as any).page?.title ?? 'بركة'}
                            onChange={(e) => updateAttributes({ header: e.target.value })}
                            className="bg-transparent border-none outline-none focus:text-indigo-600 focus:font-bold transition-all w-1/2"
                            placeholder="العنوان العلوي..."
                        />
                        <span>{new Date().toLocaleDateString('ar-SA')}</span>
                    </div>

                    <NodeViewContent className="flex-grow prose prose-lg max-w-none focus:outline-none text-gray-700 leading-relaxed dir-rtl" />

                    {/* Footer / Page Number */}
                    <div className="absolute bottom-4 left-[20mm] right-[20mm] border-t border-gray-100 pt-1 flex justify-between items-center text-[10px] text-gray-400 font-medium z-10">
                        <span>صفحة {pageNumber}</span>
                        <input
                            type="text"
                            value={node.attrs.footer ?? 'كل الحقوق محفوظة'}
                            onChange={(e) => updateAttributes({ footer: e.target.value })}
                            className="bg-transparent border-none outline-none focus:text-indigo-600 focus:font-bold transition-all text-left w-1/2"
                            placeholder="تذييل الصفحة..."
                        />
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};
