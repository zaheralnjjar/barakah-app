import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Edit, Share2, Trash2, ChevronDown, ChevronUp, Layers, Clock, PieChart as PieChartIcon, CheckSquare } from 'lucide-react';
import { MainTask, SubTask } from '@/hooks/useTasks';
import { Appointment } from '@/hooks/useAppointments';

interface TaskSectionProps {
    tasks: MainTask[];
    appointments: Appointment[];
    activeTab: string;
    setActiveTab: (tab: 'task' | 'project' | 'appointment' | 'calendar') => void;

    // Actions
    onEditTask: (task: MainTask) => void;
    onDeleteTask: (id: string) => void;
    onShareTask: (task: MainTask) => void;

    onDeleteAppointment: (id: string) => void; // Edit appointment not fully implemented in parent yet?

    // Subtask Actions
    onAddSubtask: (taskId: string, title: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onDeleteSubtask: (taskId: string, subtaskId: string) => void;

    // Pomodoro
    pomodoro: {
        active: boolean;
        time: number;
        taskId: string | null;
        start: (id: string) => void;
        stop: () => void;
        format: () => string;
    };
}

export const TaskSection: React.FC<TaskSectionProps> = ({
    tasks, appointments, activeTab, setActiveTab,
    onEditTask, onDeleteTask, onShareTask,
    onDeleteAppointment,
    onAddSubtask, onToggleSubtask, onDeleteSubtask,
    pomodoro
}) => {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-50/50 p-1.5 rounded-2xl border w-fit mx-auto sm:mx-0 shadow-sm">
                <button
                    onClick={() => setActiveTab('task')}
                    className={`px-6 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${activeTab !== 'calendar'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    📋 قائمة المهام
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`px-6 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${activeTab === 'calendar'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    📅 التقويم الأسبوعي
                </button>
            </div>

            {activeTab === 'calendar' ? (
                <div className="bg-white rounded-xl border p-4 shadow-sm overflow-x-auto">
                    <div className="flex gap-4 min-w-[800px]">
                        {DAYS_AR.map((day, idx) => {
                            const today = new Date();
                            const diff = (today.getDay() + 1) % 7;
                            const sat = new Date(today);
                            sat.setDate(today.getDate() - diff);
                            const thisDate = new Date(sat);
                            thisDate.setDate(sat.getDate() + idx);
                            const dateStr = thisDate.toISOString().split('T')[0];

                            const dayTasks = tasks.filter(t => t.deadline === dateStr);
                            const dayAppts = appointments.filter(a => a.date === dateStr);

                            return (
                                <div key={idx} className={`flex-1 min-w-[120px] bg-gray-50 rounded-lg p-2 ${dateStr === new Date().toISOString().split('T')[0] ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                                    <div className="text-center mb-2 pb-2 border-b">
                                        <span className="block font-bold text-sm text-gray-800">{day}</span>
                                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {dayAppts.map(a => (
                                            <div key={a.id} className="bg-orange-100 p-1.5 rounded text-[10px] border-r-2 border-orange-500">
                                                <div className="font-bold truncate">{a.title}</div>
                                                <div className="text-[10px] text-gray-600">{a.time}</div>
                                            </div>
                                        ))}
                                        {dayTasks.map(t => (
                                            <div key={t.id} className="bg-white p-1.5 rounded text-[10px] border shadow-sm">
                                                <div className="font-bold truncate">{t.title}</div>
                                                <div className={`text-[10px] ${t.priority === 'high' ? 'text-red-500' : 'text-gray-500'}`}>{t.priority === 'high' ? 'عالية' : 'عادية'}</div>
                                            </div>
                                        ))}
                                        {dayAppts.length === 0 && dayTasks.length === 0 && <div className="text-center text-[10px] text-gray-300 py-4">- فارغ -</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <>
                    {/* Appointments Section */}
                    {appointments.length > 0 && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-orange-500" />
                                المواعيد القادمة
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {appointments.map(apt => (
                                    <div key={apt.id} className="border rounded-lg p-3 flex items-center justify-between bg-orange-50/30 border-orange-100">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{apt.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>{apt.date}</span>
                                                <span>•</span>
                                                <span>{apt.time}</span>
                                            </div>
                                            {apt.location && <p className="text-xs text-blue-500 mt-1">{apt.location}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            {/* Edit not hooked up yet */}
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDeleteAppointment(apt.id)}><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks & Projects */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-600" />
                            المهام والمشاريع الحالية
                        </h3>

                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`
                                    border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group
                                    ${task.priority === 'high' ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-transparent'}
                                    ${task.progress === 100 ? 'opacity-75 bg-gray-50' : ''}
                                `}
                            >
                                <div className="p-5 flex flex-wrap gap-4 justify-between items-start">

                                    {/* Progress Ring */}
                                    <div className="w-14 h-14 relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                className={`${task.progress === 100 ? 'text-green-500' : 'text-indigo-600'}`}
                                                strokeDasharray={138.2} strokeDashoffset={138.2 - (138.2 * task.progress) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">{task.progress}%</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className={`font-bold text-lg group-hover:text-indigo-600 transition-colors ${task.progress === 100 ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h4>
                                            {task.type === 'project' && <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">مشروع</Badge>}
                                            <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200 border' :
                                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200 border' :
                                                        'bg-blue-100 text-blue-700 border-blue-200 border'
                                                }`}>
                                                {task.priority === 'high' ? 'مستعجل' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
                                            </Badge>
                                        </div>
                                        {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>}
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${new Date(task.deadline) < new Date() && task.progress < 100 ? 'bg-red-50 text-red-500' : 'bg-gray-50'}`}>
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                {task.deadline}
                                            </span>
                                            {task.subtasks.length > 0 && (
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {task.type === 'task' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${pomodoro.taskId === task.id ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                                                onClick={() => pomodoro.taskId === task.id ? pomodoro.stop() : pomodoro.start(task.id)}
                                            >
                                                <Clock className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => onEditTask(task)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => onShareTask(task)}>
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50" onClick={() => onDeleteTask(task.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                                            {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Subtasks */}
                                {expandedTaskId === task.id && (
                                    <div className="bg-gray-50/50 p-4 border-t">
                                        <p className="text-xs font-bold text-gray-500 mb-2">المهام الفرعية</p>
                                        <div className="space-y-2 mb-3">
                                            {task.subtasks.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-2 group">
                                                    <input
                                                        type="checkbox"
                                                        checked={sub.completed}
                                                        onChange={() => onToggleSubtask(task.id, sub.id)}
                                                        className="accent-purple-600"
                                                    />
                                                    <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                                                    <Trash2
                                                        className="w-3 h-3 text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                                                        onClick={() => onDeleteSubtask(task.id, sub.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="مهمة فرعية جديدة..."
                                                className="h-8 text-xs bg-white"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onAddSubtask(task.id, e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
