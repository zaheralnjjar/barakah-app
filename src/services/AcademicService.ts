
import { supabase } from "@/integrations/supabase/client";
import { ResearchProject, ResearchPhase, ResearchChapter, ResearchMaterial, ResearchCircle, ResearchTask, SubTask } from "@/components/AcademicManager";

// Helper to convert DB rows to our Frontend types
// Note: This relies on strict type alignment, may need mappers if DB columns differ significantly
const mapProjectFromDB = (row: any): ResearchProject => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    supervisor: row.supervisor || '',
    institution: row.institution || '',
    startDate: row.start_date,
    deadline: row.deadline,
    phases: [],
    researchCircles: [],
    materials: [],
    references: []
});

export const AcademicService = {
    // --- Projects ---
    async getProjects(): Promise<ResearchProject[]> {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (!userId) {
            console.log("No user session found for academic projects");
            return [];
        }

        console.log("Fetching academic projects for user:", userId);

        const { data: projects, error } = await supabase
            .from('academic_projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching academic projects:", error);
            throw error;
        }

        if (!projects || projects.length === 0) {
            console.log("No academic projects found in DB");
            return [];
        }

        console.log(`Found ${projects.length} academic projects`);

        const fullProjects = await Promise.all(projects.map(async (p) => {
            const project = mapProjectFromDB(p);
            try {
                project.phases = await AcademicService.getPhases(p.id);
            } catch (e) {
                console.error(`Error fetching phases for project ${p.id}:`, e);
                project.phases = [];
            }
            try {
                project.materials = await AcademicService.getMaterials(p.id);
            } catch (e) {
                console.error(`Error fetching materials for project ${p.id}:`, e);
                project.materials = [];
            }
            try {
                project.researchCircles = await AcademicService.getCircles(p.id);
            } catch (e) {
                console.error(`Error fetching circles for project ${p.id}:`, e);
                project.researchCircles = [];
            }
            return project;
        }));

        return fullProjects;
    },

    async createProject(project: Partial<ResearchProject>): Promise<ResearchProject> {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('academic_projects')
            .insert({
                title: project.title,
                description: project.description,
                supervisor: project.supervisor,
                institution: project.institution,
                start_date: project.startDate,
                deadline: project.deadline,
                user_id: userId
            })
            .select()
            .single();

        if (error) throw error;
        return mapProjectFromDB(data);
    },

    async updateProject(id: string, updates: Partial<ResearchProject>): Promise<void> {
        const { error } = await supabase
            .from('academic_projects')
            .update({
                title: updates.title,
                description: updates.description,
                supervisor: updates.supervisor,
                institution: updates.institution,
                start_date: updates.startDate,
                deadline: updates.deadline
            })
            .eq('id', id);

        if (error) throw error;
    },

    // --- Phases ---
    async getPhases(projectId: string): Promise<ResearchPhase[]> {
        const { data, error } = await supabase
            .from('academic_phases')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        const phases = await Promise.all((data || []).map(async (row) => {
            const chapters = await AcademicService.getChapters(row.id);
            return {
                id: row.id,
                title: row.title,
                startDate: row.start_date,
                endDate: row.end_date,
                status: row.status as any,
                chapters: chapters,
                tasks: [] // Tasks not yet in DB schema based on migration, can be added later
            };
        }));
        return phases;
    },

    async createPhase(projectId: string, title: string, orderIndex: number, startDate?: string, endDate?: string): Promise<ResearchPhase> {
        const { data, error } = await supabase
            .from('academic_phases')
            .insert({
                project_id: projectId,
                title,
                order_index: orderIndex,
                status: 'pending',
                start_date: startDate,
                end_date: endDate
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status as any,
            chapters: [],
            tasks: []
        };
    },

    async deletePhase(phaseId: string): Promise<void> {
        const { error } = await supabase.from('academic_phases').delete().eq('id', phaseId);
        if (error) throw error;
    },

    async updatePhase(id: string, updates: Partial<ResearchPhase>): Promise<void> {
        const { error } = await supabase
            .from('academic_phases')
            .update({
                title: updates.title,
                status: updates.status,
                start_date: updates.startDate,
                end_date: updates.endDate,
                color: updates.color
            })
            .eq('id', id);
        if (error) throw error;
    },

    async reorderPhases(updates: { id: string, order_index: number }[]): Promise<void> {
        const { error } = await supabase
            .from('academic_phases')
            .upsert(updates.map(u => ({ id: u.id, order_index: u.order_index }))); // upsert updates existing rows based on PK
        if (error) throw error;
    },

    // --- Chapters ---
    async getChapters(phaseId: string): Promise<ResearchChapter[]> {
        const { data, error } = await supabase
            .from('academic_chapters')
            .select('*')
            .eq('phase_id', phaseId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Load tasks for each chapter
        const chapters = await Promise.all((data || []).map(async (ch) => {
            let tasks: ResearchTask[] = [];
            try {
                tasks = await AcademicService.getTasks(ch.id);
            } catch (e) {
                console.error(`Error fetching tasks for chapter ${ch.id}:`, e);
            }
            return {
                id: ch.id,
                title: ch.title,
                description: ch.description,
                content: ch.content,
                status: ch.status as any,
                startDate: ch.start_date,
                endDate: ch.end_date,
                tasks,
                tags: ch.tags || [],
                parentId: ch.parent_id,
                color: ch.color
            };
        }));
        return chapters;
    },

    async createChapter(phaseId: string, title: string, content: string = '', tags: string[] = [], startDate?: string, endDate?: string, parentId?: string): Promise<ResearchChapter> {
        const { data, error } = await supabase
            .from('academic_chapters')
            .insert({
                phase_id: phaseId,
                title,
                content,
                status: 'draft',
                tags: tags,
                start_date: startDate,
                end_date: endDate,
                parent_id: parentId
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            content: data.content,
            status: data.status as any,
            startDate: data.start_date,
            endDate: data.end_date,
            tasks: [],
            tags: data.tags,
            parentId: data.parent_id,
            color: data.color
        };
    },

    async updateChapter(id: string, updates: Partial<ResearchChapter>): Promise<void> {
        const { error } = await supabase
            .from('academic_chapters')
            .update({
                title: updates.title,
                content: updates.content,
                status: updates.status,
                tags: updates.tags,
                start_date: updates.startDate,
                end_date: updates.endDate,
                parent_id: updates.parentId,
                color: updates.color
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteChapter(id: string): Promise<void> {
        const { error } = await supabase.from('academic_chapters').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Materials ---
    async getMaterials(projectId: string): Promise<ResearchMaterial[]> {
        const { data, error } = await supabase
            .from('academic_materials')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            type: row.type as any,
            url: row.url,
            status: row.status as any,
            author: row.author,
            publisher: row.publisher,
            year: row.year,
            deathDate: row.death_date
        }));
    },

    async addMaterial(projectId: string, material: Omit<ResearchMaterial, 'id'>): Promise<ResearchMaterial> {
        const { data, error } = await supabase
            .from('academic_materials')
            .insert({
                project_id: projectId,
                title: material.title,
                type: material.type,
                url: material.url,
                status: material.status,
                author: material.author,
                publisher: material.publisher,
                year: material.year,
                death_date: material.deathDate,
                tags: material.tags
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            type: data.type as any,
            url: data.url,
            status: data.status as any,
            author: data.author,
            publisher: data.publisher,
            year: data.year,
            deathDate: data.death_date,
            tags: data.tags
        };
    },

    async updateMaterial(id: string, updates: Partial<ResearchMaterial>): Promise<void> {
        const { error } = await supabase
            .from('academic_materials')
            .update({
                title: updates.title,
                type: updates.type,
                url: updates.url,
                status: updates.status,
                author: updates.author,
                publisher: updates.publisher,
                year: updates.year,
                death_date: updates.deathDate,
                tags: updates.tags
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteMaterial(id: string): Promise<void> {
        const { error } = await supabase.from('academic_materials').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Circles ---
    async getCircles(projectId: string): Promise<ResearchCircle[]> {
        const { data: circles, error } = await supabase
            .from('academic_circles')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: false });

        if (error) {
            console.error("Supabase error in getCircles:", error);
            throw error;
        }
        return (circles || []).map(row => ({
            id: row.id,
            title: row.title,
            date: row.date,
            location: row.location,
            notes: row.notes,
            completed: row.completed
        }));
    },

    async addCircle(projectId: string, circle: Omit<ResearchCircle, 'id'>): Promise<ResearchCircle> {
        const { data, error } = await supabase
            .from('academic_circles')
            .insert({
                project_id: projectId,
                title: circle.title,
                date: circle.date,
                location: circle.location,
                notes: circle.notes,
                completed: circle.completed || false
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            date: data.date,
            location: data.location,
            notes: data.notes,
            completed: data.completed
        };
    },

    async updateCircle(id: string, updates: Partial<ResearchCircle>): Promise<void> {
        const { error } = await supabase
            .from('academic_circles')
            .update({
                title: updates.title,
                date: updates.date,
                location: updates.location,
                notes: updates.notes,
                completed: updates.completed
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteCircle(id: string): Promise<void> {
        const { error } = await supabase.from('academic_circles').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Tasks ---
    async getTasks(chapterId: string): Promise<ResearchTask[]> {
        const { data, error } = await supabase
            .from('academic_tasks')
            .select('*')
            .eq('chapter_id', chapterId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        const tasks = await Promise.all((data || []).map(async (row) => {
            const subtasks = await AcademicService.getSubtasks(row.id);
            return {
                id: row.id,
                title: row.title,
                description: row.description,
                content: row.content,
                deadline: row.deadline,
                status: row.status as any,
                priority: row.priority as any,
                subtasks
            };
        }));
        return tasks;
    },

    async createTask(chapterId: string, task: Partial<ResearchTask>): Promise<ResearchTask> {
        const { data: existingTasks } = await supabase
            .from('academic_tasks')
            .select('order_index')
            .eq('chapter_id', chapterId)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextOrder = (existingTasks?.[0]?.order_index ?? -1) + 1;

        const { data, error } = await supabase
            .from('academic_tasks')
            .insert({
                chapter_id: chapterId,
                title: task.title,
                description: task.description,
                content: task.content || '',
                deadline: task.deadline,
                status: task.status || 'pending',
                priority: task.priority || 'medium',
                order_index: nextOrder
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            content: data.content,
            deadline: data.deadline,
            status: data.status as any,
            priority: data.priority as any,
            subtasks: []
        };
    },

    async updateTask(id: string, updates: Partial<ResearchTask>): Promise<void> {
        const { error } = await supabase
            .from('academic_tasks')
            .update({
                title: updates.title,
                description: updates.description,
                content: updates.content,
                deadline: updates.deadline,
                status: updates.status,
                priority: updates.priority
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteTask(id: string): Promise<void> {
        const { error } = await supabase.from('academic_tasks').delete().eq('id', id);
        if (error) throw error;
    },

    async reorderTasks(updates: { id: string, order_index: number }[]): Promise<void> {
        for (const u of updates) {
            await supabase.from('academic_tasks').update({ order_index: u.order_index }).eq('id', u.id);
        }
    },

    // --- Subtasks ---
    async getSubtasks(taskId: string): Promise<SubTask[]> {
        const { data, error } = await supabase
            .from('academic_subtasks')
            .select('*')
            .eq('task_id', taskId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            date: row.date,
            time: row.time,
            completed: row.completed
        }));
    },

    async createSubtask(taskId: string, subtask: Partial<SubTask>): Promise<SubTask> {
        const { data: existingSubtasks } = await supabase
            .from('academic_subtasks')
            .select('order_index')
            .eq('task_id', taskId)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextOrder = (existingSubtasks?.[0]?.order_index ?? -1) + 1;

        const { data, error } = await supabase
            .from('academic_subtasks')
            .insert({
                task_id: taskId,
                title: subtask.title,
                date: subtask.date,
                time: subtask.time,
                completed: subtask.completed || false,
                order_index: nextOrder
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            date: data.date,
            time: data.time,
            completed: data.completed
        };
    },

    async updateSubtask(id: string, updates: Partial<SubTask>): Promise<void> {
        const { error } = await supabase
            .from('academic_subtasks')
            .update({
                title: updates.title,
                date: updates.date,
                time: updates.time,
                completed: updates.completed
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteSubtask(id: string): Promise<void> {
        const { error } = await supabase.from('academic_subtasks').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Global Search ---
    async globalSearch(term: string): Promise<any[]> {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return [];

        // Search Chapters
        const { data: chapters } = await supabase
            .from('academic_chapters')
            .select('id, title, content, phase_id')
            .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
            .limit(5);

        // Search Materials
        const { data: materials } = await supabase
            .from('academic_materials')
            .select('id, title, author')
            .or(`title.ilike.%${term}%,author.ilike.%${term}%`)
            .limit(5);

        // Search Tasks
        const { data: tasks } = await supabase
            .from('academic_tasks')
            .select('id, title, description, chapter_id')
            .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
            .limit(5);

        const results = [];

        if (chapters) {
            results.push(...chapters.map(c => ({
                type: 'chapter',
                title: c.title,
                context: c.content ? c.content.substring(0, 60) + '...' : 'فصل دراسي',
                id: c.id,
                phaseId: c.phase_id
            })));
        }

        if (materials) {
            results.push(...materials.map(m => ({
                type: 'material',
                title: m.title,
                context: m.author ? `المؤلف: ${m.author}` : 'مرجع',
                id: m.id
            })));
        }

        if (tasks) {
            results.push(...tasks.map(t => ({
                type: 'task',
                title: t.title,
                context: t.description ? t.description.substring(0, 60) + '...' : 'مهمة بحثية',
                id: t.id,
                chapterId: t.chapter_id
            })));
        }

        return results;
    }
};
