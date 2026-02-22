import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
    Type,
    Palette,
    Clock,
    ChevronDown,
    Minus,
    Plus,
    LayoutTemplate,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Highlighter,
    List,
    ListOrdered,
    Download,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Check,
    FolderOpen,
    PaintBucket,
    Eraser,
    Mic,
    MicOff,
    Save,
    Activity,
    Square,
    Maximize,
    Minimize,
    ZoomIn,
    ZoomOut,
    Search,
    FilePlus,
    ArrowRight,
    X
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
    editor: Editor | null;
    onOpenTemplates?: () => void;
    onExport?: (type: 'image' | 'pdf' | 'word' | 'text') => void;
    onClose?: () => void;

    // External Controls Integration
    folderId?: string | null;
    onFolderChange?: (id: string | null) => void;
    folders?: any[];
    backgroundColor?: string;
    onBackgroundColorChange?: (color: string) => void;

    // Voice Recording Integration
    isRecording?: boolean;
    onRecordingClick?: () => void;
    voiceTranscript?: string;
    toolbarPosition?: 'top' | 'bottom';

    // Tracker Integration
    onInsertTracker?: () => void;

    // Zoom Integration
    zoom?: number;
    onZoomChange?: (newZoom: number) => void;
    onSearchClick?: () => void;

    // Focus Mode Integration
    isFocusMode?: boolean;
    onToggleFocusMode?: () => void;

    isMobile?: boolean;
}

const fontFamilies = [
    { name: 'Default', value: 'Inter', category: 'Global' },
    // Modern Fonts
    { name: 'Cairo', value: 'Cairo', category: 'عصرية' },
    { name: 'Tajawal', value: 'Tajawal', category: 'عصرية' },
    { name: 'Almarai', value: 'Almarai', category: 'عصرية' },
    { name: 'Readex Pro', value: 'Readex Pro', category: 'عصرية' },
    // Classic Fonts
    { name: 'Amiri', value: 'Amiri', category: 'كلاسيكية' },
    { name: 'Noto Naskh', value: 'Noto Naskh Arabic', category: 'كلاسيكية' },
    { name: 'El Messiri', value: 'El Messiri', category: 'كلاسيكية' },
    { name: 'Lateef', value: 'Lateef', category: 'كلاسيكية' },
    { name: 'Scheherazade', value: 'Scheherazade New', category: 'كلاسيكية' },
    { name: 'Harmattan', value: 'Harmattan', category: 'كلاسيكية' },
    // Handwritten Fonts
    { name: 'Aref Ruqaa', value: 'Aref Ruqaa', category: 'يدوية' },
    { name: 'Kalam', value: 'Kalam', category: 'يدوية' },
    { name: 'Caveat', value: 'Caveat', category: 'يدوية' },
    // Standard System Fonts
    { name: 'Arial', value: 'Arial', category: 'النظام' },
    { name: 'Courier New', value: 'Courier New', category: 'النظام' },
    { name: 'Times New Roman', value: 'Times New Roman', category: 'النظام' },
];

const colors = [
    '#000000', '#4B5563', '#DC2626', '#EA580C', '#D97706',
    '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#ffffff'
];

const highlights = [
    'transparent', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#FEE2E2', '#F3E8FF'
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    onOpenTemplates,
    onExport,
    folderId,
    onFolderChange,
    folders = [],
    backgroundColor,
    onBackgroundColorChange,
    isRecording,
    onRecordingClick,

    onInsertTracker,
    zoom = 100,
    onZoomChange,
    isFocusMode = false,
    onToggleFocusMode,
    isMobile = false,
    onClose,
    onSearchClick
}) => {
    if (!editor) return null;

    const addTimeSeparator = () => {
        const now = new Date();
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const day = now.getDate();
        const month = months[now.getMonth()];
        const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

        const dateString = `${day} de ${month}`;

        editor.chain().focus()
            .setHorizontalRule()
            .insertContent(`<p style="text-align: center; direction: ltr; unicode-bidi: embed; color: #9CA3AF; font-size: 0.85em; margin-top: -1em; background: white; width: fit-content; margin-left: auto; margin-right: auto; padding: 0 10px;">${dateString} ${time}</p>`)
            .enter()
            .run();
    };

    const GroupFORMATTING = (
        <>
            {/* Folder Selection */}
            {onFolderChange && (
                <>
                    <div className={cn("flex items-center", isMobile ? "max-w-[70px]" : "min-w-[100px] max-w-[140px]")}>
                        <Select value={folderId || 'none'} onValueChange={(val) => onFolderChange(val === 'none' ? null : val)}>
                            <SelectTrigger className={cn(
                                "h-8 sm:h-8 bg-gray-50 border-0 shadow-none hover:bg-gray-100 focus:ring-0 px-1.5 rounded-lg",
                                isMobile ? "text-[9px]" : "text-[10px] sm:text-xs"
                            )}>
                                <FolderOpen className={cn("text-gray-500", isMobile ? "w-2.5 h-2.5 ml-0.5" : "w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1")} />
                                <SelectValue placeholder="المجلد" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="none">عام</SelectItem>
                                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

            {/* Font Family */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors font-medium text-xs sm:text-sm">
                                <span className="max-w-[70px] truncate">
                                    {fontFamilies.find(f => editor.isActive('textStyle', { fontFamily: f.value }))?.name || 'الخط'}
                                </span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-1 rounded-xl shadow-xl border-gray-100" align="start">
                            <div className="flex flex-col gap-0.5 max-h-[350px] overflow-y-auto barakah-scrollbar">
                                {['عصرية', 'كلاسيكية', 'يدوية', 'النظام', 'Global'].map((category) => {
                                    const categoryFonts = fontFamilies.filter(f => f.category === category);
                                    if (categoryFonts.length === 0) return null;

                                    return (
                                        <div key={category} className="mb-2 last:mb-0">
                                            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 mb-1">
                                                {category}
                                            </div>
                                            {categoryFonts.map((font) => (
                                                <button
                                                    key={font.value}
                                                    onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                                                    className={`
                                                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                                        ${editor.isActive('textStyle', { fontFamily: font.value })
                                                            ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                            : 'hover:bg-gray-50 text-gray-700'}
                                                    `}
                                                    style={{ fontFamily: font.value }}
                                                >
                                                    <span>{font.name}</span>
                                                    <span className="text-gray-400 text-xs opacity-60 ml-2 whitespace-nowrap hidden sm:inline-block">أبجد هوز</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>نوع الخط</TooltipContent>
            </Tooltip>

            {/* Font Size */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors font-medium text-xs sm:text-sm">
                                <Type className="w-3.5 h-3.5" />
                                <span className="min-w-[18px] text-center">
                                    {editor.getAttributes('textStyle').fontSize?.replace('px', '') || '16'}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-16 p-1 rounded-xl shadow-xl border-gray-100 max-h-[200px] overflow-y-auto barakah-scrollbar">
                            <div className="flex flex-col gap-0.5" dir="rtl">
                                {Array.from({ length: 21 }, (_, i) => 10 + i).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: `${size}` }).run()}
                                        className={`
                                            flex items-center justify-center px-1 py-1.5 rounded-md text-sm transition-colors
                                            ${editor.getAttributes('textStyle').fontSize === `${size}`
                                                ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                : 'hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>حجم الخط</TooltipContent>
            </Tooltip>

            {/* Text Color */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative group">
                                <Palette className="w-4 h-4 text-gray-600" />
                                <div
                                    className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full"
                                    style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                                />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl border-gray-100">
                            <div className="grid grid-cols-6 gap-2">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => editor.chain().focus().setColor(color).run()}
                                        className={`w-7 h-7 rounded-full border hover:scale-110 transition-transform ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-gray-200'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <button onClick={() => editor.chain().focus().unsetColor().run()} className="w-full mt-2 text-xs text-gray-500 hover:text-red-500">إزالة اللون</button>
                        </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>لون النص</TooltipContent>
            </Tooltip>

            {/* Highlight */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative">
                                <Highlighter className="w-4 h-4 text-gray-600" />
                                <div
                                    className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full opacity-50"
                                    style={{ backgroundColor: editor.getAttributes('highlight').color || 'transparent' }}
                                />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 rounded-xl shadow-xl border-gray-100">
                            <div className="grid grid-cols-4 gap-2">
                                {highlights.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => color === 'transparent' ? editor.chain().focus().unsetHighlight().run() : editor.chain().focus().toggleHighlight({ color }).run()}
                                        className={`w-8 h-8 rounded-md border flex items-center justify-center ${editor.isActive('highlight', { color }) ? 'ring-2 ring-blue-500' : 'border-gray-100'}`}
                                        style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                                    >
                                        {color === 'transparent' && <div className="w-full h-px bg-red-500 rotate-45" />}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>تمييز النص</TooltipContent>
            </Tooltip>

            {/* Background Color Picker */}
            {onBackgroundColorChange && (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 transition-colors mx-1">
                                <PaintBucket className="w-4 h-4 text-gray-600" />
                                <Input
                                    type="color"
                                    value={backgroundColor || '#ffffff'}
                                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div
                                    className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full border border-gray-100"
                                    style={{ backgroundColor: backgroundColor || '#ffffff' }}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5}>لون خلفية الصفحة</TooltipContent>
                    </Tooltip>
                </>
            )}
        </>
    );

    const GroupTOOLS = (
        <>
            {/* Alignment Group (Grouped into Popover) */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
                        {editor.isActive({ textAlign: 'center' }) ? <AlignCenter className="w-4 h-4 text-indigo-600" /> :
                            editor.isActive({ textAlign: 'right' }) ? <AlignRight className="w-4 h-4 text-indigo-600" /> :
                                editor.isActive({ textAlign: 'justify' }) ? <AlignJustify className="w-4 h-4 text-indigo-600" /> :
                                    <AlignLeft className="w-4 h-4" />}
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1 flex bg-gray-50 rounded-lg shadow-xl border-gray-100" align="start">
                    <div className="flex bg-white rounded-md p-0.5 border border-gray-100">
                        <Tooltip>
                            <TooltipTrigger asChild><button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}><AlignLeft className="w-4 h-4" /></button></TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={5}>محاذاة لليسار</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}><AlignCenter className="w-4 h-4" /></button></TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={5}>توسيط</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}><AlignRight className="w-4 h-4" /></button></TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={5}>محاذاة لليمين</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded-md ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-500'}`}><AlignJustify className="w-4 h-4" /></button></TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={5}>ضبط النص (Justify)</TooltipContent>
                        </Tooltip>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

            {/* Lists Dropdown */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
                        {editor.isActive('orderedList') ? <ListOrdered className="w-4 h-4" /> : <List className="w-4 h-4" />}
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1 flex bg-gray-50 rounded-lg" align="start">
                    <Tooltip>
                        <TooltipTrigger asChild><button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}><List className="w-4 h-4" /></button></TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5}>قائمة نقطية</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}><ListOrdered className="w-4 h-4" /></button></TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5}>قائمة رقمية</TooltipContent>
                    </Tooltip>
                </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

            {/* Insertions */}
            <Tooltip>
                <TooltipTrigger asChild><button onClick={addTimeSeparator} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><Clock className="w-4 h-4" /></button></TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>إضافة فاصل زمني</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild><button onClick={onOpenTemplates} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><LayoutTemplate className="w-4 h-4" /></button></TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>القوالب الجاهزة</TooltipContent>
            </Tooltip>



            {/* Tracker Button */}
            {onInsertTracker && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button onClick={onInsertTracker} className="p-1.5 rounded-lg hover:bg-gray-100 text-indigo-600">
                            <Activity className="w-4 h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5}>إدراج متتبع</TooltipContent>
                </Tooltip>
            )}

            {/* Text Box Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => (editor as any).chain().focus().insertTextBox().run()}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>إدراج مربع نص</TooltipContent>
            </Tooltip>

            {/* New Page Button removed per user request */}
            <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

            {/* Mic & Export Actions */}
            <div className="flex items-center gap-1 mr-auto lg:mr-0">
                {onClose && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onClose}
                        className="h-11 md:h-9 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-600/20 text-white rounded-lg ms-1 shrink-0 shadow-sm transition-all shadow-emerald-500/20 hover:shadow-emerald-500/30 font-medium"
                    >
                        <Check className="w-4 h-4" />
                        <span className="text-xs md:text-sm pl-1">حفظ وإغلاق</span>
                    </Button>
                )}

                <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

                {onRecordingClick && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button onClick={onRecordingClick} className={`p-1.5 rounded-lg transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-600'}`}>
                                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5}>{isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}</TooltipContent>
                    </Tooltip>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                    {!isMobile && <span>تصدير</span>}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="end">
                                <button onClick={() => onExport?.('image')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">صورة</button>
                                <button onClick={() => onExport?.('pdf')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">PDF</button>
                                <button onClick={() => onExport?.('text')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">نص (Txt)</button>
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5}>تصدير الملاحظة</TooltipContent>
                </Tooltip>

                {onToggleFocusMode && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onToggleFocusMode}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    isFocusMode ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100 text-gray-600"
                                )}
                            >
                                {isFocusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5}>
                            {isFocusMode ? 'إنهاء وضع التركيز' : 'وضع التركيز'}
                        </TooltipContent>
                    </Tooltip>
                )}

                <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onSearchClick}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">البحث والاستبدال</TooltipContent>
                </Tooltip>

                <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                {/* Zoom Controls */}
                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onZoomChange?.(zoom - 10)}
                                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
                            >
                                <ZoomOut size={14} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">تصغير</TooltipContent>
                    </Tooltip>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="px-1.5 py-0.5 text-[10px] font-bold text-gray-600 hover:text-indigo-600 transition-colors">
                                {Math.round(zoom)}%
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-20 p-1" align="center">
                            <div className="flex flex-col gap-0.5">
                                {[130, 110, 100, 90, 80, 70, 50].map(z => (
                                    <button
                                        key={z}
                                        onClick={() => onZoomChange?.(z)}
                                        className={cn(
                                            "px-2 py-1 text-[10px] text-center rounded hover:bg-gray-100",
                                            zoom === z ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-600"
                                        )}
                                    >
                                        {z}%
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onZoomChange?.(zoom + 10)}
                                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
                            >
                                <ZoomIn size={14} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">تكبير</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </>
    );

    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn(
                "bg-white/95 backdrop-blur-md border-b shadow-sm sticky top-0 z-50 transition-all px-1",
                isMobile ? "pt-[max(12mm,env(safe-area-inset-top))]" : "pt-1"
            )}>
                {/* Unified Toolbar Flow - Always Horizontal Scroll on Mobile */}
                <div className={cn(
                    "flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 px-1 whitespace-nowrap",
                    isMobile ? "h-14" : "h-12"
                )}>
                    {GroupFORMATTING}
                    <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
                    {GroupTOOLS}
                </div>
            </div>
        </TooltipProvider >
    );
};
