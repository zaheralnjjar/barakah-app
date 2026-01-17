import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, CheckSquare, StickyNote, ArrowRight, Loader2 } from 'lucide-react';
import { ThesisService } from '@/services/thesis/ThesisService';
import { debounce } from 'lodash'; // You might need to install lodash or write a simple debounce

// Simple debounce implementation if lodash is not available or desired to keep minimal
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface SearchResult {
    id: string;
    type: 'node' | 'task' | 'note' | 'reference';
    title: string;
    subtitle?: string; // Parent title or context
    match_context?: string; // Snippet of text where match occurred
    icon: React.ElementType;
    link: string;
}

export function GlobalSearchDialog() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (debouncedQuery.trim().length > 1) {
            performSearch(debouncedQuery);
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        try {
            // Needed: A unified search API or multiple parallel queries
            // Since we don't have a backend "search" endpoint yet, we'll fetch and filter
            // Ideally, this should be an RPC call to Supabase

            // Temporary Strategy: Fetch current project structure and tasks (if project context exists)
            // Or fetch ALL projects? Let's assume global context for now or limit to active?
            // "Global Search" implies everything.

            const results: SearchResult[] = [];
            const termLower = searchTerm.toLowerCase();

            // 1. Search Projects
            const projects = await ThesisService.getProjects();
            projects.forEach(p => {
                if (p.name.toLowerCase().includes(termLower)) {
                    results.push({
                        id: p.id,
                        type: 'node', // Using node icon for project for now
                        title: p.name,
                        subtitle: 'مشروع',
                        icon: FileText,
                        link: `/thesis/structure?project=${p.id}`
                    });
                }
            });

            // If we are inside a project (can we know?), search its content.
            // For now, let's just search the projects list as a start + maybe RPC later.
            // But User wants "Global Search". 
            // We need an RPC function in Supabase for efficient full-text search.

            setResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        setOpen(false);
        navigate(result.link);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 sm:max-w-[550px] gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-500" />
                        <Input
                            className="border-0 focus-visible:ring-0 px-0 h-auto text-lg"
                            placeholder="ابحث في المشاريع، الفصول، المهام..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                </DialogHeader>
                <ScrollArea className="h-[300px] p-2">
                    {loading && (
                        <div className="flex items-center justify-center h-20 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            جاري البحث...
                        </div>
                    )}

                    {!loading && results.length === 0 && query.length > 1 && (
                        <div className="text-center py-10 text-gray-500">
                            لا توجد نتائج لـ "{query}"
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer group"
                                >
                                    <div className="p-2 rounded-full bg-gray-200 group-hover:bg-white text-gray-600">
                                        <result.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm text-gray-900">{result.title}</h4>
                                        {result.subtitle && (
                                            <p className="text-xs text-gray-500">{result.subtitle}</p>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && query.length === 0 && (
                        <div className="p-4">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2">اختصارات</h3>
                            <div className="text-sm text-gray-400">
                                <span className="kbd bg-gray-100 px-1 rounded border">Cmd</span> + <span className="kbd bg-gray-100 px-1 rounded border">K</span> للفتح
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
