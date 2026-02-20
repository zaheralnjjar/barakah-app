
import React, { useState, useEffect, useRef } from 'react';
import { Template } from './types';
import {
    Check, X, AlignRight, AlignCenter, AlignLeft,
    Trash2, GripVertical, MoveHorizontal, MoveVertical, Plus,
    Footprints, Sunrise, Square, Wand2, Monitor, Minus
} from 'lucide-react';
import { generateSmartHtml } from './constants';
import TemplateSelector from './TemplateSelector';

interface SmartFormRendererProps {
    template: Template;
    onConfirm: (html: string, config?: any[]) => void;
    onCancel: () => void;
    prayerTimes?: any;
    initialBlocks?: PlacedBlock[];
}

interface PlacedBlock {
    id: string;
    html: string;
    width: number;
    height: number;
    scale: number;
    align: 'right' | 'center' | 'left';
    offsetX: number;
    offsetY: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
    templateName: string;
}

const SmartFormRenderer: React.FC<SmartFormRendererProps> = ({ template: initialTemplate, onConfirm, onCancel, prayerTimes, initialBlocks }) => {
    const [activeTemplate, setActiveTemplate] = useState<Template>(initialTemplate);
    const [blocks, setBlocks] = useState<PlacedBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [showStackSelector, setShowStackSelector] = useState(false);
    const [isFullPageMode, setIsFullPageMode] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Layout Controls
    const [scale, setScale] = useState(1.0);
    const [widthPercent, setWidthPercent] = useState(100);
    const [blockHeight, setBlockHeight] = useState(0);
    const [alignment, setAlignment] = useState<'right' | 'center' | 'left'>('center');
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [borderWidth, setBorderWidth] = useState(0);
    const [borderColor, setBorderColor] = useState('#e5e7eb');
    const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'dashed' | 'dotted' | 'double'>('solid');

    const [generatedPreview, setGeneratedPreview] = useState<string>('');
    const previewRef = useRef<HTMLDivElement>(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const fields = typeof activeTemplate.content === 'string' ? [] : activeTemplate.content.fields;

    const subtractTime = (timeStr: string, minutesToSubtract: number) => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            date.setMinutes(date.getMinutes() - minutesToSubtract);
            return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        } catch (e) { return timeStr; }
    };

    useEffect(() => {
        const initialData: any = {};
        fields.forEach(f => {
            if (f.defaultValue !== undefined) initialData[f.id] = f.defaultValue;
        });

        if (prayerTimes) {
            fields.forEach(f => {
                const id = f.id.toLowerCase();
                if (id.includes('suhoor')) initialData[f.id] = subtractTime(prayerTimes.Fajr, 60);
                else if (id.includes('iftar')) initialData[f.id] = prayerTimes.Maghrib;
                else if (id.includes('sunrise')) initialData[f.id] = prayerTimes.Sunrise;
                else if (id.includes('fajr') && f.type !== 'checkbox') initialData[f.id] = prayerTimes.Fajr;
                else if (id.includes('dhuhr') && f.type !== 'checkbox') initialData[f.id] = prayerTimes.Dhuhr;
                else if (id.includes('asr') && f.type !== 'checkbox') initialData[f.id] = prayerTimes.Asr;
                else if (id.includes('maghrib') && f.type !== 'checkbox') initialData[f.id] = prayerTimes.Maghrib;
                else if (id.includes('isha') && f.type !== 'checkbox') initialData[f.id] = prayerTimes.Isha;
            });
        }
        setFormData(initialData);

        if (initialBlocks && initialBlocks.length > 0) {
            setBlocks(initialBlocks);
        } else if (!selectedBlockId) {
            setScale(1.0); setWidthPercent(100); setBlockHeight(0); setAlignment('center');
            setOffsetX(0); setOffsetY(0); setBorderWidth(0); setBorderColor('#e5e7eb'); setBorderStyle('solid');
        }
    }, [activeTemplate, prayerTimes, initialBlocks]);

    useEffect(() => {
        if (typeof activeTemplate.content !== 'string' && activeTemplate.type === 'smart-json') {
            const rawHtml = generateSmartHtml(activeTemplate, formData);
            setGeneratedPreview(rawHtml);
            if (selectedBlockId) {
                setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, html: rawHtml } : b));
            }
        }
    }, [formData, activeTemplate]);

    useEffect(() => {
        if (selectedBlockId) {
            setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
                ...b, width: widthPercent, height: blockHeight, scale: scale, align: alignment,
                offsetX: offsetX, offsetY: offsetY, borderWidth: borderWidth, borderColor: borderColor, borderStyle: borderStyle
            } : b));
        }
    }, [widthPercent, blockHeight, scale, alignment, offsetX, offsetY, borderWidth, borderColor, borderStyle]);

    const handleChange = (id: string, value: any) => {
        const newData = { ...formData, [id]: value };
        fields.filter(f => f.type === 'calculation' && f.formula).forEach(calcField => {
            try {
                let formula = calcField.formula || '';
                fields.forEach(field => {
                    const val = newData[field.id] || 0;
                    formula = formula.replace(new RegExp(`{${field.id}}`, 'g'), String(val));
                });
                const result = new Function('return ' + formula)();
                newData[calcField.id] = parseFloat(result.toFixed(2));
            } catch (e) { /* ignore */ }
        });
        setFormData(newData);
    };

    const handleTemplateSelect = (newTemp: Template | null) => {
        if (newTemp) { setSelectedBlockId(null); setActiveTemplate(newTemp); }
        setShowStackSelector(false);
    };

    const addCurrentBlock = () => {
        if (selectedBlockId) { setSelectedBlockId(null); setFormData({}); return; }
        const currentHtmlContent = previewRef.current ? previewRef.current.innerHTML : generatedPreview;
        const newBlock: PlacedBlock = {
            id: Date.now().toString(), html: currentHtmlContent, width: widthPercent, height: blockHeight, scale: scale,
            align: alignment, offsetX: offsetX, offsetY: offsetY, borderWidth: borderWidth, borderColor: borderColor, borderStyle: borderStyle, templateName: activeTemplate.name
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const handleBlockClick = (block: PlacedBlock) => {
        setSelectedBlockId(block.id);
        setWidthPercent(block.width); setBlockHeight(block.height); setScale(block.scale);
        setAlignment(block.align); setOffsetX(block.offsetX); setOffsetY(block.offsetY);
        setBorderWidth(block.borderWidth); setBorderColor(block.borderColor); setBorderStyle(block.borderStyle);
    };

    const deleteBlock = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const onDragStart = (e: React.DragEvent, index: number) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        const newBlocks = [...blocks];
        const draggedItem = newBlocks[draggedItemIndex];
        newBlocks.splice(draggedItemIndex, 1);
        newBlocks.splice(index, 0, draggedItem);
        setBlocks(newBlocks);
        setDraggedItemIndex(index);
    };
    const onDragEnd = () => { setDraggedItemIndex(null); };

    const handleFinalGenerate = () => {
        let finalBlocks = [...blocks];
        if (!selectedBlockId && generatedPreview) {
            const currentHtmlContent = previewRef.current ? previewRef.current.innerHTML : generatedPreview;
            finalBlocks.push({
                id: 'final-pending', html: currentHtmlContent, width: widthPercent, height: blockHeight, scale: scale, align: alignment,
                offsetX: offsetX, offsetY: offsetY, borderWidth: borderWidth, borderColor: borderColor, borderStyle: borderStyle, templateName: activeTemplate.name
            });
        }
        const configString = encodeURIComponent(JSON.stringify(finalBlocks));
        // Generate just the inner content for the node attribute
        let innerHtml = '';
        finalBlocks.forEach(b => {
            let marginLeft = b.align === 'right' ? 'auto' : '0';
            let marginRight = b.align === 'left' ? 'auto' : '0';
            if (b.align === 'center') { marginLeft = 'auto'; marginRight = 'auto'; }
            const borderCSS = b.borderWidth > 0 ? `border: ${b.borderWidth}px ${b.borderStyle} ${b.borderColor}; border-radius: 8px;` : '';
            const heightCSS = b.height > 0 ? `height: ${b.height}px; overflow: hidden;` : '';
            innerHtml += `<div class="smart-block-item" style="box-sizing: border-box; width: ${b.width}%; min-width: 200px; flex-basis: ${b.width}%; padding: 5px; transform: translate(${b.offsetX}%, ${b.offsetY}px); font-size: ${b.scale}em; position: relative; z-index: 1; ${heightCSS}"><div style="margin-left: ${marginLeft}; margin-right: ${marginRight}; width: fit-content; max-width: 100%; ${borderCSS} padding: ${b.borderWidth > 0 ? '10px' : '0'}; height: 100%;">${b.html}</div></div>`;
        });

        // We still generate the full HTML string for potential fallback or other uses, 
        // but passing config separately is the main fix.
        // Actually, let's pass the innerHtml as the primary content, NoteEditor will wrap it.
        onConfirm(innerHtml, finalBlocks);
    };

    const handleAutoFit = () => { setScale(1.0); setBlockHeight(0); setWidthPercent(100); setOffsetX(0); setOffsetY(0); };

    return (
        <div className={`fixed inset-0 z-[100] bg-gray-100 flex items-center justify-center p-4 font-tajawal transition-all duration-300 ${isFullPageMode ? 'bg-gray-800' : 'bg-black/60 backdrop-blur-sm'}`}>
            <div className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 ${isFullPageMode ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh] max-h-[800px]'}`} style={{ maxHeight: isFullPageMode ? '100vh' : 'calc(100vh - 40px)' }}>

                <div className={`p-3 border-b border-gray-100 flex flex-col items-center bg-white shrink-0 z-20 ${isFullPageMode ? 'hidden' : 'flex'}`}>
                    <div className="w-full flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100"><activeTemplate.icon size={24} /></div>
                            <div><h3 className="font-bold text-lg text-gray-800">{activeTemplate.name}</h3></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsFullPageMode(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold text-xs"><Monitor size={16} /> معاينة حية</button>
                            <button onClick={onCancel} className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-4 pr-2 border-l border-gray-300">
                            <div className="flex flex-col w-16"><div className="flex justify-between text-[9px] text-gray-500 font-bold mb-1"><span>حجم</span> <span>{Math.round(scale * 100)}%</span></div><input type="range" min="0.5" max="2.0" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-blue-600" /></div>
                            <div className="flex flex-col w-16"><div className="flex justify-between text-[9px] text-gray-500 font-bold mb-1"><span>عرض</span> <span>{widthPercent}%</span></div><input type="range" min="20" max="100" step="5" value={widthPercent} onChange={(e) => setWidthPercent(parseInt(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-purple-600" /></div>
                            <div className="flex flex-col w-16"><div className="flex justify-between text-[9px] text-gray-500 font-bold mb-1"><span>ارتفاع</span> <span>{blockHeight > 0 ? blockHeight : 'Auto'}</span></div><input type="range" min="0" max="1000" step="10" value={blockHeight} onChange={(e) => setBlockHeight(parseInt(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-teal-600" /></div>
                            <button onClick={handleAutoFit} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-gray-200 hover:bg-yellow-50 hover:text-yellow-600 transition-all shadow-sm group"><Wand2 size={16} className="mb-0.5 group-hover:scale-110 transition-transform" /><span className="text-[8px] font-bold">تلقائي</span></button>
                        </div>
                        <div className="flex items-center gap-4 pr-2 border-l border-gray-300">
                            <div className="flex flex-col w-20"><div className="flex justify-between text-[9px] text-gray-500 font-bold mb-1"><span className="flex items-center gap-1"><MoveHorizontal size={10} /> أفقي</span> <span>{offsetX}</span></div><input type="range" min="-50" max="50" step="1" value={offsetX} onChange={(e) => setOffsetX(parseInt(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-green-600" /></div>
                            <div className="flex flex-col w-20"><div className="flex justify-between text-[9px] text-gray-500 font-bold mb-1"><span className="flex items-center gap-1"><MoveVertical size={10} /> عمودي</span> <span>{offsetY}</span></div><input type="range" min="-200" max="200" step="5" value={offsetY} onChange={(e) => setOffsetY(parseInt(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-orange-600" /></div>
                        </div>
                        <div className="flex flex-col gap-1 pr-2 border-l border-gray-300">
                            <div className="flex items-center justify-between text-[9px] font-bold text-gray-500"><span className="flex items-center gap-1"><Square size={10} /> الإطار</span><input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-4 h-4 p-0 border-0 rounded cursor-pointer" /></div>
                            <div className="flex items-center gap-2"><div className="flex items-center bg-white border border-gray-200 rounded-lg px-1 h-7"><input type="number" min="0" max="20" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))} className="w-8 text-xs text-center outline-none font-bold text-gray-700" /><span className="text-[9px] text-gray-400 border-r border-gray-100 pr-1 mr-1">px</span></div><select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value as any)} className="h-7 text-xs border border-gray-200 rounded-lg bg-white px-1 outline-none text-gray-600"><option value="solid">متصل</option><option value="dashed">متقطع</option><option value="dotted">منقط</option><option value="double">مزدوج</option></select></div>
                        </div>
                        <div className="flex gap-1 bg-white p-1 rounded-lg border shadow-sm">
                            <button onClick={() => setAlignment('right')} className={`p-1 rounded ${alignment === 'right' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}><AlignRight size={16} /></button>
                            <button onClick={() => setAlignment('center')} className={`p-1 rounded ${alignment === 'center' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}><AlignCenter size={16} /></button>
                            <button onClick={() => setAlignment('left')} className={`p-1 rounded ${alignment === 'left' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}><AlignLeft size={16} /></button>
                        </div>
                    </div>
                </div>

                {isFullPageMode && (<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-gray-900/80 backdrop-blur text-white px-6 py-2 rounded-full shadow-xl"><span className="font-bold text-sm">معاينة الصفحة الكاملة (A4)</span><button onClick={() => setIsFullPageMode(false)} className="text-red-300 hover:text-white font-bold text-sm underline">خروج</button></div>)}

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden bg-[#E5E7EB]">
                    {!selectedBlockId && !isFullPageMode && (
                        <div className="w-full md:w-[300px] border-l border-gray-200 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white shrink-0 shadow-sm z-10">
                            <div className="flex justify-between items-center mb-2"><h4 className="text-sm font-bold text-gray-700">تعبئة البيانات</h4><button onClick={() => setShowStackSelector(true)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">تغيير</button></div>
                            {prayerTimes && <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-[10px] text-green-700 font-bold mb-2 flex items-center gap-2"><Sunrise size={12} /> <span>تم ملء أوقات الصلاة تلقائياً</span></div>}
                            {fields.map((field) => (
                                <div key={field.id} className="animate-in slide-in-from-left-4 duration-500">
                                    {field.type === 'header' ? <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-1 mt-4 mb-2">{field.label}</h4> : (
                                        <div className="space-y-1">
                                            {field.type !== 'checkbox' && <label className="text-[11px] font-bold text-gray-500">{field.label}</label>}
                                            {field.type === 'text' && <input type="text" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={formData[field.id] || ''} onChange={e => handleChange(field.id, e.target.value)} placeholder={field.placeholder} />}
                                            {field.type === 'textarea' && <textarea className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm h-16 resize-none focus:border-blue-500 outline-none" value={formData[field.id] || ''} onChange={e => handleChange(field.id, e.target.value)} placeholder={field.placeholder} />}
                                            {(field.type === 'number' || field.type === 'calculation') && <input type="number" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={formData[field.id] || ''} onChange={e => handleChange(field.id, e.target.value)} disabled={field.type === 'calculation'} placeholder="0" />}
                                            {(field.type === 'date' || field.type === 'time') && <input type={field.type} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={formData[field.id] || ''} onChange={e => handleChange(field.id, e.target.value)} />}
                                            {field.type === 'counter' && <div className="flex items-center gap-2"><button onClick={() => handleChange(field.id, Math.max(field.min || 0, (formData[field.id] || 0) - 1))} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Minus size={14} /></button><input type="number" className="flex-grow p-2 text-center font-bold bg-white border rounded-lg" value={formData[field.id] || 0} onChange={(e) => handleChange(field.id, parseInt(e.target.value))} /><button onClick={() => handleChange(field.id, (formData[field.id] || 0) + 1)} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Plus size={14} /></button></div>}
                                            {field.type === 'step_tracker' && <div className="flex flex-col gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100"><div className="flex items-center justify-between text-orange-700"><Footprints size={18} /><span className="font-bold text-lg">{formData[field.id] || 0}</span></div><input type="range" min={field.min || 0} max={field.max || 10000} value={formData[field.id] || 0} onChange={(e) => handleChange(field.id, parseInt(e.target.value))} className="w-full accent-orange-500" /></div>}
                                            {field.type === 'rating' && <div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => handleChange(field.id, s)} className={`text-lg transition-transform hover:scale-110 ${formData[field.id] >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>)}</div>}
                                            {field.type === 'checkbox' && <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"><input type="checkbox" checked={!!formData[field.id]} onChange={e => handleChange(field.id, e.target.checked)} className="accent-blue-600 w-4 h-4" /><span className="text-sm font-bold text-gray-700">{field.label}</span></label>}
                                            {field.type === 'select' && <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={formData[field.id] || ''} onChange={e => handleChange(field.id, e.target.value)}><option value="">اختر...</option>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="pt-4 border-t mt-4"><button onClick={addCurrentBlock} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={18} /> إضافة للمعاينه</button></div>
                        </div>
                    )}

                    <div className="flex-grow flex flex-col relative h-full overflow-hidden items-center justify-center" onClick={() => setSelectedBlockId(null)}>
                        {!isFullPageMode && <div className="w-full p-2 text-center text-xs text-gray-500 bg-white/50 backdrop-blur-sm z-10 border-b absolute top-0">مساحة المعاينة (اسحب العناصر لإعادة الترتيب، أو اضغط عليها لتعديل حجمها)</div>}
                        <div className={`flex-grow overflow-y-auto custom-scrollbar w-full flex justify-center ${isFullPageMode ? 'p-0' : 'p-8'}`}>
                            <div className={`bg-white shadow-2xl transition-all duration-300 relative flex flex-wrap content-start items-start ${isFullPageMode ? 'w-full min-h-screen p-10 pb-40 overflow-y-visible' : 'w-[210mm] min-h-[297mm] p-[10mm]'}`} style={{ direction: 'rtl', minHeight: isFullPageMode ? '100vh' : '297mm' }}>
                                {blocks.map((block, index) => (
                                    <div key={block.id} draggable={!isFullPageMode} onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDragEnd={onDragEnd} onClick={(e) => { if (!isFullPageMode) { e.stopPropagation(); handleBlockClick(block); } }}
                                        className={`relative group transition-all duration-200 ease-out cursor-pointer ${!isFullPageMode && selectedBlockId === block.id ? 'ring-2 ring-blue-500 z-20' : ''} ${!isFullPageMode && draggedItemIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                        style={{ width: `${block.width}%`, flexBasis: `${block.width}%`, height: block.height > 0 ? `${block.height}px` : 'auto', overflow: block.height > 0 ? 'hidden' : 'visible', padding: '5px', boxSizing: 'border-box', transform: `translate(${block.offsetX}%, ${block.offsetY}px)`, zIndex: 1 }}>
                                        {!isFullPageMode && <div className={`absolute -top-3 -right-3 flex gap-1 z-30 ${selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}><div className="p-1 bg-gray-900 text-white rounded cursor-grab active:cursor-grabbing"><GripVertical size={14} /></div><button onClick={(e) => deleteBlock(e, block.id)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={14} /></button></div>}
                                        <div style={{ fontSize: `${block.scale}em`, marginLeft: block.align === 'right' ? 'auto' : '0', marginRight: block.align === 'left' ? 'auto' : '0', width: 'fit-content', maxWidth: '100%', transition: 'all 0.2s ease', border: block.borderWidth > 0 ? `${block.borderWidth}px ${block.borderStyle} ${block.borderColor}` : 'none', borderRadius: block.borderWidth > 0 ? '8px' : '0', padding: block.borderWidth > 0 ? '10px' : '0' }}>
                                            <div className="overflow-hidden pointer-events-none" dangerouslySetInnerHTML={{ __html: block.html }} />
                                        </div>
                                    </div>
                                ))}
                                {!selectedBlockId && generatedPreview && !isFullPageMode && (
                                    <div className="transition-all duration-300 ease-out origin-top opacity-80 grayscale-[0.3]" style={{ width: `${widthPercent}%`, flexBasis: `${widthPercent}%`, height: blockHeight > 0 ? `${blockHeight}px` : 'auto', padding: '5px', boxSizing: 'border-box', transform: `translate(${offsetX}%, ${offsetY}px)`, overflow: blockHeight > 0 ? 'hidden' : 'visible' }}>
                                        <div className="border-2 border-dashed border-green-400 bg-green-50/30 rounded-lg p-2 relative h-full">
                                            <div className="absolute -top-3 right-0 bg-green-500 text-white text-[10px] px-2 rounded-full">معاينة الحالية</div>
                                            <div ref={previewRef} style={{ fontSize: `${scale}em`, marginLeft: alignment === 'left' ? '0' : 'auto', marginRight: alignment === 'right' ? '0' : 'auto', width: 'fit-content', maxWidth: '100%', border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none', borderRadius: borderWidth > 0 ? '8px' : '0', padding: borderWidth > 0 ? '10px' : '0' }}>
                                                <div className="outline-none overflow-hidden" dangerouslySetInnerHTML={{ __html: generatedPreview }} style={{ direction: 'rtl', textAlign: 'right' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-4 border-t border-gray-100 bg-white z-10 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 transition-all duration-300 ${isFullPageMode ? 'fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-[120] px-6 py-4' : 'opacity-100'}`}>
                    <div className="flex gap-3 w-full md:w-auto md:mr-auto">
                        <button onClick={isFullPageMode ? () => setIsFullPageMode(false) : onCancel} className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-bold w-full md:w-auto">
                            {isFullPageMode ? 'رجوع للتعديل' : 'إلغاء'}
                        </button>
                        <button
                            onClick={handleFinalGenerate}
                            className="px-8 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all active:scale-95 font-bold flex items-center justify-center gap-2 w-full md:w-auto"
                        >
                            <Check size={18} />
                            {blocks.length > 0
                                ? `إدراج ${blocks.length} عناصر`
                                : (!selectedBlockId && generatedPreview) ? 'إدراج العنصر الحالي' : 'موافق وإدراج'
                            }
                        </button>
                    </div>
                </div>
            </div>
            {showStackSelector && (<div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"><TemplateSelector onSelect={handleTemplateSelect} onClose={() => setShowStackSelector(false)} /></div>)}
        </div>
    );
};

export default SmartFormRenderer;
