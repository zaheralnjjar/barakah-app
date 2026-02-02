import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    status: 'needsAction' | 'completed';
    due?: string;
    completed?: string;
}

export interface GoogleTaskList {
    id: string;
    title: string;
}

class GoogleTasksService {
    private accessToken: string | null = null;
    private initialized = false;

    async init() {
        if (this.initialized) return;
        if (Capacitor.getPlatform() !== 'web') {
            await GoogleAuth.initialize();
        }
        this.initialized = true;
    }

    async login() {
        await this.init();
        try {
            const user = await GoogleAuth.signIn();
            this.accessToken = user.authentication.accessToken;
            localStorage.setItem('google_tasks_token', this.accessToken || '');
            return user;
        } catch (error) {
            console.error('Google Login Error:', error);
            throw error;
        }
    }

    async getAccessToken() {
        if (!this.accessToken) {
            this.accessToken = localStorage.getItem('google_tasks_token');
        }
        return this.accessToken;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = await this.getAccessToken();
        if (!token) throw new Error('No Google Access Token');

        const response = await fetch(`https://tasks.googleapis.com/tasks/v1/${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Google Tasks API Error');
        }

        return response.json();
    }

    async getTaskLists(): Promise<GoogleTaskList[]> {
        const data = await this.request('users/@me/lists');
        return data.items || [];
    }

    async getOrCreateList(title: string): Promise<string> {
        const lists = await this.getTaskLists();
        const existing = lists.find(l => l.title === title);
        if (existing) return existing.id;

        const newList = await this.request('users/@me/lists', {
            method: 'POST',
            body: JSON.stringify({ title }),
        });
        return newList.id;
    }

    async getTasks(listId: string): Promise<GoogleTask[]> {
        const data = await this.request(`lists/${listId}/tasks?showCompleted=true&showHidden=true`);
        return data.items || [];
    }

    async createTask(listId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
        return this.request(`lists/${listId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(task),
        });
    }

    async updateTask(listId: string, taskId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
        return this.request(`lists/${listId}/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(task),
        });
    }

    async deleteTask(listId: string, taskId: string): Promise<void> {
        await this.request(`lists/${listId}/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }

    // Sync logic for Shopping List
    async syncShoppingList() {
        try {
            const listId = await this.getOrCreateList('Barakah Shopping');
            const googleTasks = await this.getTasks(listId);

            // Get local items from Supabase
            const { data: localItems, error } = await supabase
                .from('shopping_items')
                .select('*');

            if (error) throw error;

            // 1. Push new local items to Google
            for (const item of localItems || []) {
                if (!item.google_task_id) {
                    const created = await this.createTask(listId, {
                        title: item.text,
                        status: item.completed ? 'completed' : 'needsAction',
                        due: item.deadline,
                    });

                    await supabase
                        .from('shopping_items')
                        .update({
                            google_task_id: created.id,
                            google_list_id: listId,
                            last_synced_at: new Date().toISOString(),
                            sync_status: 'synced'
                        })
                        .eq('id', item.id);
                }
            }

            // 2. Pull new Google tasks to local
            for (const gTask of googleTasks) {
                const exists = localItems?.find(i => i.google_task_id === gTask.id);
                if (!exists) {
                    // Create locally
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) continue;

                    await supabase.from('shopping_items').insert({
                        user_id: user.id,
                        text: gTask.title,
                        completed: gTask.status === 'completed',
                        google_task_id: gTask.id,
                        google_list_id: listId,
                        last_synced_at: new Date().toISOString(),
                        sync_status: 'synced'
                    });
                } else {
                    // Update if Google is newer? (Simplified: overwrite local if status changed)
                    const gCompleted = gTask.status === 'completed';
                    if (exists.completed !== gCompleted) {
                        await supabase
                            .from('shopping_items')
                            .update({
                                completed: gCompleted,
                                last_synced_at: new Date().toISOString()
                            })
                            .eq('id', exists.id);
                    }
                }
            }
        } catch (err) {
            console.error('Sync Shopping List Error:', err);
        }
    }

    // Sync logic for General Tasks
    async syncTasks() {
        try {
            const listId = await this.getOrCreateList('Barakah Tasks');
            const googleTasks = await this.getTasks(listId);

            const { data: localTasks, error } = await supabase
                .from('tasks')
                .select('*');

            if (error) throw error;

            // 1. Push local to Google
            for (const task of localTasks || []) {
                if (!task.google_task_id) {
                    const created = await this.createTask(listId, {
                        title: task.title,
                        notes: task.description,
                        status: task.completed ? 'completed' : 'needsAction',
                        due: task.deadline,
                    });

                    await supabase
                        .from('tasks')
                        .update({
                            google_task_id: created.id,
                            google_list_id: listId,
                            last_synced_at: new Date().toISOString(),
                            sync_status: 'synced'
                        })
                        .eq('id', task.id);
                }
            }

            // 2. Pull Google to local
            for (const gTask of googleTasks) {
                const exists = localTasks?.find(t => t.google_task_id === gTask.id);
                if (!exists) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) continue;

                    await supabase.from('tasks').insert({
                        user_id: user.id,
                        title: gTask.title,
                        description: gTask.notes,
                        completed: gTask.status === 'completed',
                        deadline: gTask.due,
                        google_task_id: gTask.id,
                        google_list_id: listId,
                        last_synced_at: new Date().toISOString(),
                        sync_status: 'synced'
                    });
                } else {
                    const gCompleted = gTask.status === 'completed';
                    if (exists.completed !== gCompleted || exists.title !== gTask.title) {
                        await supabase
                            .from('tasks')
                            .update({
                                completed: gCompleted,
                                title: gTask.title,
                                description: gTask.notes,
                                last_synced_at: new Date().toISOString()
                            })
                            .eq('id', exists.id);
                    }
                }
            }
        } catch (err) {
            console.error('Sync Tasks Error:', err);
        }
    }
}

export const googleTasksService = new GoogleTasksService();
