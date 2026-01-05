
import { supabase } from "@/integrations/supabase/client";
import { ResearchProject, ResearchPhase, ResearchChapter, ResearchMaterial, ResearchCircle } from "@/components/AcademicManager";

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
    materials: []
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

    async createPhase(projectId: string, title: string, orderIndex: number): Promise<ResearchPhase> {
        const { data, error } = await supabase
            .from('academic_phases')
            .insert({
                project_id: projectId,
                title,
                order_index: orderIndex,
                status: 'pending'
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
                end_date: updates.endDate
            })
            .eq('id', id);
        if (error) throw error;
    },

    // --- Chapters ---
    async getChapters(phaseId: string): Promise<ResearchChapter[]> {
        const { data, error } = await supabase
            .from('academic_chapters')
            .select('*')
            .eq('phase_id', phaseId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            content: row.content, // Crucial for editing
            status: row.status as any,
            tasks: [],
            tags: row.tags // New field
        }));
    },

    async createChapter(phaseId: string, title: string, content: string = ''): Promise<ResearchChapter> {
        const { data, error } = await supabase
            .from('academic_chapters')
            .insert({
                phase_id: phaseId,
                title,
                content,
                status: 'pending',
                tags: []
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
            tasks: [],
            tags: []
        };
    },

    async updateChapter(id: string, updates: Partial<ResearchChapter>): Promise<void> {
        const { error } = await supabase
            .from('academic_chapters')
            .update({
                title: updates.title,
                content: updates.content,
                status: updates.status,
                tags: updates.tags
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

        return results;
    }
};
