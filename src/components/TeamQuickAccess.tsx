import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Users,
    Calculator,
    MapPin,
    BookOpen,
    Settings,
    Scale,
    Heart,
    Stethoscope,
    X
} from 'lucide-react';

interface TeamQuickAccessProps {
    onSelectAgent: (agentId: string) => void;
}

const agents = [
    { id: 'mohamed', name: 'محمد', icon: Calculator, color: 'bg-green-500' },
    { id: 'fatima', name: 'فاطمة', icon: MapPin, color: 'bg-blue-500' },
];

const TeamQuickAccess: React.FC<TeamQuickAccessProps> = ({ onSelectAgent }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (id: string) => {
        onSelectAgent(id);
        setIsOpen(false);
    };

    return (
        <div className="fixed right-4 bottom-6 z-[9999] flex flex-col-reverse items-end gap-2 pointer-events-auto">
            {/* Agent Icons */}
            {isOpen && (
                <div className="flex flex-col gap-2 animate-fade-in">
                    {agents.map((agent, index) => {
                        const Icon = agent.icon;
                        return (
                            <div key={agent.id} className="relative group">
                                <button
                                    onClick={() => handleSelect(agent.id)}
                                    className={`w-12 h-12 rounded-full ${agent.color} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                                {/* Name tooltip on hover */}
                                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap arabic-body pointer-events-none">
                                    {agent.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Main Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl ${isOpen ? 'bg-gray-600' : 'bg-indigo-600'} hover:scale-105 transition-all`}
                size="icon"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </Button>
        </div>
    );
};

export default TeamQuickAccess;
