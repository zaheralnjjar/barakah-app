import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Inbox,
    User,
    Briefcase,
    FolderKanban,
    Archive,
    Star,
    Heart,
    Target,
    Zap,
    Coffee,
    Book,
    Layout
} from 'lucide-react';

export interface Bucket {
    id: string;
    user_id?: string;
    label: string;
    icon_name: string;
    color: string;
    bg_color: string;
    is_default?: boolean;
    created_at?: string;
}

const DEFAULT_BUCKETS: Bucket[] = [
    { id: 'inbox', label: 'الوارد', icon_name: 'Inbox', color: 'text-blue-500', bg_color: 'bg-blue-50', is_default: true },
    { id: 'personal', label: 'شخصي', icon_name: 'User', color: 'text-purple-500', bg_color: 'bg-purple-50', is_default: true },
    { id: 'work', label: 'عمل', icon_name: 'Briefcase', color: 'text-orange-500', bg_color: 'bg-orange-50', is_default: true },
    { id: 'projects', label: 'مشاريع', icon_name: 'FolderKanban', color: 'text-pink-500', bg_color: 'bg-pink-50', is_default: true },
    { id: 'ideas', label: 'أفكار', icon_name: 'Zap', color: 'text-yellow-500', bg_color: 'bg-yellow-50', is_default: true },
    { id: 'archive', label: 'أرشيف', icon_name: 'Archive', color: 'text-gray-500', bg_color: 'bg-gray-50', is_default: true },
];

export const ICON_MAP: Record<string, any> = {
    Inbox, User, Briefcase, FolderKanban, Archive,
    Star, Heart, Target, Zap, Coffee, Book, Layout
};

export const AVAILABLE_ICONS = [
    { name: 'Star', icon: Star },
    // ... others kept for reference if needed, but unused for now
];

export const useBuckets = () => {
    // STATIC BUCKETS ONLY - No fetching from DB
    const [buckets] = useState<Bucket[]>(DEFAULT_BUCKETS);
    const [loading] = useState(false);
    const { toast } = useToast();

    // No-op functions for Add/Delete as per user request
    const addBucket = async () => {
        toast({ title: 'غير مسموح بإضافة فئات جديدة', variant: 'destructive' });
        return null;
    };

    const deleteBucket = async () => {
        toast({ title: 'غير مسموح بحذف الفئات الأساسية', variant: 'destructive' });
        return false;
    };

    return {
        buckets,
        loading,
        addBucket,
        deleteBucket,
        iconMap: ICON_MAP,
        refresh: () => { } // No-op
    };
};
