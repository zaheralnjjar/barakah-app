import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
    X,
    Circle,
    Triangle,
    Star,
    Zap,
    Smile,
    Hexagon,
    Cloud,
    Moon,
    Sun,
    Diamond,
    Heart,
    Bookmark,
    Settings,
    Home,
    User,
    Bell,
    Tag,
    MessageSquare,
    Leaf,
    Shapes,
    GraduationCap,
    Brush,
    FlaskConical,
    MapPin,
    Trophy,
    Coffee,
    Apple,
    Dog,
    Cat,
    TreePine,
    Mountain,
    Key,
    Trash2,
    Wrench,
    Hammer,
    Lightbulb,
    Bird,
    Fish,
    PawPrint,
    Flower2,
    Pizza,
    Sandwich,
    Dessert,
    CircleDashed,
    Library,
    Sigma,
    Music,
    Atom,
    Dna,
    Users,
    RotateCcw,
    Map,
    Infinity,
    Medal,
    Smartphone,
    Laptop,
    Tablet,
    Camera,
    Headphones,
    Gift,
    ShoppingCart,
    CreditCard,
    Backpack,
    Building,
    Hospital,
    School,
    Store,
    Castle,
    Dumbbell,
    Bike,
    Timer,
    Flame,
    Wind,
    Droplets,
    Anchor,
    Rocket,
    Telescope,
    Microscope,
    Tent,
    Umbrella,
    Sailboat
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
    onExport?: (type: 'image' | 'pdf' | 'word' | 'html' | 'text') => void;
    onClose?: () => void;
    onDiscard?: () => void;

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
    extraTools?: React.ReactNode;

    favColors?: string[];
    favFonts?: { name: string; value: string }[];
    favSizes?: number[];
    onToggleFavColor?: (color: string) => void;
    onToggleFavFont?: (font: { name: string; value: string }) => void;
    onToggleFavSize?: (size: number) => void;
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

const ThemeColGroups = [
    ['#43a047', '#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'],
    ['#8e24aa', '#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc'],
    ['#03a9f4', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6'],
    ['#1b5e20', '#d8e8d8', '#b1ccb1', '#89b189', '#629562', '#3a793a'],
    ['#f4511e', '#fbe9e7', '#ffccbc', '#ffab91', '#ff8a65', '#ff7043'],
    ['#006064', '#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#26c6da'],
    ['#0d47a1', '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5'],
    ['#e0e0e0', '#f5f5f5', '#eeeeee', '#bdbdbd', '#9e9e9e', '#757575'],
    ['#000000', '#757575', '#616161', '#424242', '#212121', '#000000'],
    ['#ffffff', '#ffffff', '#fafafa', '#f5f5f5', '#eeeeee', '#e0e0e0'],
];

const StandardColors = [
    '#7b1fa2', '#0d47a1', '#1976d2', '#03a9f4', '#00c853', '#8bc34a', '#ffeb3b', '#ffc107', '#f44336', '#d50000'
];

const AdvancedColorPicker = ({ onSelect, onUnset, currentColor, favColors = [], onToggleFav }: {
    onSelect: (color: string) => void;
    onUnset: () => void;
    currentColor: string;
    favColors?: string[];
    onToggleFav?: (color: string) => void;
}) => {
    const [highContrast, setHighContrast] = useState(false);
    const hiddenInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-4 p-2 w-72 dir-rtl">
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="contrast-toggle">
                        التباين العالي فقط
                    </Label>
                    <Checkbox
                        id="contrast-toggle"
                        checked={highContrast}
                        onCheckedChange={(checked) => setHighContrast(!!checked)}
                    />
                </div>
            </div>

            <button
                onClick={onUnset}
                className="w-full flex items-center justify-center h-9 border-2 border-purple-200 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 transition-colors"
            >
                بلا لون
            </button>

            <div>
                <h4 className="text-xs font-bold text-gray-500 mb-2 px-1">ألوان النسق</h4>
                <div className="flex gap-1.5">
                    {ThemeColGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="flex flex-col gap-1.5 shrink-0">
                            {/* Main row */}
                            <button
                                onClick={() => onSelect(group[0])}
                                className={cn(
                                    "w-5 h-5 rounded hover:scale-110 transition-transform border border-gray-100 relative group",
                                    currentColor === group[0] && "ring-2 ring-emerald-500 ring-offset-1"
                                )}
                                style={{ backgroundColor: group[0] }}
                            />
                            {onToggleFav && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleFav(group[0]); }}
                                    className={cn(
                                        "absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white shadow-sm flex items-center justify-center transition-all scale-0 group-hover:scale-100",
                                        favColors.includes(group[0]) ? "scale-100 text-rose-500 opacity-100" : "text-gray-300 opacity-0 group-hover:opacity-100"
                                    )}
                                >
                                    <Heart size={8} className={favColors.includes(group[0]) ? "fill-current" : ""} />
                                </button>
                            )}
                            {/* Shades */}
                            <div className="flex flex-col gap-1">
                                {group.slice(1).map((shade, shadeIdx) => (
                                    <button
                                        key={shadeIdx}
                                        onClick={() => onSelect(shade)}
                                        className={cn(
                                            "w-5 h-6 rounded-none hover:opacity-80 transition-opacity",
                                            currentColor === shade && "ring-1 ring-black ring-inset"
                                        )}
                                        style={{ backgroundColor: shade }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-gray-500 mb-2 px-1">ألوان قياسية</h4>
                <div className="flex flex-wrap gap-1.5 px-0.5">
                    {StandardColors.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(color)}
                            className={cn(
                                "w-5 h-5 rounded hover:scale-110 transition-transform border border-gray-100 relative group",
                                currentColor === color && "ring-2 ring-emerald-500 ring-offset-1"
                            )}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="pt-2 border-t">
                <button
                    onClick={() => hiddenInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 rounded-lg text-sm transition-colors text-gray-700"
                >
                    <Palette className="w-4 h-4 text-emerald-500" />
                    <span>مزيد من الألوان...</span>
                    <input
                        type="color"
                        ref={hiddenInputRef}
                        className="sr-only"
                        onChange={(e) => onSelect(e.target.value)}
                    />
                </button>
            </div>
        </div>
    );
};

const shapeCategories: { id: string; title: string; items: { type: string; icon: any }[] }[] = [
    {
        id: 'all',
        title: 'الكل',
        items: [] // Will be populated dynamically or I just list them.
    },
    {
        id: 'basic',
        title: 'تبويت الأشكال',
        items: [
            { type: 'rectangle', icon: Square },
            { type: 'rounded_rect', icon: Square },
            { type: 'circle', icon: Circle },
            { type: 'triangle', icon: Triangle },
            { type: 'right_triangle', icon: Triangle },
            { type: 'plus', icon: Plus },
            { type: 'cross', icon: Plus },
            { type: 'rhombus', icon: Diamond },
            { type: 'semicircle', icon: CircleDashed },
        ]
    },
    {
        id: 'geometry',
        title: 'هندسة',
        items: [
            { type: 'pentagon', icon: Hexagon },
            { type: 'hexagon', icon: Hexagon },
            { type: 'octagon', icon: Hexagon },
            { type: 'diamond', icon: Diamond },
            { type: 'trapezoid', icon: Square },
            { type: 'parallelogram', icon: Square },
        ]
    },
    {
        id: 'objects',
        title: 'عناصر',
        items: [
            { type: 'home', icon: Home },
            { type: 'gear', icon: Settings },
            { type: 'bell', icon: Bell },
            { type: 'tag', icon: Tag },
            { type: 'speech_bubble', icon: MessageSquare },
            { type: 'bookmark', icon: Bookmark },
            { type: 'key', icon: Key },
            { type: 'trash', icon: Trash2 },
            { type: 'clock', icon: Clock },
            { type: 'wrench', icon: Wrench },
            { type: 'hammer', icon: Hammer },
            { type: 'lightbulb', icon: Lightbulb },
            { type: 'smartphone', icon: Smartphone },
            { type: 'camera', icon: Camera },
            { type: 'gift', icon: Gift },
        ]
    },
    {
        id: 'nature',
        title: 'طبيعة وحيوانات',
        items: [
            { type: 'dog', icon: Dog },
            { type: 'cat', icon: Cat },
            { type: 'bird', icon: Bird },
            { type: 'fish', icon: Fish },
            { type: 'paw', icon: PawPrint },
            { type: 'cloud', icon: Cloud },
            { type: 'moon', icon: Moon },
            { type: 'sun', icon: Sun },
            { type: 'leaf', icon: Leaf },
            { type: 'tree', icon: TreePine },
            { type: 'flower', icon: Flower2 },
            { type: 'mountain', icon: Mountain },
            { type: 'lightning', icon: Zap },
            { type: 'heart', icon: Heart },
        ]
    },
    {
        id: 'food',
        title: 'طعام',
        items: [
            { type: 'coffee', icon: Coffee },
            { type: 'apple', icon: Apple },
            { type: 'pizza', icon: Pizza },
            { type: 'burger', icon: Sandwich },
            { type: 'ice_cream', icon: Dessert },
        ]
    },
    {
        id: 'symbols',
        title: 'رموز',
        items: [
            { type: 'star', icon: Star },
            { type: 'star_6', icon: Star },
            { type: 'smiley', icon: Smile },
            { type: 'infinity', icon: Infinity },
            { type: 'yin_yang', icon: CircleDashed },
        ]
    },
    {
        id: 'education',
        title: 'تعليم وعلوم',
        items: [
            { type: 'graduation_cap', icon: GraduationCap },
            { type: 'book', icon: Library },
            { type: 'pi', icon: Sigma },
            { type: 'flask', icon: FlaskConical },
            { type: 'atom', icon: Atom },
            { type: 'dna', icon: Dna },
        ]
    },
    {
        id: 'arts',
        title: 'فنون وأنشطة',
        items: [
            { type: 'palette', icon: Palette },
            { type: 'brush', icon: Brush },
            { type: 'music_note', icon: Music },
            { type: 'trophy', icon: Trophy },
            { type: 'medal', icon: Medal },
            { type: 'rocket', icon: Rocket },
        ]
    },
    {
        id: 'places',
        title: 'أماكن',
        items: [
            { type: 'person', icon: User },
            { type: 'users', icon: Users },
            { type: 'map_pin', icon: MapPin },
            { type: 'map', icon: Map },
            { type: 'building', icon: Building },
        ]
    },
    {
        id: 'arrows',
        title: 'أسهم',
        items: [
            { type: 'arrow_right', icon: ArrowRight },
            { type: 'arrow_left', icon: ArrowRight },
            { type: 'arrow_up', icon: ArrowRight },
            { type: 'arrow_down', icon: ArrowRight },
            { type: 'curve_arrow', icon: RotateCcw },
        ]
    }
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
    onDiscard,
    onSearchClick,
    extraTools,
    favColors,
    favFonts,
    favSizes,
    onToggleFavColor,
    onToggleFavFont,
    onToggleFavSize
}) => {
    const [selectedShapeCategory, setSelectedShapeCategory] = useState('all');
    const [shapeSearch, setShapeSearch] = useState('');

    const filteredShapes = selectedShapeCategory === 'all'
        ? Array.from(new Set(shapeCategories.filter(c => c.id !== 'all').flatMap(c => c.items).map(i => i.type)))
            .map(type => shapeCategories.flatMap(c => c.items).find(i => i.type === type)!)
            .filter(item => item.type.toLowerCase().includes(shapeSearch.toLowerCase()))
        : shapeCategories.find(c => c.id === selectedShapeCategory)?.items.filter(item =>
            item.type.toLowerCase().includes(shapeSearch.toLowerCase())
        ) || [];
    const [originalFont, setOriginalFont] = React.useState<string | null>(null);

    if (!editor) return null;

    // Get preview text from selection
    const { from, to } = editor.state.selection;
    const isSelectionActive = to > from;
    const selectedText = isSelectionActive ? editor.state.doc.textBetween(from, to, ' ') : '';
    const previewWords = selectedText.trim().split(/\s+/).slice(0, 2).join(' ');
    const previewText = previewWords || 'أبجد هوز';

    const handleFontHover = (fontValue: string) => {
        if (!isSelectionActive) return;

        // Save current font if not already saved
        if (originalFont === null) {
            setOriginalFont(editor.getAttributes('textStyle').fontFamily || '');
        }

        // Apply temporary font (without adding to history)
        editor.view.dispatch(
            editor.state.tr
                .addMark(from, to, editor.state.schema.marks.textStyle.create({ fontFamily: fontValue }))
                .setMeta('addToHistory', false)
        );
    };

    const handleFontLeave = () => {
        if (originalFont !== null) {
            // Restore original font (without adding to history)
            editor.view.dispatch(
                editor.state.tr
                    .addMark(from, to, editor.state.schema.marks.textStyle.create({ fontFamily: originalFont }))
                    .setMeta('addToHistory', false)
            );
            setOriginalFont(null);
        }
    };

    const applyFontPermanent = (fontValue: string) => {
        // Clear original font state so MouseLeave doesn't undo
        setOriginalFont(null);
        // Apply permanently
        editor.chain().focus().setFontFamily(fontValue).run();
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const src = e.target?.result as string;
                    editor.chain().focus().setImage({ src }).run();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

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
                                                    onClick={() => applyFontPermanent(font.value)}
                                                    onMouseEnter={() => handleFontHover(font.value)}
                                                    onMouseLeave={handleFontLeave}
                                                    className={`
                                                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors relative group/font
                                                        ${editor.isActive('textStyle', { fontFamily: font.value })
                                                            ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                            : 'hover:bg-gray-50 text-gray-700'}
                                                    `}
                                                    style={{ fontFamily: font.value }}
                                                >
                                                    <span>{font.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-xs opacity-60 whitespace-nowrap hidden sm:inline-block">
                                                            {previewText}
                                                        </span>
                                                        {onToggleFavFont && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onToggleFavFont(font); }}
                                                                className={cn(
                                                                    "p-1 rounded-md hover:bg-rose-50 transition-colors",
                                                                    favFonts?.find(f => f.value === font.value) ? "text-rose-500" : "text-gray-300 opacity-0 group-hover/font:opacity-100"
                                                                )}
                                                            >
                                                                <Heart size={12} className={favFonts?.find(f => f.value === font.value) ? "fill-current" : ""} />
                                                            </button>
                                                        )}
                                                    </div>
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
                                            flex items-center justify-center px-1 py-1.5 rounded-md text-sm transition-colors relative group
                                            ${editor.getAttributes('textStyle').fontSize === `${size}`
                                                ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                : 'hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        {size}
                                        {onToggleFavSize && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavSize(size); }}
                                                className={cn(
                                                    "absolute right-1 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100",
                                                    favSizes?.includes(size) ? "text-amber-500 opacity-100" : "text-gray-300 hover:text-amber-400"
                                                )}
                                            >
                                                <Heart size={10} className={favSizes?.includes(size) ? "fill-current" : ""} />
                                            </button>
                                        )}
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
                        <PopoverContent className="p-0 rounded-2xl shadow-xl border-gray-100 w-auto" align="center">
                            <AdvancedColorPicker
                                onSelect={(color) => editor.chain().focus().setColor(color).run()}
                                onUnset={() => editor.chain().focus().unsetColor().run()}
                                currentColor={editor.getAttributes('textStyle').color || '#000000'}
                                favColors={favColors}
                                onToggleFav={onToggleFavColor}
                            />
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
                        <PopoverContent className="p-0 rounded-2xl shadow-xl border-gray-100 w-auto" align="center">
                            <AdvancedColorPicker
                                onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                                onUnset={() => editor.chain().focus().unsetHighlight().run()}
                                currentColor={editor.getAttributes('highlight').color || 'transparent'}
                                favColors={favColors}
                                onToggleFav={onToggleFavColor}
                            />
                        </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>تمييز النص</TooltipContent>
            </Tooltip>

            {/* Background Color Picker */}
            {onBackgroundColorChange && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative">
                                    <PaintBucket className="w-4 h-4 text-gray-600" />
                                    <div
                                        className="absolute bottom-1 right-1 left-1 h-0.5 rounded-full border border-gray-100"
                                        style={{ backgroundColor: backgroundColor || '#ffffff' }}
                                    />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 rounded-2xl shadow-xl border-gray-100 w-auto" align="center">
                                <AdvancedColorPicker
                                    onSelect={(color) => onBackgroundColorChange(color)}
                                    onUnset={() => onBackgroundColorChange('#ffffff')}
                                    currentColor={backgroundColor || '#ffffff'}
                                />
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5}>لون خلفية الصفحة</TooltipContent>
                </Tooltip>
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
                <TooltipContent side="bottom" sideOffset={5}>القوالب</TooltipContent>
            </Tooltip>

            {/* Shapes Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="إدراج أشكال">
                        <Shapes className="w-4 h-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0 dir-rtl overflow-hidden bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl rounded-2xl" sideOffset={10}>
                    <div className="flex flex-col h-[400px]">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    className="w-full bg-gray-50 border-none rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 ring-indigo-100"
                                    placeholder="بحث عن شكل..."
                                    value={shapeSearch}
                                    onChange={(e) => setShapeSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Shape Grid */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="grid grid-cols-4 gap-3">
                                    {filteredShapes.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                const viewportWidth = window.innerWidth;
                                                const viewportHeight = window.innerHeight;
                                                // Random offset around center
                                                const offsetX = (Math.random() - 0.5) * 100;
                                                const offsetY = (Math.random() - 0.5) * 100;

                                                editor.chain().focus().insertContent({
                                                    type: 'shape',
                                                    attrs: {
                                                        type: item.type,
                                                        x: viewportWidth / 3 + offsetX,
                                                        y: 150 + offsetY, // Still relative to the page start but with offset
                                                        width: 200,
                                                        height: 200,
                                                        fill: '#6366f1',
                                                        stroke: '#4f46e5',
                                                        opacity: 0.8,
                                                        text: ''
                                                    }
                                                }).run();
                                            }}
                                            className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100"
                                        >
                                            <div className="w-10 h-10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                                <item.icon className={cn(
                                                    "w-6 h-6",
                                                    item.type === 'arrow_left' && "rotate-180",
                                                    item.type === 'arrow_up' && "-rotate-90",
                                                    item.type === 'arrow_down' && "rotate-90",
                                                    item.type === 'diamond' && "rotate-45"
                                                )} />
                                            </div>
                                            <span className="text-[9px] text-gray-400 capitalize group-hover:text-indigo-600 truncate w-full text-center">
                                                {item.type.replace('_', ' ')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar Categories */}
                            <div className="w-32 bg-gray-50/50 border-r border-gray-100 overflow-y-auto py-2 flex flex-col gap-0.5">
                                {shapeCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedShapeCategory(cat.id)}
                                        className={cn(
                                            "w-full text-right px-4 py-3 text-[11px] font-medium transition-all",
                                            selectedShapeCategory === cat.id
                                                ? "bg-white text-indigo-600 border-r-2 border-indigo-600 shadow-sm font-bold"
                                                : "text-gray-500 hover:bg-white/50"
                                        )}
                                    >
                                        {cat.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <Tooltip>
                <TooltipTrigger asChild><button onClick={handleImageUpload} className="p-1.5 rounded-lg hover:bg-gray-100 text-indigo-600"><ImageIcon className="w-4 h-4" /></button></TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>إدراج صورة</TooltipContent>
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
                    <div className="flex items-center gap-1">
                        {/* Save Button (Green) */}
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onClose}
                            className={cn(
                                "h-7 w-7 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600/20 text-white rounded-md ms-1 shrink-0 shadow-sm transition-all shadow-emerald-500/20 hover:shadow-emerald-500/30 p-0",
                                isMobile ? "rounded-full" : ""
                            )}
                            title="حفظ"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </Button>

                        {/* Discard/Close Button (Red) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDiscard || onClose}
                            className={cn(
                                "h-7 w-7 flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-md shrink-0 transition-all p-0",
                                isMobile ? "rounded-full" : ""
                            )}
                            title="إغلاق بدون حفظ"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
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
                                <button onClick={() => onExport?.('word')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">Word (.doc)</button>
                                <button onClick={() => onExport?.('html')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">صفحة HTML</button>
                                <button onClick={() => onExport?.('text')} className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 rounded-md">نص (Txt)</button>
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5}>تصدير الملاحظة</TooltipContent>
                </Tooltip>


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

                {extraTools}

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
