
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Bold, Italic, Underline, Strikethrough, AlignRight, AlignCenter, AlignLeft,
    AlignJustify, LayoutList, LayoutGrid, FileUp, Footprints, Video,
    Undo, Redo, Minus, Plus, Type, Palette, Link, Image as ImageIcon,
    Table as TableIcon, Table2, Trash2, Pencil, Copy, Download, Share2,
    Eye, EyeOff, Save, X, Printer, Maximize2, Minimize2, StickyNote,
    MessageSquare, ChevronDown
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface AcademicEditorToolbarProps {
    sidebarVisible?: boolean;
    formatPainterActive: boolean;
    setFormatPainterActive: (active: boolean) => void;
    setPainterStyles: (styles: any) => void;
    editorZoom: number;
    setEditorZoom: (zoom: number) => void;
    pageSize: 'A4' | 'A5' | 'Letter';
    setPageSize: (size: 'A4' | 'A5' | 'Letter') => void;
    currentPage?: number;
    lineSpacing: number;
    setLineSpacing: (spacing: number) => void;
    pdfInputRef: React.RefObject<HTMLInputElement>;
    addNewPage?: () => void;
    insertFootnote: () => void;
    showComments?: boolean;
    setShowComments?: (show: boolean) => void;
    setIsQuickNotesOpen?: (open: boolean) => void;
    textDirection: 'rtl' | 'ltr' | 'auto';
    setTextDirection: (dir: 'rtl' | 'ltr' | 'auto') => void;
    compact?: boolean; // For modal usage
}

export const AcademicEditorToolbar: React.FC<AcademicEditorToolbarProps> = ({
    sidebarVisible = false,
    formatPainterActive,
    setFormatPainterActive,
    setPainterStyles,
    editorZoom,
    setEditorZoom,
    pageSize,
    setPageSize,
    currentPage = 1,
    lineSpacing,
    setLineSpacing,
    pdfInputRef,
    addNewPage,
    insertFootnote,
    showComments = false,
    setShowComments,
    setIsQuickNotesOpen,
    textDirection,
    setTextDirection,
    compact = false
}) => {
    // Helper sizes
    const iconSize = compact || sidebarVisible ? "w-3 h-3" : "w-4 h-4";
    const btnSize = compact || sidebarVisible ? "h-7 w-7" : "h-8 w-8";
    const selectH = compact || sidebarVisible ? "h-7 text-[10px]" : "h-8 text-xs";

    return (
        <div className={`sticky top-0 z-50 bg-[#1e1b4b] border-b border-white/10 shadow-lg ${compact ? 'rounded-t-lg p-1' : 'p-2'}`} dir="rtl">

            {/* Row 1: Main Controls */}
            <div className="flex flex-wrap items-center justify-center gap-1 mb-1">
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} title="تراجع" onClick={() => document.execCommand('undo')}><Undo className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} title="إعادة" onClick={() => document.execCommand('redo')}><Redo className={iconSize} /></Button>
                <div className="w-px h-5 bg-white/20" />

                {/* Arabic Fonts */}
                <Select defaultValue="Traditional Arabic" onValueChange={(val) => document.execCommand("fontName", false, val)}>
                    <SelectTrigger className={`${compact ? 'w-24' : sidebarVisible ? 'w-28' : 'w-40'} ${selectH} bg-white/10 border-white/20 text-white`}><SelectValue placeholder="خط عربي" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Traditional Arabic">Traditional Arabic (تقليدي)</SelectItem>
                        <SelectItem value="Amiri">Amiri (أميري)</SelectItem>
                        <SelectItem value="Cairo">Cairo (القاهرة)</SelectItem>
                        <SelectItem value="Tajawal">Tajawal (تجوّل)</SelectItem>
                        <SelectItem value="Almarai">Almarai (المراعي)</SelectItem>
                        <SelectItem value="Noto Naskh Arabic">Noto Naskh Arabic</SelectItem>
                        <SelectItem value="Scheherazade New">Scheherazade New</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                    </SelectContent>
                </Select>

                {/* Font Size */}
                <Select defaultValue="14" onValueChange={(val) => document.execCommand('fontSize', false, val)}>
                    <SelectTrigger className={`${compact ? 'w-10' : 'w-14'} ${selectH} bg-white/10 border-white/20 text-white`}><SelectValue placeholder="14" /></SelectTrigger>
                    <SelectContent>
                        {[10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="w-px h-5 bg-white/20" />

                {/* Zoom Control */}
                <div className={`flex items-center gap-0.5 bg-white/10 rounded-lg ${compact ? 'px-1' : 'px-2 py-1'}`}>
                    <Button variant="ghost" size="sm" className={`h-4 w-4 p-0 text-white/70`} onClick={() => setEditorZoom(Math.max(50, editorZoom - 10))}><Minus className="w-2 h-2" /></Button>
                    <span className={`${compact ? 'text-[9px] w-6' : 'text-xs w-10'} text-white/80 text-center`}>{editorZoom}%</span>
                    <Button variant="ghost" size="sm" className={`h-4 w-4 p-0 text-white/70`} onClick={() => setEditorZoom(Math.min(200, editorZoom + 10))}><Plus className="w-2 h-2" /></Button>
                </div>

                {/* Page Size */}
                {!compact && (
                    <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger className={`${sidebarVisible ? 'w-12 h-6 text-[10px]' : 'w-16 h-8 text-xs'} bg-white/10 border-white/20 text-white`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="A5">A5</SelectItem>
                            <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {/* Line Spacing */}
                <Select value={String(lineSpacing)} onValueChange={(val) => setLineSpacing(parseFloat(val))}>
                    <SelectTrigger className={`${compact ? 'w-10' : 'w-14'} ${selectH} bg-white/10 border-white/20 text-white`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1.0</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="1.8">1.8</SelectItem>
                        <SelectItem value="2">2.0</SelectItem>
                    </SelectContent>
                </Select>

                <div className="w-px h-5 bg-white/20" />

                {/* New Page (if enabled) */}
                {addNewPage && (
                    <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} title="صفحة جديدة" onClick={addNewPage}>
                        <Plus className={iconSize} />
                    </Button>
                )}

                {/* Insert Table */}
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} title="إدراج جدول" onClick={() => {
                    const table = `<table contenteditable="false" style="width:100%;border-collapse:collapse;margin:16px 0;direction:rtl;table-layout:fixed;">
                        <tr>
                            <td contenteditable="true" style="border:2px solid #6366f1;padding:12px;background:#f8fafc;min-height:40px;text-align:right;direction:rtl;">اكتب هنا</td>
                            <td contenteditable="true" style="border:2px solid #6366f1;padding:12px;background:#f8fafc;min-height:40px;text-align:right;direction:rtl;">اكتب هنا</td>
                        </tr>
                        <tr>
                            <td contenteditable="true" style="border:2px solid #6366f1;padding:12px;min-height:40px;text-align:right;direction:rtl;"></td>
                            <td contenteditable="true" style="border:2px solid #6366f1;padding:12px;min-height:40px;text-align:right;direction:rtl;"></td>
                        </tr>
                    </table><p><br></p>`;
                    document.execCommand('insertHTML', false, table);
                    toast({ title: "✅ تم إدراج جدول" });
                }}><LayoutGrid className={iconSize} /></Button>

                {/* Quick Notes */}
                {setIsQuickNotesOpen && (
                    <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} title="ملاحظات سريعة" onClick={() => setIsQuickNotesOpen(true)}><StickyNote className={iconSize} /></Button>
                )}

                {/* Format Painter */}
                <Button
                    variant={formatPainterActive ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 px-2 text-xs ${formatPainterActive ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white'}`}
                    onClick={() => {
                        if (!formatPainterActive) {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                const node = selection.anchorNode?.parentElement;
                                if (node) {
                                    setPainterStyles({
                                        fontFamily: window.getComputedStyle(node).fontFamily,
                                        fontSize: window.getComputedStyle(node).fontSize,
                                        color: window.getComputedStyle(node).color,
                                        fontWeight: window.getComputedStyle(node).fontWeight,
                                        fontStyle: window.getComputedStyle(node).fontStyle,
                                    });
                                    setFormatPainterActive(true);
                                    toast({ title: "✓ تم نسخ التنسيق" });
                                }
                            }
                        } else {
                            setFormatPainterActive(false);
                        }
                    }}
                    title="ناسخ التنسيق"
                >
                    <Pencil className="w-3 h-3 ml-1" />
                </Button>
            </div>

            {/* Row 2: Text Formatting */}
            <div className="flex flex-wrap items-center justify-center gap-0.5">
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('bold')} title="غامق"><Bold className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('italic')} title="مائل"><Italic className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('underline')} title="تسطير"><Underline className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('strikeThrough')} title="يتوسطه خط"><Strikethrough className={iconSize} /></Button>

                <div className="w-px h-5 bg-white/20 mx-0.5" />

                {/* Colors */}
                <div className="flex items-center gap-0.5 bg-white/10 rounded px-0.5">
                    <Type className="w-3 h-3 text-white/50" />
                    <input type="color" className="w-5 h-5 rounded cursor-pointer border-0" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} title="لون النص" />
                </div>
                <div className="flex items-center gap-0.5 bg-white/10 rounded px-0.5">
                    <Palette className="w-3 h-3 text-white/50" />
                    <input type="color" className="w-5 h-5 rounded cursor-pointer border-0" defaultValue="#FFFF00" onChange={(e) => document.execCommand('hiliteColor', false, e.target.value)} title="تمييز" />
                </div>

                <div className="w-px h-5 bg-white/20 mx-0.5" />

                {/* Direction */}
                <Button variant={textDirection === 'rtl' ? 'secondary' : 'ghost'} size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => setTextDirection('rtl')} title="يمين-يسار">RTL</Button>
                <Button variant={textDirection === 'ltr' ? 'secondary' : 'ghost'} size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => setTextDirection('ltr')} title="يسار-يمين">LTR</Button>

                <div className="w-px h-5 bg-white/20 mx-0.5" />

                {/* Alignment */}
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('justifyRight')}><AlignRight className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('justifyCenter')}><AlignCenter className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => document.execCommand('justifyLeft')}><AlignLeft className={iconSize} /></Button>

                <div className="w-px h-5 bg-white/20 mx-0.5" />

                {/* Lists */}
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => {
                    document.execCommand('insertHTML', false, '<ul style="list-style-type:disc;padding-right:20px;margin:8px 0;direction:rtl;"><li>عنصر جديد</li></ul>');
                }}><LayoutList className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={() => {
                    document.execCommand('insertHTML', false, '<ol style="list-style-type:decimal;padding-right:20px;margin:8px 0;direction:rtl;"><li>عنصر أول</li></ol>');
                }}><LayoutGrid className={iconSize} /></Button>

                {/* PDF & Footnotes */}
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-rose-400 hover:bg-rose-500/20`} onClick={() => pdfInputRef.current?.click()} title="PDF"><FileUp className={iconSize} /></Button>
                <Button variant="ghost" size="sm" className={`${btnSize} p-0 text-white/70 hover:text-white`} onClick={insertFootnote} title="حاشية"><Footprints className={iconSize} /></Button>

                {/* Page Break */}
                {!compact && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
                        const pageBreak = `<div style="page-break-after:always;margin:40px 0;text-align:center;"><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/><span style="background:#f1f5f9;padding:4px 12px;border-radius:4px;font-size:12px;color:#64748b;">── فاصل صفحات ──</span><hr style="border:none;border-top:2px dashed #d97706;margin:20px 0;"/></div><p>&nbsp;</p>`;
                        document.execCommand('insertHTML', false, pageBreak);
                        toast({ title: "✅ تم إضافة صفحة جديدة" });
                    }} title="فاصل"><Minus className="w-3 h-3 ml-1" /></Button>
                )}
            </div>
        </div>
    );
};
