
import { supabase } from "@/integrations/supabase/client";
import { ThesisService } from "./thesis/ThesisService";
import { FileText, CheckSquare, StickyNote, User, DollarSign, MapPin } from 'lucide-react';

export interface GlobalSearchResult {
    id: string;
    type: 'thesis' | 'note' | 'task' | 'new_muslim' | 'finance' | 'location';
    title: string;
    subtitle?: string;
    link: string;
    icon: any;
}

export const GlobalSearchService = {
    async search(query: string): Promise<GlobalSearchResult[]> {
        const term = query.trim().toLowerCase();
        if (!term) return [];

        const results: GlobalSearchResult[] = [];

        try {
            // 1. Search Thesis Projects
            const projects = await ThesisService.getProjects();
            projects.forEach(p => {
                if (p.name.toLowerCase().includes(term)) {
                    results.push({
                        id: p.id,
                        type: 'thesis',
                        title: p.name,
                        subtitle: 'مشروع أكاديمي',
                        icon: FileText,
                        link: `/thesis/structure?project=${p.id}`
                    });
                }
            });

            // 2. Search Notes (v2)
            const { data: notes } = await supabase
                .from('notes_v2')
                .select('id, title, content')
                .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
                .limit(5);

            notes?.forEach(n => {
                results.push({
                    id: n.id,
                    type: 'note',
                    title: n.title || 'ملاحظة بدون عنوان',
                    subtitle: 'ملاحظات',
                    icon: StickyNote,
                    link: `/notes-v2?id=${n.id}`
                });
            });

            // 3. Search New Muslims 
            // Check if table exists before searching
            const { data: newMuslims } = await supabase
                .from('new_muslims')
                .select('id, full_name')
                .ilike('full_name', `%${term}%`)
                .limit(5);

            newMuslims?.forEach(m => {
                results.push({
                    id: m.id,
                    type: 'new_muslim',
                    title: m.full_name,
                    subtitle: 'المسلمون الجدد',
                    icon: User,
                    link: `/?tab=newmuslims&id=${m.id}`
                });
            });

            // 4. Search Locations (from logistics JSONB)
            // Simplified: Fetch logistics and filter in JS for small datasets
            const { data: logistics } = await supabase
                .from('logistics_data_2025_12_18_18_42')
                .select('locations')
                .limit(1)
                .single();

            if (logistics?.locations) {
                const locs = logistics.locations as any[];
                locs.forEach((l, idx) => {
                    if (l.name?.toLowerCase().includes(term)) {
                        results.push({
                            id: `loc-${idx}`,
                            type: 'location',
                            title: l.name,
                            subtitle: 'المواقع المحفوظة',
                            icon: MapPin,
                            link: `/?tab=map`
                        });
                    }
                });
            }

        } catch (error) {
            console.error('Global search error:', error);
        }

        return results;
    }
};
