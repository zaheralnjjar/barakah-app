import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    icon?: any;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string | number | null;
    isOpen?: boolean;
    onToggle?: () => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title, icon: Icon, children, defaultOpen = false, badge = null,
    isOpen: controlledIsOpen, onToggle
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    const isSectionOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const handleToggle = () => {
        if (onToggle) onToggle();
        else setInternalIsOpen(!internalIsOpen);
    };
    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden mb-3 transition-all duration-300">
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-transparent hover:border-gray-100"
                onClick={handleToggle}
            >
                <div className="flex items-center gap-2">
                    {Icon && <div className="p-1.5 bg-emerald-50 rounded-full"><Icon className="w-4 h-4 text-emerald-600" /></div>}
                    <span className="text-sm font-bold text-gray-700">{title}</span>
                    {badge && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600">{badge}</Badge>}
                </div>
                {isSectionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
            {isSectionOpen && <div className="p-0 animate-in slide-in-from-top-2 duration-300">{children}</div>}
        </Card>
    );
};
