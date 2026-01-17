import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Users, Quote, FileDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { ThesisService } from '@/services/thesis/ThesisService';
import { IndexGenerator, ThesisIndex } from '@/services/thesis/IndexGenerator';
import { ThesisNode } from '@/types/thesis';

export default function ThesisIndexes() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [index, setIndex] = useState<ThesisIndex | null>(null);
    const [projectName, setProjectName] = useState('');

    useEffect(() => {
        if (projectId) loadProjectInfo();
    }, [projectId]);

    async function loadProjectInfo() {
        const projects = await ThesisService.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) setProjectName(project.name);
    }

    async function getNodeContent(node: ThesisNode): Promise<string> {
        // If content is already in the node (sometimes loaded), return it
        if (node.content) return node.content;

        // Fetch full node from DB
        try {
            const data = await ThesisService.getNode(node.id);
            return data.content || '';
        } catch (e) {
            console.error("Failed to load node content", e);
            return '';
        }
    }

    async function handleBuildIndex() {
        if (!projectId) return;
        setLoading(true);
        toast.info('جاري بناء الفهارس...');
        try {
            const structure = await ThesisService.getStructure(projectId);
            const builtIndex = await IndexGenerator.buildIndex(structure, getNodeContent);
            setIndex(builtIndex);
            toast.success(`تم: ${builtIndex.verses.length} آية، ${builtIndex.hadiths.length} حديث، ${builtIndex.scholars.length} علَم`);
        } catch (e) {
            toast.error('فشل بناء الفهارس');
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(type: 'verses' | 'hadiths' | 'scholars') {
        if (!index) { toast.error('ابنِ الفهارس أولاً'); return; }
        setGenerating(type);
        try {
            let blob: Blob;
            let filename: string;
            if (type === 'verses') {
                blob = await IndexGenerator.generateVersesIndexDoc(index);
                filename = `فهرس_الآيات_${projectName}.docx`;
            } else if (type === 'hadiths') {
                blob = await IndexGenerator.generateHadithsIndexDoc(index);
                filename = `فهرس_الأحاديث_${projectName}.docx`;
            } else {
                blob = await IndexGenerator.generateScholarsIndexDoc(index);
                filename = `فهرس_الأعلام_${projectName}.docx`;
            }
            saveAs(blob, filename);
            toast.success('تم التحميل');
        } catch (e) {
            toast.error('فشل التحميل');
        } finally {
            setGenerating(null);
        }
    }

    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                        <ArrowLeft className="w-4 h-4" /> العودة
                    </Button>
                    <h1 className="text-3xl font-bold">الفهارس الآلية</h1>
                    <p className="text-muted-foreground">استخراج الآيات والأحاديث والأعلام</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>بناء الفهارس</CardTitle>
                        <CardDescription>فحص المحتوى واستخراج العناصر</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleBuildIndex} disabled={loading} size="lg" className="w-full gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            {loading ? 'جاري البناء...' : 'بناء الفهارس'}
                        </Button>
                        {index && (
                            <div className="mt-4 p-4 bg-muted rounded-lg grid grid-cols-3 gap-4 text-center">
                                <div><span className="text-2xl font-bold text-primary">{index.verses.length}</span><br /><span className="text-sm">آية</span></div>
                                <div><span className="text-2xl font-bold text-amber-600">{index.hadiths.length}</span><br /><span className="text-sm">حديث</span></div>
                                <div><span className="text-2xl font-bold text-emerald-600">{index.scholars.length}</span><br /><span className="text-sm">علَم</span></div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <BookOpen className="w-6 h-6 text-primary mb-2" />
                            <CardTitle className="text-lg">فهرس الآيات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleDownload('verses')} disabled={!index || generating === 'verses'} className="w-full gap-2" variant="outline">
                                {generating === 'verses' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                تحميل
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <Quote className="w-6 h-6 text-amber-600 mb-2" />
                            <CardTitle className="text-lg">فهرس الأحاديث</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleDownload('hadiths')} disabled={!index || generating === 'hadiths'} className="w-full gap-2" variant="outline">
                                {generating === 'hadiths' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                تحميل
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <Users className="w-6 h-6 text-emerald-600 mb-2" />
                            <CardTitle className="text-lg">فهرس الأعلام</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleDownload('scholars')} disabled={!index || generating === 'scholars'} className="w-full gap-2" variant="outline">
                                {generating === 'scholars' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                تحميل
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
