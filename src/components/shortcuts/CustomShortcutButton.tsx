/**
 * CustomShortcutButton.tsx
 * Renders a custom shortcut button with:
 * - Long press support
 * - Visual feedback (scale animation)
 * - Conditional icon colors
 * - Dynamic icon from ICON_LIBRARY
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import type { CustomShortcut } from '@/types/shortcuts';
import {
    Star, Home, Heart, Settings, Calendar, Bell, Mail, Search, User, Camera,
    Clock, MapPin, Music, Globe, Bookmark, AlertCircle, CheckCircle, XCircle,
    Coffee, Car, Plane, Train, Briefcase, ShoppingCart, Gift, Utensils, Smile,
    Cloud, Sun, Moon, Umbrella, Wifi, Battery, Lock, Key, Eye, Edit, Save,
    Download, Upload, Share, Send, Copy, Clipboard, Printer, Folder, File,
    Image, Video, Mic, Volume2, Play, Pause, SkipForward, SkipBack, ChevronRight,
    ChevronLeft, ArrowUp, ArrowDown, RefreshCw, RotateCw, Maximize, Minimize,
    ZoomIn, ZoomOut, Filter, List, Grid, Layers, Box, Package, Target, Zap, Sparkles,
    Phone, Link, LucideIcon
} from 'lucide-react';

// Icon library mapping
const ICON_LIBRARY: Record<string, LucideIcon> = {
    'Home': Home, 'Star': Star, 'Heart': Heart, 'Settings': Settings, 'Calendar': Calendar,
    'Bell': Bell, 'Mail': Mail, 'Search': Search, 'User': User, 'Camera': Camera,
    'Clock': Clock, 'MapPin': MapPin, 'Music': Music, 'Globe': Globe, 'Bookmark': Bookmark,
    'AlertCircle': AlertCircle, 'CheckCircle': CheckCircle, 'XCircle': XCircle,
    'Coffee': Coffee, 'Car': Car, 'Plane': Plane, 'Train': Train, 'Briefcase': Briefcase,
    'ShoppingCart': ShoppingCart, 'Gift': Gift, 'Utensils': Utensils, 'Smile': Smile,
    'Cloud': Cloud, 'Sun': Sun, 'Moon': Moon, 'Umbrella': Umbrella, 'Wifi': Wifi,
    'Battery': Battery, 'Lock': Lock, 'Key': Key, 'Eye': Eye, 'Edit': Edit, 'Save': Save,
    'Download': Download, 'Upload': Upload, 'Share': Share, 'Send': Send, 'Copy': Copy,
    'Clipboard': Clipboard, 'Printer': Printer, 'Folder': Folder, 'File': File,
    'Image': Image, 'Video': Video, 'Mic': Mic, 'Volume2': Volume2, 'Play': Play,
    'Pause': Pause, 'SkipForward': SkipForward, 'SkipBack': SkipBack,
    'ChevronRight': ChevronRight, 'ChevronLeft': ChevronLeft, 'ArrowUp': ArrowUp,
    'ArrowDown': ArrowDown, 'RefreshCw': RefreshCw, 'RotateCw': RotateCw,
    'Maximize': Maximize, 'Minimize': Minimize, 'ZoomIn': ZoomIn, 'ZoomOut': ZoomOut,
    'Filter': Filter, 'List': List, 'Grid': Grid, 'Layers': Layers, 'Box': Box,
    'Package': Package, 'Target': Target, 'Zap': Zap, 'Sparkles': Sparkles,
    'Phone': Phone, 'Link': Link
};

// Color mapping
const COLOR_CLASSES: Record<string, string> = {
    'gray': 'text-gray-600 bg-gray-100',
    'red': 'text-red-600 bg-red-100',
    'orange': 'text-orange-600 bg-orange-100',
    'yellow': 'text-yellow-600 bg-yellow-100',
    'green': 'text-green-600 bg-green-100',
    'emerald': 'text-emerald-600 bg-emerald-100',
    'blue': 'text-blue-600 bg-blue-100',
    'purple': 'text-purple-600 bg-purple-100',
    'pink': 'text-pink-600 bg-pink-100',
};

interface CustomShortcutButtonProps {
    shortcut: CustomShortcut;
    onExecute: (shortcut: CustomShortcut, isLongPress: boolean) => void;
    onEdit?: (shortcut: CustomShortcut) => void;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const CustomShortcutButton: React.FC<CustomShortcutButtonProps> = ({
    shortcut,
    onExecute,
    onEdit,
    size = 'md',
    showLabel = true
}) => {
    // Get icon - null means no icon (text-only)
    const Icon = useMemo(() => {
        if (shortcut.custom_icon === 'none' || !shortcut.custom_icon) {
            return null;
        }
        return ICON_LIBRARY[shortcut.custom_icon] || null;
    }, [shortcut.custom_icon]);

    const colorClass = useMemo(() => {
        return COLOR_CLASSES[shortcut.icon_color || 'emerald'] || COLOR_CLASSES.emerald;
    }, [shortcut.icon_color]);

    const { isPressed, ...longPressHandlers } = useLongPress({
        onClick: () => onExecute(shortcut, false),
        onLongPress: () => onExecute(shortcut, true),
        ms: 500
    });

    const sizeClasses = {
        sm: 'w-12 h-12 rounded-xl',
        md: 'w-16 h-16 rounded-2xl',
        lg: 'w-20 h-20 rounded-3xl'
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-9 h-9'
    };

    const labelSizes = {
        sm: 'text-[9px]',
        md: 'text-[10px]',
        lg: 'text-xs'
    };

    // Badge for shortcut type
    const TypeBadge = () => {
        if (shortcut.shortcut_type === 'url') {
            return <Link className="w-2 h-2 absolute top-1 left-1 text-blue-500" />;
        }
        if (shortcut.shortcut_type === 'contact') {
            return <Phone className="w-2 h-2 absolute top-1 left-1 text-green-500" />;
        }
        if (shortcut.shortcut_type === 'macro') {
            return <Layers className="w-2 h-2 absolute top-1 left-1 text-purple-500" />;
        }
        return null;
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                {...longPressHandlers}
                onContextMenu={(e) => { e.preventDefault(); onEdit?.(shortcut); }}
                className={cn(
                    "relative flex items-center justify-center shadow-sm border transition-all duration-200 touch-none",
                    sizeClasses[size],
                    Icon ? colorClass : "bg-white border-gray-200",
                    isPressed && "scale-90 shadow-inner",
                    !isPressed && "hover:shadow-md hover:scale-105"
                )}
                title={`${shortcut.custom_name}\nضغط: ${shortcut.click_action_id || 'لا يوجد'}\nضغط مطول: ${shortcut.long_press_action_id || 'لا يوجد'}`}
            >
                {Icon ? (
                    <Icon className={cn(iconSizes[size], "stroke-[2.5]")} />
                ) : (
                    <span className={cn("font-bold text-gray-700 text-center", labelSizes[size])}>
                        {shortcut.custom_name.slice(0, 3)}
                    </span>
                )}
                <TypeBadge />
            </button>
            {showLabel && (
                <span className={cn(
                    "font-bold text-gray-700 text-center leading-tight line-clamp-1 max-w-full px-0.5",
                    labelSizes[size]
                )}>
                    {shortcut.custom_name}
                </span>
            )}
        </div>
    );
};

export default CustomShortcutButton;
