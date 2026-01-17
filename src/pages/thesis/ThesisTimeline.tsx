import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisNode, NODE_STATUS_CONFIG } from '@/types/thesis';

interface TimelineItem {
    id: string;
    title: string;
    type: string;
    status?: string;
    date?: string;
    order: number;
}

export default function ThesisTimeline() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [items, setItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) loadData();
    }, [projectId]);

    async function loadData() {
        try {
            setLoading(true);
            const structure = await ThesisService.getStructure(projectId!);

            // تسطيح الهيكل إلى قائمة
            const flat: TimelineItem[] = [];
            let order = 0;

            const flatten = (nodes: ThesisNode[]) => {
                nodes.forEach(n => {
                    flat.push({
                        id: n.id,
                        title: n.title,
                        type: n.type,
                        status: n.status,
                        order: order++
                    });
                    if (n.children) flatten(n.children);
                });
            };

            flatten(structure);
            setItems(flat);
        } catch (e) {
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'in_progress': return <CircleDot className="w-5 h-5 text-blue-500" />;
            case 'review': return <CircleDot className="w-5 h-5 text-amber-500" />;
            default: return <Circle className="w-5 h-5 text-gray-300" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            chapter: 'فصل',
            section: 'مبحث',
            subsection: 'مطلب',
            branch: 'فرع',
            topic: 'موضوع',
            issue: 'مسألة'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            chapter: 'border-purple-500 bg-purple-50',
            section: 'border-blue-500 bg-blue-50',
            subsection: 'border-green-500 bg-green-50',
            branch: 'border-amber-500 bg-amber-50',
            topic: 'border-pink-500 bg-pink-50',
            issue: 'border-indigo-500 bg-indigo-50'
        };
        return colors[type] || 'border-gray-500 bg-gray-50';
    };

    // حساب الإحصائيات
    const stats = {
        total: items.length,
        completed: items.filter(i => i.status === 'completed').length,
        inProgress: items.filter(i => i.status === 'in_progress').length,
        pending: items.filter(i => !i.status || i.status === 'draft').length
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
                            <Clock className="w-8 h-8 text-primary" />
                            الجدول الزمني
                        </h1>
                        <p className="text-muted-foreground">عرض تسلسل العمل على الرسالة</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{stats.total}</div>
                            <div className="text-xs text-muted-foreground">إجمالي</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                            <div className="text-xs text-muted-foreground">مكتمل</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                            <div className="text-xs text-muted-foreground">قيد العمل</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                            <div className="text-xs text-muted-foreground">منتظر</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">التقدم الإجمالي</span>
                            <span className="text-sm text-muted-foreground">
                                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                            </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>التسلسل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">جاري التحميل...</div>
                        ) : (
                            <div className="relative">
                                {/* Timeline Line */}
                                <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-muted"></div>

                                {/* Items */}
                                <div className="space-y-4">
                                    {items.map((item, i) => (
                                        <div key={item.id} className="relative flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="relative z-10 flex-shrink-0 w-12 flex justify-center">
                                                {getStatusIcon(item.status)}
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-1 p-3 rounded-lg border-r-4 ${getTypeColor(item.type)}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs px-2 py-0.5 bg-white rounded shadow-sm">
                                                        {getTypeLabel(item.type)}
                                                    </span>
                                                    {item.status && NODE_STATUS_CONFIG[item.status as keyof typeof NODE_STATUS_CONFIG] && (
                                                        <span className={`text-xs px-2 py-0.5 rounded ${NODE_STATUS_CONFIG[item.status as keyof typeof NODE_STATUS_CONFIG].color}`}>
                                                            {NODE_STATUS_CONFIG[item.status as keyof typeof NODE_STATUS_CONFIG].label}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium mt-1">{item.title}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
