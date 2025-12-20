import React from 'react';
import { Card } from '@/components/ui/card';
import { Calculator, MapPin, ShoppingCart, Clock, DollarSign, Plus, CheckSquare } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
}

interface QuickActionsProps {
    onAddExpense?: () => void;
    onAddAppointment?: () => void;
    onOpenShoppingList?: () => void;
    onAddTask?: () => void;
    onSaveLocation?: () => void;
    onAddIncome?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
    onAddExpense,
    onAddAppointment,
    onOpenShoppingList,
    onAddTask,
    onSaveLocation,
    onAddIncome,
}) => {
    // Get enabled shortcuts from store (default to all if not set)
    const quickActions = useAppStore((state) => state.quickActions || [
        'expense',
        'appointment',
        'shopping',
    ]);

    const allActions: Record<string, QuickAction> = {
        expense: {
            id: 'expense',
            label: 'إضافة مصروف',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'bg-red-100 text-red-600',
            onClick: () => onAddExpense?.(),
        },
        income: {
            id: 'income',
            label: 'إضافة دخل',
            icon: <Plus className="w-6 h-6" />,
            color: 'bg-green-100 text-green-600',
            onClick: () => onAddIncome?.(),
        },
        appointment: {
            id: 'appointment',
            label: 'إضافة موعد',
            icon: <Clock className="w-6 h-6" />,
            color: 'bg-blue-100 text-blue-600',
            onClick: () => onAddAppointment?.(),
        },
        shopping: {
            id: 'shopping',
            label: 'قائمة تسوق',
            icon: <ShoppingCart className="w-6 h-6" />,
            color: 'bg-green-100 text-green-600',
            onClick: () => onOpenShoppingList?.(),
        },
        task: {
            id: 'task',
            label: 'إضافة مهمة',
            icon: <CheckSquare className="w-6 h-6" />,
            color: 'bg-purple-100 text-purple-600',
            onClick: () => onAddTask?.(),
        },
        location: {
            id: 'location',
            label: 'حفظ الموقع',
            icon: <MapPin className="w-6 h-6" />,
            color: 'bg-orange-100 text-orange-600',
            onClick: () => onSaveLocation?.(),
        },
    };

    const activeActions = quickActions
        .map((id) => allActions[id])
        .filter(Boolean);

    if (activeActions.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            {activeActions.map((action) => (
                <Card
                    key={action.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95"
                    onClick={action.onClick}
                >
                    <div className="p-4 flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-xl ${action.color}`}>
                            {action.icon}
                        </div>
                        <span className="text-xs font-medium text-center">
                            {action.label}
                        </span>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default QuickActions;
