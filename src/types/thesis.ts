export interface ThesisProject {
    id: string;
    user_id?: string;
    name: string;
    title?: string;
    description?: string;
    path?: string; // For electron local path
    target_chapters?: number;
    target_words?: number;
    settings?: ThesisSettings;
    is_default?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;  // Trash system
    deleted_by?: string | null;  // Trash system
    // New fields for project setup
    supervisor?: string;          // المشرف الأكاديمي
    university?: string;          // المؤسسة/الجامعة
    start_date?: string;          // تاريخ البدء
    deadline?: string;            // الموعد النهائي
    template?: 'thesis' | 'research' | 'paper' | 'custom';  // قالب المشروع
    storage_mode?: 'local' | 'cloud' | 'hybrid';  // وضع التخزين
}

export interface ThesisSettings {
    formatting?: FormattingSettings;
    [key: string]: any;
}

export interface FormattingSettings {
    headings: TextStyle;
    body: TextStyle;
    bodyLatin: TextStyle; // New: Foreign/Latin text settings
    footnotes: TextStyle;
    page: PageSettings;
}

export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    isBold: boolean;
    alignment: 'right' | 'left' | 'center' | 'justify';
}

export interface PageSettings {
    margins: {
        top: number;
        bottom: number;
        right: number;
        left: number;
    };
    pageNumbering: boolean;
}

export interface ThesisNode {
    id: string;
    project_id: string;
    parent_id?: string | null;
    type: 'chapter' | 'section' | 'subsection' | 'branch' | 'topic' | 'issue';
    title: string;
    order_index?: number;
    // New fields for milestones
    milestone_date?: string;      // تاريخ المجازة (Deadline/Milestone)
    reminder_date?: string;       // تاريخ التذكير
    reminder_id?: string;
    file_order?: string[]; // Array of filenames in order
    file_path?: string;         // ID of the linked appointment in 'appointments' table

    // Authorization & Sync
    last_synced_at?: string;
    file_last_modified?: string;
    content?: string; // Text content for search

    children?: ThesisNode[];
    // Colored tags - status indicator
    status?: 'draft' | 'in_progress' | 'review' | 'completed' | 'on_hold';
    notes?: string;
    word_count?: number;
}

// Status colors and labels for UI
export const NODE_STATUS_CONFIG = {
    draft: {
        label: 'مسودة',
        color: 'bg-gray-200 text-gray-700',
        dotColor: 'bg-gray-400'
    },
    in_progress: {
        label: 'قيد العمل',
        color: 'bg-blue-100 text-blue-700',
        dotColor: 'bg-blue-500'
    },
    review: {
        label: 'مراجعة',
        color: 'bg-amber-100 text-amber-700',
        dotColor: 'bg-amber-500'
    },
    completed: {
        label: 'مكتمل',
        color: 'bg-green-100 text-green-700',
        dotColor: 'bg-green-500'
    },
    on_hold: {
        label: 'معلق',
        color: 'bg-red-100 text-red-700',
        dotColor: 'bg-red-500'
    }
} as const;

export interface ThesisTask {
    id: string;
    project_id: string;
    title: string;
    completed: boolean;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    chapter_id?: string;
    start_date?: string;
    end_date?: string; // Due date
    reminder_time?: string;
    notes?: string;
    created_at?: string;
}

export interface ThesisMilestone {
    id: string;
    project_id: string;
    title: string;
    date: string;
    time?: string;
    type: 'deadline' | 'milestone' | 'meeting';
    notes?: string;
}

export interface TrashedProject extends ThesisProject {
    deleted_at: string;
    deleted_by: string;
    days_in_trash: number;
}

export interface ThesisReference {
    id: string;
    project_id: string;
    title: string;
    author?: string;
    type?: string;
    year?: string;
    publisher?: string;
    pages?: string;
    url?: string;
    created_at?: string;
}
