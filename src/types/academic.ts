export interface SubTask {
    id: string;
    title: string;
    date?: string;
    time?: string;
    completed: boolean;
}

export interface ResearchTask {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    subtasks: SubTask[];
}

export interface ResearchChapter {
    id: string;
    title: string;
    description?: string;
    content?: string; // For drafting (Keep style)
    status: 'pending' | 'in_progress' | 'completed';
    tasks: ResearchTask[];
    tags?: string[];
    startDate?: string;
    endDate?: string;
    parentId?: string;
    color?: string;
}

export interface ResearchPhase {
    id: string;
    title: string;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chapters: ResearchChapter[];
    tasks: ResearchTask[];
    tags?: string[];
    color?: string;
    order?: number;
}

export interface ResearchCircle {
    id: string;
    title: string;
    date: string;
    location?: string;
    notes?: string;
    completed: boolean;
}

export interface ResearchMaterial {
    id: string;
    title: string;
    type: 'book' | 'paper' | 'link' | 'other';
    url?: string;
    status: 'to_read' | 'reading' | 'read';
    author?: string;
    publisher?: string;
    year?: string;
    deathDate?: string;
    tags?: string[];
}

export interface ResearchProject {
    id: string;
    title: string;
    description: string;
    supervisor: string;
    institution: string;
    startDate?: string;
    deadline?: string;
    phases: ResearchPhase[];
    researchCircles: ResearchCircle[];
    materials: ResearchMaterial[];
    references: any[]; // Placeholder for now
}

export interface AcademicProject {
    id: string;
    title: string;
    description: string;
    type: 'thesis' | 'research' | 'assignment';
    progress: number;
    deadline?: string;
    startDate: string;
    phases: ResearchPhase[];
    materials: ResearchMaterial[];
    circles: ResearchCircle[]; // حلقات البحث
    lastUpdated: string;
}
