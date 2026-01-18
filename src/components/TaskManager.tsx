import React, { useState } from 'react';
import { TaskSection } from './logistics/TaskSection';
import { useAppStore, Task } from '@/stores/useAppStore';

const TaskManager = () => {
    const {
        tasks,
        appointments,
        updateTask,
        deleteTask,
        deleteAppointment,
        addSubtask,
        toggleSubtask,
        deleteSubtask
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'task' | 'project' | 'appointment' | 'calendar'>('task');

    // Pomodoro State Implementation (Basic)
    const [pomodoroState, setPomodoroState] = useState({
        active: false,
        time: 25 * 60,
        taskId: null as string | null
    });

    const pomodoro = {
        active: pomodoroState.active,
        time: pomodoroState.time,
        taskId: pomodoroState.taskId,
        start: (id: string) => setPomodoroState({ ...pomodoroState, active: true, taskId: id }),
        stop: () => setPomodoroState({ ...pomodoroState, active: false, taskId: null }),
        format: () => {
            const minutes = Math.floor(pomodoroState.time / 60);
            const seconds = pomodoroState.time % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    // Handlers
    const handleEditTask = (task: Task) => {
        // Here we would typically open a dialog. For now, simple console log or TODO
        console.log("Edit task requested", task);
        // We can implement the edit dialog logic here or inside TaskSection if it handles it
    };

    const handleShareTask = (task: Task) => {
        const text = `مهمة: ${task.title}\n${task.description || ''}`;
        if (navigator.share) {
            navigator.share({ title: task.title, text }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            // toast here ideally
        }
    };

    // Subtask handlers need to match what TaskSection expects
    // TaskSection expects: (taskId: string, title: string) => void for add
    // Store has: addSubtask: (taskId, subtaskData)
    const handleAddSubtask = (taskId: string, title: string) => {
        addSubtask(taskId, { title, completed: false });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <TaskSection
                tasks={tasks as any} // Cast due to potential type mismatches in imports
                appointments={appointments as any}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onEditTask={handleEditTask}
                onDeleteTask={deleteTask}
                onShareTask={handleShareTask}
                onDeleteAppointment={deleteAppointment}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
                pomodoro={pomodoro}
            />
        </div>
    );
};

export default TaskManager;
