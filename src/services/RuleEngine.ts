import { useAutomationStore } from '@/store/useAutomationStore';
import { toast } from '@/hooks/use-toast';

// This service shouldn't be a hook, but a singleton or a stable object.
// For React context, we'll make a component 'AutomationProvider' that uses effects.

export const checkRules = (context: { type: string; value: any }) => {
    const { rules } = useAutomationStore.getState();

    const activeRules = rules.filter(r => r.isEnabled);

    activeRules.forEach(rule => {
        if (isTriggerMatch(rule, context)) {
            executeAction(rule);
        }
    });
};

const isTriggerMatch = (rule: any, context: { type: string; value: any }) => {
    if (rule.trigger.type !== context.type) return false;

    // Simple equality check for now. Can be expanded for regex, numbers, etc.
    if (rule.trigger.value === context.value) return true;

    // Special case for time (if we implement a minute-by-minute checker)
    // Special case for location (radius check) - logic to be added

    return false;
};

const executeAction = (rule: any) => {
    console.log(`Executing rule: ${rule.name}`);

    switch (rule.action.type) {
        case 'notification':
            toast({
                title: "⚡ إجراء تلقائي",
                description: rule.action.payload.message || rule.name,
            });
            // Also request system notification if supported
            if (Notification.permission === 'granted') {
                new Notification(rule.name, { body: rule.action.payload.message });
            }
            break;

        case 'sound':
            const audio = new Audio(rule.action.payload.soundUrl || '/sounds/notification.mp3');
            audio.play().catch(e => console.error("Audio play failed", e));
            break;

        case 'todo_add':
            {
                const taskTitle = rule.action.payload.title || rule.action.payload.message || "مهمة تلقائية";
                const habits = JSON.parse(localStorage.getItem('baraka_habits') || '[]');
                const newHabit = {
                    id: Date.now().toString(),
                    name: taskTitle,
                    streak: 0,
                    history: {},
                    frequency: 'daily',
                    customDays: [],
                    timesPerDay: 1,
                    timesCompleted: {}
                };
                localStorage.setItem('baraka_habits', JSON.stringify([...habits, newHabit]));
                window.dispatchEvent(new Event('habits-updated'));

                toast({
                    title: "تم إضافة مهمة تلقائياً",
                    description: taskTitle
                });
            }
            break;

        default:
            console.warn("Unknown action type", rule.action.type);
    }
};
