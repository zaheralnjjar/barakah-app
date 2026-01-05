
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResearchProject } from '../AcademicManager';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

interface StatsDashboardProps {
    project: ResearchProject;
}

export function StatsDashboard({ project }: StatsDashboardProps) {

    // --- Stats Calculations ---
    const stats = useMemo(() => {
        let totalChapters = 0;
        let completedChapters = 0;
        let totalWords = 0;

        (project.phases || []).forEach(phase => {
            (phase.chapters || []).forEach(chapter => {
                totalChapters++;
                if (chapter.status === 'completed') completedChapters++;
                if (chapter.content) {
                    totalWords += chapter.content.split(/\s+/).filter(Boolean).length;
                }
            });
        });

        const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

        // Materials Stats
        const totalMaterials = (project.materials || []).length;
        const readMaterials = (project.materials || []).filter(m => m.status === 'read').length;

        // Days Left
        const today = new Date();
        const deadline = project.deadline ? new Date(project.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
            totalChapters,
            completedChapters,
            totalWords,
            progress,
            totalMaterials,
            readMaterials,
            daysLeft
        };
    }, [project]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        return (project.phases || []).map((phase, idx) => ({
            name: `مرحلة ${idx + 1}`,
            total: (phase.chapters || []).length,
            completed: (phase.chapters || []).filter(c => c.status === 'completed').length
        }));
    }, [project]);

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-100">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">نسبة الإنجاز</p>
                                <h3 className="text-3xl font-black">{Math.round(stats.progress)}%</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">الكلمات المكتوبة</p>
                                <h3 className="text-3xl font-black text-slate-800">{stats.totalWords.toLocaleString()}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <span className="text-lg">✍️</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 font-medium">كلمة تقريباً</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-emerald-200 transition-colors shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">المراجع المقروءة</p>
                                <h3 className="text-3xl font-black text-slate-800">{stats.readMaterials} <span className="text-sm text-gray-400 font-medium">/ {stats.totalMaterials}</span></h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {Array.from({ length: Math.min(5, stats.totalMaterials) }).map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < stats.readMaterials ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-rose-200 transition-colors shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">الأيام المتبقية</p>
                                <h3 className="text-3xl font-black text-slate-800">{stats.daysLeft > 0 ? stats.daysLeft : 0}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-rose-500" />
                            </div>
                        </div>
                        <p className="text-xs text-rose-500 mt-4 font-bold">{stats.daysLeft < 30 ? 'الموعد يقترب!' : 'لديك وقت كافٍ'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600">تقدم المراحل</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="total" stackId="a" fill="#f3f4f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Placeholder for now - could be activity heat map later */}
                <Card className="border-dashed border-2 bg-gray-50/50 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <p className="text-sm font-medium">تحليلات النص المتقدمة</p>
                        <p className="text-xs mt-1">قريباً...</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
