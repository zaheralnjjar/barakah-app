import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, DollarSign, Calendar, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: string) => void;
}

interface SearchResult {
    type: 'finance' | 'appointment' | 'location' | 'prayer';
    title: string;
    description: string;
    tab: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'finance': return <DollarSign className="w-4 h-4 text-green-500" />;
            case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'location': return <MapPin className="w-4 h-4 text-red-500" />;
            case 'prayer': return <Moon className="w-4 h-4 text-purple-500" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            const searchResults: SearchResult[] = [];

            try {
                const user = (await supabase.auth.getUser()).data.user;
                if (!user) return;

                // Search in finance
                const { data: financeData } = await supabase
                    .from('finance_data_2025_12_18_18_42')
                    .select('pending_expenses')
                    .eq('user_id', user.id)
                    .single();

                if (financeData?.pending_expenses) {
                    const expenses = financeData.pending_expenses as any[];
                    expenses.forEach((t: any) => {
                        if (t.description?.toLowerCase().includes(query.toLowerCase())) {
                            searchResults.push({
                                type: 'finance',
                                title: t.description,
                                description: `${t.type === 'income' ? 'دخل' : 'مصروف'}: ${t.amount} ${t.currency}`,
                                tab: 'finance'
                            });
                        }
                    });
                }

                // Search in appointments
                const { data: appointments } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('user_id', user.id)
                    .ilike('title', `%${query}%`)
                    .limit(5);

                appointments?.forEach((a: any) => {
                    searchResults.push({
                        type: 'appointment',
                        title: a.title,
                        description: `${a.date} ${a.time || ''}`,
                        tab: 'productivity'
                    });
                });

                // Search in saved locations
                const locations = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
                locations.forEach((loc: any) => {
                    if (loc.title?.toLowerCase().includes(query.toLowerCase())) {
                        searchResults.push({
                            type: 'location',
                            title: loc.title,
                            description: 'موقع محفوظ',
                            tab: 'map'
                        });
                    }
                });

                setResults(searchResults.slice(0, 10));
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        onNavigate(result.tab);
        onClose();
        setQuery('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-right">🔍 البحث الشامل</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        placeholder="ابحث في المالية، المواعيد، المواقع..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="text-right"
                        autoFocus
                    />

                    {loading && <p className="text-center text-gray-500">جاري البحث...</p>}

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {results.map((result, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                className="w-full justify-between text-right"
                                onClick={() => handleSelect(result)}
                            >
                                <span className="flex items-center gap-2">
                                    {getIcon(result.type)}
                                    <span>{result.title}</span>
                                </span>
                                <span className="text-xs text-gray-400">{result.description}</span>
                            </Button>
                        ))}

                        {query && !loading && results.length === 0 && (
                            <p className="text-center text-gray-500 py-4">لا توجد نتائج</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalSearch;
