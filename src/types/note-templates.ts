import { LucideIcon } from 'lucide-react';

export interface Template {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon | string | React.ComponentType<any>;
    category: string;
    type: 'simple' | 'smart-json';
    defaultColor?: string;
    content: string | any;
    isVisible?: boolean;
}
