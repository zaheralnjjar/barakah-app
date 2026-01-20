
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Search, Book, Trash2, Download } from 'lucide-react';
import { ThesisService } from '@/services/thesis/ThesisService';
import { toast } from 'sonner';

export default function ThesisReferences() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    // Feature: Reference Scanner
    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [showScanResults, setShowScanResults] = useState(false);

    // Feature: BibTeX Import
    const [showBibDialog, setShowBibDialog] = useState(false);
    const [bibText, setBibText] = useState("");

    // Feature: Add New Reference Dialog
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newRef, setNewRef] = useState({ title: '', author: '', year: '', publisher: '', type: 'book' });

    const handleScanFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !projectId) return;
        setScanning(true);
        const files = Array.from(e.target.files);
        const candidates = new Set<string>();
        const foundRefs: any[] = [];

        try {
            // Dynamically import mammoth to avoid loading it if not used
            const mammoth = await import('mammoth');

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                const text = result.value;

                // Regex for (Author, Year) or [Author, Year] - Arabic & English support
                const regex = /[\(\[]([^\d\(\)\[\]]+?)[،,]\s*(\d{4})[\)\]]/g;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const author = match[1].trim();
                    const year = match[2];
                    const key = `${author}|${year}`;

                    if (author.length > 2 && author.length < 50 && !candidates.has(key)) {
                        candidates.add(key);
                        foundRefs.push({ author, year, title: "مرجع مستخرج تلقائياً", type: 'book' });
                    }
                }
            }

            if (foundRefs.length > 0) {
                setScanResults(foundRefs);
                setShowScanResults(true);
                toast.success(`تم العثور على ${foundRefs.length} مرجع`);
            } else {
                toast.info("لم يتم العثور على مراجع جديدة في الملفات");
            }
        } catch (error) {
            console.error(error);
            toast.error("فشل فحص الملفات. تأكد أنها ملفات Word صالحة.");
        } finally {
            setScanning(false);
            // Reset input
            e.target.value = '';
        }
    };

    const confirmAddRefs = async () => {
        if (!projectId) return;
        try {
            for (const ref of scanResults) {
                await ThesisService.addReference({ ...ref, project_id: projectId });
            }
            toast.success("تمت إضافة المراجع");
            setShowScanResults(false);
            // Refresh references logic needed here or useQuery
        } catch (e) {
            toast.error("حدث خطأ أثناء الحفظ");
        }
    };

    const handleBibImport = async () => {
        if (!bibText.trim() || !projectId) return;

        try {
            const entries = bibText.split('@');
            let count = 0;

            for (const entry of entries) {
                if (!entry.trim()) continue;

                const titleMatch = entry.match(/title\s*=\s*[{"'](.*?)["'}]/i);
                const authorMatch = entry.match(/author\s*=\s*[{"'](.*?)["'}]/i);
                const yearMatch = entry.match(/year\s*=\s*[{"']?(\d+)["'}]?/i);
                const publisherMatch = entry.match(/publisher\s*=\s*[{"'](.*?)["'}]/i);

                if (titleMatch) {
                    await ThesisService.addReference({
                        project_id: projectId,
                        title: titleMatch[1].replace(/[{}]/g, ''),
                        author: authorMatch ? authorMatch[1].replace(/[{}]/g, '') : undefined,
                        year: yearMatch ? yearMatch[1] : undefined,
                        publisher: publisherMatch ? publisherMatch[1].replace(/[{}]/g, '') : undefined,
                        type: 'book'
                    });
                    count++;
                }
            }

            if (count > 0) {
                toast.success(`تم استيراد ${count} مرجع`);
                setShowBibDialog(false);
                setBibText("");
            } else {
                toast.warning("لم يتم العثور على مراجع صالحة في النص");
            }
        } catch (e) {
            toast.error("فشل الاستيراد");
        }
    };

    // تصدير المراجع إلى BibTeX
    const handleExportBibTeX = async () => {
        try {
            const refs = await ThesisService.getReferences(projectId!);
            if (!refs || refs.length === 0) {
                toast.warning("لا توجد مراجع للتصدير");
                return;
            }

            const bibEntries = refs.map((ref: any, i) => {
                const key = `ref${i + 1}_${ref.year || 'n.d.'}`;
                const type = ref.type === 'article' ? 'article' :
                    ref.type === 'thesis' ? 'phdthesis' : 'book';

                let entry = `@${type}{${key},\n`;
                if (ref.title) entry += `  title = {${ref.title}},\n`;
                if (ref.author) entry += `  author = {${ref.author}},\n`;
                if (ref.year) entry += `  year = {${ref.year}},\n`;
                if (ref.publisher) entry += `  publisher = {${ref.publisher}},\n`;
                if (ref.doi) entry += `  doi = {${ref.doi}},\n`;
                if (ref.url) entry += `  url = {${ref.url}},\n`;
                entry += `}`;
                return entry;
            });

            const bibContent = bibEntries.join('\n\n');
            const blob = new Blob([bibContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'references.bib';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`تم تصدير ${refs.length} مرجع`);
        } catch (e) {
            console.error(e);
            toast.error("فشل التصدير");
        }
    };

    const handleAddReference = async () => {
        if (!newRef.title.trim() || !projectId) {
            toast.error("يرجى إدخال عنوان المرجع على الأقل");
            return;
        }
        try {
            await ThesisService.addReference({ ...newRef, project_id: projectId });
            toast.success("تمت إضافة المرجع بنجاح");
            setShowAddDialog(false);
            setNewRef({ title: '', author: '', year: '', publisher: '', type: 'book' });
        } catch (e) {
            toast.error("فشل في إضافة المرجع");
        }
    };

    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                            <ArrowLeft className="w-4 h-4" /> العودة
                        </Button>
                        <h1 className="text-3xl font-bold">المراجع والمصادر</h1>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept=".docx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleScanFiles}
                                disabled={scanning}
                            />
                            <Button variant="outline" disabled={scanning}>
                                {scanning ? 'جاري الفحص...' : '🕵️ فاحص الملفات'}
                            </Button>
                        </div>
                        <Button variant="outline" onClick={() => setShowBibDialog(true)}>
                            📥 استيراد BibTeX
                        </Button>
                        <Button variant="outline" onClick={handleExportBibTeX}>
                            <Download className="w-4 h-4 ml-2" />
                            تصدير BibTeX
                        </Button>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="w-4 h-4 ml-2" />
                            مرجع جديد
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في المراجع..."
                        className="pr-10"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Book className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>قائمة المراجع فارغة</p>
                    <Button variant="link" className="mt-2">أضف مرجعك الأول</Button>
                </div>

                {/* Scan Results Dialog */}
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${showScanResults ? '' : 'hidden'}`}>
                    <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
                        <h3 className="text-lg font-bold mb-4">نتائج الفحص الذكي</h3>
                        <div className="max-h-60 overflow-auto space-y-2 mb-4">
                            {scanResults.map((ref, i) => (
                                <div key={i} className="p-2 border rounded text-sm">
                                    <span className="font-bold">{ref.author}</span> ({ref.year})
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowScanResults(false)}>إلغاء</Button>
                            <Button onClick={confirmAddRefs}>إضافة المراجع ({scanResults.length})</Button>
                        </div>
                    </div>
                </div>

                {/* BibTeX Dialog */}
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${showBibDialog ? '' : 'hidden'}`}>
                    <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
                        <h3 className="text-lg font-bold mb-4">استيراد BibTeX</h3>
                        <textarea
                            className="w-full h-40 p-2 border rounded mb-4 text-left font-mono text-sm"
                            placeholder="@book{key, title={...}, author={...}, year={2020}}"
                            value={bibText}
                            onChange={e => setBibText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowBibDialog(false)}>إلغاء</Button>
                            <Button onClick={handleBibImport}>استيراد</Button>
                        </div>
                    </div>
                </div>

                {/* Add Reference Dialog */}
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${showAddDialog ? '' : 'hidden'}`}>
                    <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
                        <h3 className="text-lg font-bold mb-4">إضافة مرجع جديد</h3>
                        <div className="space-y-4">
                            <div>
                                <Label>العنوان *</Label>
                                <Input
                                    placeholder="عنوان الكتاب أو المقالة"
                                    value={newRef.title}
                                    onChange={e => setNewRef({ ...newRef, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>المؤلف</Label>
                                <Input
                                    placeholder="اسم المؤلف"
                                    value={newRef.author}
                                    onChange={e => setNewRef({ ...newRef, author: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>السنة</Label>
                                    <Input
                                        placeholder="2024"
                                        value={newRef.year}
                                        onChange={e => setNewRef({ ...newRef, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>الناشر</Label>
                                    <Input
                                        placeholder="دار النشر"
                                        value={newRef.publisher}
                                        onChange={e => setNewRef({ ...newRef, publisher: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                            <Button onClick={handleAddReference}>حفظ المرجع</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
