import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Link2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ZettelkastenService, ThesisLink } from '@/services/thesis/ZettelkastenService';
import { ThesisNode } from '@/types/thesis';

export default function ThesisLinks() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [links, setLinks] = useState<ThesisLink[]>([]);
    const [nodes, setNodes] = useState<ThesisNode[]>([]);
    const [flatNodes, setFlatNodes] = useState<{ id: string; title: string; type: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);

    const [newLink, setNewLink] = useState({
        source: '',
        target: '',
        type: 'reference' as ThesisLink['link_type'],
        description: ''
    });

    useEffect(() => {
        if (projectId) loadData();
    }, [projectId]);

    async function loadData() {
        try {
            setLoading(true);
            const [structure, projectLinks] = await Promise.all([
                ThesisService.getStructure(projectId!),
                ZettelkastenService.getLinks(projectId!)
            ]);

            setNodes(structure);
            setLinks(projectLinks);

            // تسطيح الهيكل للاختيار
            const flat: { id: string; title: string; type: string }[] = [];
            const flatten = (nodes: ThesisNode[], prefix = '') => {
                nodes.forEach(n => {
                    flat.push({ id: n.id, title: prefix + n.title, type: n.type });
                    if (n.children) flatten(n.children, prefix + '  ');
                });
            };
            flatten(structure);
            setFlatNodes(flat);
        } catch (e) {
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddLink() {
        if (!newLink.source || !newLink.target) {
            toast.error('يرجى اختيار العنصرين');
            return;
        }
        if (newLink.source === newLink.target) {
            toast.error('لا يمكن ربط عنصر بنفسه');
            return;
        }

        try {
            await ZettelkastenService.addLink({
                project_id: projectId!,
                source_node_id: newLink.source,
                target_node_id: newLink.target,
                link_type: newLink.type,
                description: newLink.description
            });
            toast.success('تم إضافة الرابط');
            setShowDialog(false);
            setNewLink({ source: '', target: '', type: 'reference', description: '' });
            loadData();
        } catch (e) {
            toast.error('فشل إضافة الرابط');
        }
    }

    async function handleDeleteLink(linkId: string) {
        if (!confirm('هل تريد حذف هذا الرابط؟')) return;
        try {
            await ZettelkastenService.deleteLink(projectId!, linkId);
            toast.success('تم الحذف');
            loadData();
        } catch (e) {
            toast.error('فشل الحذف');
        }
    }

    const getNodeTitle = (nodeId: string) => flatNodes.find(n => n.id === nodeId)?.title || 'غير معروف';

    const linkTypeLabels: Record<string, string> = {
        reference: 'مرجع',
        related: 'متعلق',
        depends_on: 'يعتمد على',
        contradicts: 'يخالف',
        supports: 'يدعم'
    };

    const linkTypeColors: Record<string, string> = {
        reference: 'bg-blue-100 text-blue-700',
        related: 'bg-gray-100 text-gray-700',
        depends_on: 'bg-amber-100 text-amber-700',
        contradicts: 'bg-red-100 text-red-700',
        supports: 'bg-green-100 text-green-700'
    };

    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                            <ArrowLeft className="w-4 h-4" /> العودة
                        </Button>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Link2 className="w-8 h-8 text-primary" />
                            روابط Zettelkasten
                        </h1>
                        <p className="text-muted-foreground">ربط العناصر والإشارات المرجعية</p>
                    </div>
                    <Button onClick={() => setShowDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> رابط جديد
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-primary">{links.length}</div>
                            <div className="text-sm text-muted-foreground">رابط</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-amber-600">{flatNodes.length}</div>
                            <div className="text-sm text-muted-foreground">عنصر</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-emerald-600">
                                {new Set(links.flatMap(l => [l.source_node_id, l.target_node_id])).size}
                            </div>
                            <div className="text-sm text-muted-foreground">عنصر مرتبط</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Links List */}
                <Card>
                    <CardHeader>
                        <CardTitle>الروابط</CardTitle>
                        <CardDescription>قائمة الروابط بين عناصر الرسالة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">جاري التحميل...</div>
                        ) : links.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                لا توجد روابط. أضف رابطاً جديداً للبدء.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {links.map(link => (
                                    <div key={link.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                                            <span className="font-medium truncate max-w-[200px]">{getNodeTitle(link.source_node_id)}</span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            <span className={`px-2 py-0.5 rounded text-xs ${linkTypeColors[link.link_type]}`}>
                                                {linkTypeLabels[link.link_type]}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium truncate max-w-[200px]">{getNodeTitle(link.target_node_id)}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Link Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إضافة رابط جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>من (المصدر)</Label>
                            <Select value={newLink.source} onValueChange={v => setNewLink({ ...newLink, source: v })}>
                                <SelectTrigger><SelectValue placeholder="اختر العنصر المصدر" /></SelectTrigger>
                                <SelectContent>
                                    {flatNodes.map(n => (
                                        <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>نوع الرابط</Label>
                            <Select value={newLink.type} onValueChange={v => setNewLink({ ...newLink, type: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reference">مرجع</SelectItem>
                                    <SelectItem value="related">متعلق</SelectItem>
                                    <SelectItem value="depends_on">يعتمد على</SelectItem>
                                    <SelectItem value="supports">يدعم</SelectItem>
                                    <SelectItem value="contradicts">يخالف</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>إلى (الهدف)</Label>
                            <Select value={newLink.target} onValueChange={v => setNewLink({ ...newLink, target: v })}>
                                <SelectTrigger><SelectValue placeholder="اختر العنصر الهدف" /></SelectTrigger>
                                <SelectContent>
                                    {flatNodes.map(n => (
                                        <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>وصف (اختياري)</Label>
                            <Input
                                value={newLink.description}
                                onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                                placeholder="وصف الرابط..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
                        <Button onClick={handleAddLink}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
