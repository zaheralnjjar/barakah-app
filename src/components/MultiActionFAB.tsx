import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface MultiActionFABProps {
    onAddNote: () => void;
    onVoiceNote?: () => void; // Optional now
    onAddAppointment?: () => void;
    onAddDistraction?: () => void;
    sizeMultiplier?: number;
    className?: string;
    isFixed?: boolean;
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onAddNote, className = ""
}) => {
    return (
        <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAddNote}
                className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white"
            >
                <Plus className="w-7 h-7" />
            </motion.button>
        </div>
    );
};
