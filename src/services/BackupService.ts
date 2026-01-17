
import { ThesisProject } from '@/types/thesis';
import { ThesisService } from './thesis/ThesisService';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export const BackupService = {
    /**
     * Create a full backup of a project (Data + Files)
     */
    async createFullBackup(project: ThesisProject) {
        try {
            // 1. Get all project data
            const structure = await ThesisService.getStructure(project.id);
            const tasks = await ThesisService.getTasks(project.id);
            const milestones = await ThesisService.getMilestones(project.id);
            const references = await ThesisService.getReferences(project.id);

            const projectData = {
                project,
                structure,
                tasks,
                milestones,
                references,
                version: '2.0',
                exportedAt: new Date().toISOString()
            };

            // 2. Get folder path from project settings
            // If settings stored as JSON column
            const settings = project.settings as any;
            const folderPath = settings?.folder_path;

            // 3. Send to Electron
            // @ts-ignore
            if (window.electron && window.electron.ipcRenderer) {
                const toastId = toast.loading('جاري إنشاء النسخة الاحتياطية...');

                // @ts-ignore
                const result = await window.electron.ipcRenderer.invoke('backup:create', {
                    folderPath,
                    data: projectData
                });

                toast.dismiss(toastId);

                if (result.success) {
                    toast.success('تم إنشاء النسخة الاحتياطية بنجاح ✅');
                    return true;
                } else {
                    if (!result.canceled) toast.error(`فشل النسخ الاحتياطي: ${result.error}`);
                    return false;
                }
            } else {
                toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
                return false;
            }

        } catch (error: any) {
            console.error(error);
            toast.error(`خطأ: ${error.message}`);
            return false;
        }
    },

    /**
     * Restore a full backup
     */
    async restoreFullBackup() {
        try {
            // @ts-ignore
            if (!window.electron || !window.electron.ipcRenderer) {
                toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
                return false;
            }

            // 1. Select and Read Zip
            const toastId = toast.loading('جاري قراءة الملف...');
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('backup:restore');

            toast.dismiss(toastId);

            if (result.canceled) return false;
            if (!result.success) {
                toast.error(result.error);
                return false;
            }

            const { data, zipPath } = result;
            const project = data.project;

            // 2. Alert User and Ask for Folder Location
            // We need to know where to extract files. 
            // Ideally, we ask user to select a parent folder for the project.

            // Confirm restore
            if (!confirm(`هل تريد استعادة المشروع "${project.name}"؟`)) return false;

            // Ask for destination folder
            toast.info('الرجاء اختيار مجلد لاستخراج ملفات المشروع');
            // @ts-ignore
            const targetParentPath = await window.electron.ipcRenderer.invoke('dialog:openDirectory');

            if (!targetParentPath) return false;

            // 3. Restore Database Records
            // We might need to generate new IDs to avoid conflicts? 
            // Or assume overwrite/merge?
            // Let's check if project exists.
            const projects = await ThesisService.getProjects();
            const existing = projects.find(p => p.id === project.id);

            if (existing) {
                if (!confirm('المشروع موجود بالفعل. هل تريد استبداله؟')) return false;
                // Delete existing first? Or Upsert?
                await ThesisService.permanentDeleteProject(project.id);
            }

            // Insert Project
            // Ensure we update folder_path to the NEW location
            const projectFolderName = project.name.replace(/[^\w\s\-\.\u0600-\u06FF]/g, '_').trim();
            // @ts-ignore
            const pathSep = window.electron.offset ? '\\' : '/'; // Simple guess, mostly forward slash works in Node
            const newFolderPath = `${targetParentPath}/${projectFolderName}`; // Simplified path join

            const newSettings = { ...project.settings, folder_path: newFolderPath };

            await ThesisService.createProject({
                ...project,
                settings: newSettings
            });

            // Insert related data
            if (data.structure) {
                const { error } = await supabase.from('thesis_structure').insert(data.structure);
                if (error) console.error('Error restoring structure', error);
            }
            if (data.tasks) {
                const { error } = await supabase.from('thesis_tasks').insert(data.tasks);
                if (error) console.error('Error restoring tasks', error);
            }
            if (data.milestones) {
                const { error } = await supabase.from('thesis_milestones').insert(data.milestones);
                if (error) console.error('Error restoring milestones', error);
            }
            if (data.references) {
                const { error } = await supabase.from('thesis_references').insert(data.references);
                if (error) console.error('Error restoring references', error);
            }

            // 4. Extract Files
            const extractToast = toast.loading('جاري استخراج الملفات...');
            // @ts-ignore
            const extractResult = await window.electron.ipcRenderer.invoke('backup:extractFiles', {
                zipPath,
                targetFolder: newFolderPath // Extract INTO the new project folder
            });
            toast.dismiss(extractToast);

            if (extractResult.success) {
                toast.success('تمت الاستعادة بنجاح! 🎉');
                window.location.reload(); // Refresh to show new project
                return true;
            } else {
                toast.error(`تم استعادة البيانات ولكن فشل استخراج الملفات: ${extractResult.error}`);
                return false;
            }

        } catch (error: any) {
            console.error(error);
            toast.error(`خطأ في الاستعادة: ${error.message}`);
            return false;
        }
    }
};
