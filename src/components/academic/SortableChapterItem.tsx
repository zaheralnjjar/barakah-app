import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableChapterItemProps {
    id: string;
    children: React.ReactNode;
}

export function SortableChapterItem({ id, children }: SortableChapterItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
        position: 'relative' as const,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className="group/sortable-chapter relative">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute -right-1 top-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-purple-500 p-1 transition-colors opacity-0 group-hover/sortable-chapter:opacity-100 z-10"
            >
                <GripVertical className="w-4 h-4" />
            </div>
            {/* Content */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}

export default SortableChapterItem;
