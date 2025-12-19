import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface AcademicProgressChartProps {
    thesisPhase: number;
    tasksList: Array<{
        id: string;
        title: string;
        status: 'pending' | 'in_progress' | 'completed';
        deadline?: string;
    }>;
    milestones: Array<{
        id: string;
        name: string;
        completed: boolean;
    }>;
}

const PHASE_NAMES = [
    'التحضير',
    'مراجعة الأدبيات',
    'تصميم المنهجية',
    'جمع البيانات',
    'التحليل',
    'النتائج',
    'المناقشة',
    'الخاتمة',
    'المراجعة',
    'التسليم النهائي'
];

const AcademicProgressChart: React.FC<AcademicProgressChartProps> = ({
    thesisPhase,
    tasksList = [],
    milestones = []
}) => {
    const progressPercentage = (thesisPhase / 10) * 100;

    // Radial chart data
    const radialData = [
        {
            name: 'التقدم',
            value: progressPercentage,
            fill: '#16a34a',
        },
    ];

    // Tasks status breakdown
    const completedTasks = tasksList.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasksList.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasksList.filter(t => t.status === 'pending').length;

    const tasksPieData = [
        { name: 'مكتملة', value: completedTasks, color: '#16a34a' },
        { name: 'قيد التنفيذ', value: inProgressTasks, color: '#eab308' },
        { name: 'معلقة', value: pendingTasks, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const completedMilestones = milestones.filter(m => m.completed).length;

    return (
        <div className="space-y-6">
            {/* Main Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-title text-lg flex items-center justify-between">
                        <span>تقدم رسالة الماجستير</span>
                        <Badge variant="secondary" className="arabic-body">
                            المرحلة {thesisPhase} - {PHASE_NAMES[thesisPhase - 1] || 'البداية'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="90%"
                                data={radialData}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <RadialBar
                                    background={{ fill: '#e2e8f0' }}
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-primary"
                                    style={{ fontSize: '2rem', fontWeight: 'bold' }}
                                >
                                    {progressPercentage.toFixed(0)}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Phase Timeline */}
                    <div className="mt-4 flex justify-between items-center overflow-x-auto pb-2">
                        {PHASE_NAMES.map((phase, index) => (
                            <div
                                key={index}
                                className={`flex flex-col items-center min-w-[60px] ${index + 1 <= thesisPhase ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${index + 1 < thesisPhase
                                        ? 'bg-primary'
                                        : index + 1 === thesisPhase
                                            ? 'bg-primary animate-pulse'
                                            : 'bg-gray-300'
                                    }`} />
                                <span className="text-[10px] mt-1 text-center arabic-body">{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-title text-lg">توزيع المهام</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasksPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={tasksPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {tasksPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <Circle className="w-12 h-12 mb-2" />
                                <p className="arabic-body">لا توجد مهام مسجلة</p>
                            </div>
                        )}

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <p className="text-xl font-bold text-green-600">{completedTasks}</p>
                                <p className="text-xs text-muted-foreground arabic-body">مكتملة</p>
                            </div>
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <p className="text-xl font-bold text-yellow-600">{inProgressTasks}</p>
                                <p className="text-xs text-muted-foreground arabic-body">قيد التنفيذ</p>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg">
                                <p className="text-xl font-bold text-gray-600">{pendingTasks}</p>
                                <p className="text-xs text-muted-foreground arabic-body">معلقة</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Milestones */}
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-title text-lg flex items-center justify-between">
                            <span>المراحل الرئيسية</span>
                            <Badge variant="outline">
                                {completedMilestones}/{milestones.length || PHASE_NAMES.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {(milestones.length > 0 ? milestones : PHASE_NAMES.map((name, i) => ({
                                id: String(i),
                                name,
                                completed: i + 1 < thesisPhase
                            }))).map((milestone, index) => (
                                <div
                                    key={milestone.id || index}
                                    className={`flex items-center gap-3 p-2 rounded-lg ${milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                                        }`}
                                >
                                    {milestone.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    ) : index + 1 === thesisPhase ? (
                                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 animate-pulse" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className={`arabic-body text-sm ${milestone.completed ? 'text-green-700' : 'text-muted-foreground'
                                        }`}>
                                        {milestone.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AcademicProgressChart;
