import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisMilestone } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, ArrowLeft, Trash2, Edit, Flag, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ThesisCalendar() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [milestones, setMilestones] = useState<ThesisMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<'deadline' | 'milestone' | 'meeting'>('milestone');

    const [editingMilestone, setEditingMilestone] = useState<ThesisMilestone | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        if (projectId) loadMilestones();
    }, [projectId]);

    async function loadMilestones() {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await ThesisService.getMilestones(projectId);
            setMilestones(data);
        } catch (error) {
            toast.error("فشل تحميل التقويم");
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd() {
        if (!projectId || !title || !date) return;
        try {
            await ThesisService.saveMilestone({
                project_id: projectId,
                title,
                date,
                time,
                type
            });
            setTitle('');
            setDate('');
            setTime('');
            toast.success("تمت الإضافة");
            loadMilestones();
        } catch (error) {
            toast.error("فشل الحفظ");
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("حذف الموعد؟")) return;
        try {
            await ThesisService.deleteMilestone(id);
            setMilestones(prev => prev.filter(m => m.id !== id));
            toast.success("تم الحذف");
        } catch (error) {
            toast.error("فشل الحذف");
        }
    }

    const openEditDialog = (milestone: ThesisMilestone) => {
        setEditingMilestone(milestone);
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingMilestone) return;
        try {
            await ThesisService.saveMilestone(editingMilestone);
            toast.success("تم التحديث");
            setIsEditDialogOpen(false);
            loadMilestones();
        } catch (error) {
            toast.error("فشل التحديث");
        }
    };

    const getCountdownDate = (dateStr: string) => {
        const today = new Date();
        const targetDate = new Date(dateStr);
        const diff = differenceInDays(targetDate, today);
        return diff;
    };

    if (!projectId) return <div className="p-8 text-center bg-background min-h-screen">يرجى اختيار مشروع</div>;

    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                            <ArrowLeft className="w-4 h-4" /> العودة
                        </Button>
                        <h1 className="text-3xl font-bold">تقويم المشروع</h1>
                    </div>
                </div>

                {/* Add Milestone */}
                <Card>
                    <CardHeader><CardTitle>إضافة موعد جديد</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="col-span-2 space-y-2">
                            <Label>العنوان</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: تسليم الفصل الأول" />
                        </div>
                        <div className="space-y-2">
                            <Label>التاريخ</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>الوقت</Label>
                            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                        <Button onClick={handleAdd} disabled={!title || !date}>
                            <Plus className="w-4 h-4 ml-2" /> إضافة
                        </Button>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <div className="relative border-r-2 border-primary/20 mr-4 space-y-8 py-4">
                    {loading ? (
                        <div className="mr-8">جاري التحميل...</div>
                    ) : sortedMilestones.length > 0 ? (
                        sortedMilestones.map(m => {
                            const daysLeft = getCountdownDate(m.date);
                            const isPast = daysLeft < 0;
                            const isToday = daysLeft === 0;

                            return (
                                <div key={m.id} className="relative mr-8 group">
                                    <div className={`absolute -right-[39px] w-5 h-5 rounded-full border-4 border-background ${m.type === 'deadline' ? 'bg-red-500' : m.type === 'meeting' ? 'bg-blue-500' : 'bg-primary'
                                        }`} />
                                    <Card className="hover:border-primary/50 transition-colors">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {format(new Date(m.date), 'EEEE d MMMM yyyy', { locale: ar })}
                                                    {m.time && (
                                                        <span className="flex items-center gap-1 mr-2 text-indigo-600 bg-indigo-50 px-1.5 rounded">
                                                            <Clock className="w-3 h-3" /> {m.time}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-bold text-lg mb-1">{m.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1 capitalize flex gap-2">
                                                    <span>{m.type === 'deadline' ? 'مجازة/تسليم' : m.type === 'meeting' ? 'اجتماع' : 'موعد'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Countdown Badge */}
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isPast
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : isToday
                                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    }`}>
                                                    {isPast
                                                        ? `انتهى منذ ${Math.abs(daysLeft)} يوم`
                                                        : isToday
                                                            ? 'اليوم'
                                                            : `باقي ${daysLeft} يوم`}
                                                </div>

                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => openEditDialog(m)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(m.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })
                    ) : (
                        <div className="mr-8 text-muted-foreground">لا توجد مواعيد مضافة بعد</div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل الموعد</DialogTitle>
                    </DialogHeader>
                    {editingMilestone && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>العنوان</Label>
                                <Input
                                    value={editingMilestone.title}
                                    onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>التاريخ</Label>
                                    <Input
                                        type="date"
                                        value={editingMilestone.date}
                                        onChange={(e) => setEditingMilestone({ ...editingMilestone, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>الوقت</Label>
                                    <Input
                                        type="time"
                                        value={editingMilestone.time || ''}
                                        onChange={(e) => setEditingMilestone({ ...editingMilestone, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleUpdate}>حفظ التعديلات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
