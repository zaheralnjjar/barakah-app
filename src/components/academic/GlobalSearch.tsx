
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, BookOpen, Hash } from "lucide-react";
import { AcademicService } from "@/services/AcademicService";
import { useNavigate } from 'react-router-dom';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        const search = async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                // In a real app we'd debounce this
                const data = await AcademicService.globalSearch(query);
                setResults(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 max-w-2xl bg-white overflow-hidden shadow-2xl rounded-xl border-0">
                <div className="flex items-center px-4 border-b h-14 bg-gray-50/50">
                    <Search className="w-5 h-5 text-gray-400 ml-3" />
                    <Input
                        placeholder="ابحث في فصول البحث، المراجع، والمسودات..."
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg h-full px-0"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-gray-100 px-2 font-mono text-[10px] font-medium text-gray-500">
                        <span className="text-xs">Ctrl</span>K
                    </kbd>
                </div>
                <div className="max-h-[60vh] overflow-auto p-2">
                    {loading && <div className="p-4 text-center text-gray-400 text-sm">جاري البحث...</div>}
                    {!loading && results.length === 0 && query && (
                        <div className="p-8 text-center text-gray-400">لا توجد نتائج</div>
                    )}

                    {!loading && results.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer group transition-colors">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border shadow-sm group-hover:border-indigo-200">
                                {result.type === 'chapter' ? <FileText className="w-5 h-5 text-indigo-500" /> :
                                    result.type === 'material' ? <BookOpen className="w-5 h-5 text-emerald-500" /> :
                                        <Hash className="w-5 h-5 text-gray-500" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{result.title}</h4>
                                {result.context && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{result.context}</p>}
                            </div>
                            {result.tag && <span className="mr-auto text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">{result.tag}</span>}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
