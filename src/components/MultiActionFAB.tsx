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
    onAddNote, sizeMultiplier = 1, className = ""
}) => {
    // Base size 3.5rem (w-14) = 56px.
    // User passed 0.65 in App.tsx ~ 36px.
    const sizeStyle = {
        width: `${3.5 * sizeMultiplier}rem`,
        height: `${3.5 * sizeMultiplier}rem`
    };

    return (
        <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAddNote}
                style={sizeStyle}
                className="bg-gradient-to-tr from-emerald-500 to-green-600 rounded-full shadow-lg flex items-center justify-center text-white opacity-50 backdrop-blur-sm"
            >
                {/* Scale icon relative to button size roughly, or just keep it small */}
                <Plus style={{ width: '50%', height: '50%' }} />
            </motion.button>
        </div>
    );
};
