
import { supabase } from "@/integrations/supabase/client";
import { ThesisProject, ThesisNode, ThesisTask, ThesisMilestone, ThesisReference } from "@/types/thesis";
import { logger } from "./LoggerService";

export const ThesisService = {
    // --- Projects ---
    async getProjects() {
        // Try with deleted_at filter first, fallback to simple query if column doesn't exist
        try {
            const { data, error } = await supabase
                .from('thesis_projects')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                // If error is about deleted_at column, fallback to simple query
                if (error.message?.includes('deleted_at')) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('thesis_projects')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (fallbackError) throw fallbackError;
                    return fallbackData as ThesisProject[];
                }
                throw error;
            }
            return data as ThesisProject[];
        } catch (e) {
            // Ultimate fallback - simple query without filter
            const { data, error } = await supabase
                .from('thesis_projects')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as ThesisProject[];
        }
    },

    async createProject(project: Partial<ThesisProject>) {
        // 1. Create Project
        const { data: newProject, error } = await supabase
            .from('thesis_projects')
            .insert([project])
            .select()
            .single();

        if (error) throw error;

        // 2. Generate Structure from Template
        const settings = project.settings as any;
        const templateName = settings?.template || 'thesis';

        try {
            // Import templates (dynamic import to avoid bundling issues if strictly frontend)
            // But since this is a service, standard import or fetch is better.
            // Using require/import based on environment might be tricky. 
            // Let's assume the JSON is available via import.
            // We will need to add the import at the top of the file or fetch it.
            // For now, let's mock/hardcode or fetch. 
            // Better: Import the JSON at the top of this file.

            const templates = (await import('@/data/thesis_templates.json')).default as any;
            const selectedTemplate = templates[templateName] || templates['thesis'];

            if (selectedTemplate && selectedTemplate.structure) {
                const nodesToInsert = selectedTemplate.structure.map((item: any, index: number) => ({
                    project_id: newProject.id,
                    title: item.title,
                    type: item.type,
                    order_index: index,
                    status: 'draft'
                }));

                const { error: structError } = await supabase
                    .from('thesis_structure')
                    .insert(nodesToInsert);

                if (structError) console.error("Error creating template structure:", structError);
            }

        } catch (e) {
            console.error("Template generation failed", e);
        }

        return newProject as ThesisProject;
    },

    async getNode(id: string) {
        const { data, error } = await supabase
            .from('thesis_structure')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as ThesisNode;
    },

    async updateProject(id: string, updates: Partial<ThesisProject>) {
        const { data, error } = await supabase
            .from('thesis_projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ThesisProject;
    },

    // Soft delete - move to trash
    async softDeleteProject(id: string) {
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('thesis_projects')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.user?.id
            })
            .eq('id', id);
        if (error) throw error;
    },

    // Restore from trash
    async restoreProject(id: string) {
        const { error } = await supabase
            .from('thesis_projects')
            .update({
                deleted_at: null,
                deleted_by: null
            })
            .eq('id', id);
        if (error) throw error;
    },

    // Get trashed projects
    async getTrashedProjects() {
        const { data, error } = await supabase
            .from('thesis_projects')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

        if (error) throw error;

        // Add days_in_trash calculation
        return (data || []).map((project: ThesisProject) => ({
            ...project,
            days_in_trash: Math.floor(
                (Date.now() - new Date(project.deleted_at!).getTime()) / (1000 * 60 * 60 * 24)
            )
        }));
    },

    // Permanent delete (from trash)
    async permanentDeleteProject(id: string) {
        // Delete related data first
        await supabase.from('thesis_structure').delete().eq('project_id', id);
        await supabase.from('thesis_tasks').delete().eq('project_id', id);
        await supabase.from('thesis_milestones').delete().eq('project_id', id);
        await supabase.from('thesis_references').delete().eq('project_id', id);

        // Delete project
        const { error } = await supabase
            .from('thesis_projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Legacy delete - now soft delete
    async deleteProject(id: string) {
        return this.softDeleteProject(id);
    },

    // --- Structure (Chapters, etc.) ---
    async getStructure(projectId: string) {
        const { data, error } = await supabase
            .from('thesis_structure')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        // Build tree
        const nodes = data as ThesisNode[];
        const nodeMap = new Map<string, ThesisNode>();
        nodes.forEach(node => nodeMap.set(node.id, { ...node, children: [] }));

        const rootNodes: ThesisNode[] = [];
        nodes.forEach(node => {
            if (node.parent_id && nodeMap.has(node.parent_id)) {
                nodeMap.get(node.parent_id)!.children!.push(nodeMap.get(node.id)!);
            } else {
                rootNodes.push(nodeMap.get(node.id)!);
            }
        });

        return rootNodes; // Returns hierarchy
    },

    async addNode(node: Partial<ThesisNode>) {
        const { data, error } = await supabase
            .from('thesis_structure')
            .insert([node])
            .select()
            .single();
        if (error) throw error;
        return data as ThesisNode;
    },

    async updateNode(id: string, updates: Partial<ThesisNode>) {
        // Create safe updates (remove potentially non-existent columns)
        const safeUpdates: Record<string, any> = {};
        const knownColumns = ['parent_id', 'type', 'title', 'order_index', 'file_path', 'file_order'];
        const newColumns = ['status', 'notes', 'word_count', 'milestone_date', 'reminder_date', 'reminder_id'];

        // Add known columns
        for (const key of knownColumns) {
            if (key in updates) {
                safeUpdates[key] = (updates as any)[key];
            }
        }

        // Try with new columns first
        for (const key of newColumns) {
            if (key in updates) {
                safeUpdates[key] = (updates as any)[key];
            }
        }

        try {
            const { data, error } = await supabase
                .from('thesis_structure')
                .update(safeUpdates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data as ThesisNode;
        } catch (e: any) {
            // If error mentions status/notes/word_count, retry without them
            if (e?.message?.includes('status') || e?.message?.includes('notes') || e?.message?.includes('word_count') || e?.code === '42703') {
                logger.warn('New columns not available. Run migration to enable all features.');

                // Remove new columns
                for (const key of newColumns) {
                    delete safeUpdates[key];
                }

                if (Object.keys(safeUpdates).length === 0) {
                    throw new Error('لا يوجد بيانات للتحديث');
                }

                const { data, error } = await supabase
                    .from('thesis_structure')
                    .update(safeUpdates)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as ThesisNode;
            }
            throw e;
        }
    },

    async deleteNode(id: string) {
        const { error } = await supabase
            .from('thesis_structure')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Tasks ---
    async getTasks(projectId: string) {
        const { data, error } = await supabase
            .from('thesis_tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ThesisTask[];
    },

    async saveTask(task: Partial<ThesisTask>) {
        if (task.id && !task.id.startsWith('temp')) {
            const { data, error } = await supabase
                .from('thesis_tasks')
                .update(task)
                .eq('id', task.id)
                .select()
                .single();
            if (error) throw error;
            return data as ThesisTask;
        } else {
            const { id, ...newTask } = task; // Remove temp ID
            const { data, error } = await supabase
                .from('thesis_tasks')
                .insert([newTask])
                .select()
                .single();
            if (error) throw error;
            return data as ThesisTask;
        }
    },

    async deleteTask(id: string) {
        const { error } = await supabase.from('thesis_tasks').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Milestones ---
    async getMilestones(projectId: string) {
        const { data, error } = await supabase
            .from('thesis_milestones')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: true });
        if (error) throw error;
        return data as ThesisMilestone[];
    },

    async saveMilestone(milestone: Partial<ThesisMilestone>) {
        if (milestone.id && !milestone.id.startsWith('temp')) {
            const { data, error } = await supabase.from('thesis_milestones').update(milestone).eq('id', milestone.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newM } = milestone;
            const { data, error } = await supabase.from('thesis_milestones').insert([newM]).select().single();
            if (error) throw error;
            return data;
        }
    },

    async deleteMilestone(id: string) {
        const { error } = await supabase.from('thesis_milestones').delete().eq('id', id);
        if (error) throw error;
    },

    // --- References ---
    async getReferences(projectId: string) {
        const { data, error } = await supabase
            .from('thesis_references')
            .select('*')
            .eq('project_id', projectId)
            .order('title', { ascending: true });
        if (error) throw error;
        return data as ThesisReference[];
    },

    async addReference(ref: Partial<ThesisReference>) {
        const { data, error } = await supabase
            .from('thesis_references')
            .insert([ref])
            .select()
            .single();
        if (error) throw error;
        return data as ThesisReference;
    },

    async updateReference(id: string, updates: Partial<ThesisReference>) {
        const { data, error } = await supabase
            .from('thesis_references')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as ThesisReference;
    },

    async deleteReference(id: string) {
        const { error } = await supabase.from('thesis_references').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Global Search ---
    async searchNodes(projectId: string, query: string): Promise<ThesisNode[]> {
        if (!query.trim()) return [];

        const { data, error } = await supabase
            .from('thesis_structure')
            .select('*')
            .eq('project_id', projectId)
            .ilike('title', `%${query}%`)
            .order('order_index');

        if (error) throw error;
        return data as ThesisNode[];
    },

    async searchAllProjects(query: string): Promise<{ project: ThesisProject; nodes: ThesisNode[] }[]> {
        if (!query.trim()) return [];

        const projects = await this.getProjects();
        const results: { project: ThesisProject; nodes: ThesisNode[] }[] = [];

        for (const project of projects) {
            const nodes = await this.searchNodes(project.id, query);
            if (nodes.length > 0) {
                results.push({ project, nodes });
            }
        }

        return results;
    }
};
