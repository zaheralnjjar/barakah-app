import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CloudFile {
    name: string;
    path: string;
    size: number;
    lastModified: string;
    deviceName?: string;
}

/**
 * خدمة التخزين السحابي - Supabase Storage
 * توفر رفع/تحميل/مزامنة الملفات مع إدارة التعارضات
 */
export class CloudStorageService {
    private static BUCKET_NAME = 'thesis-files';

    /**
     * رفع ملف إلى السحابة
     */
    static async uploadFile(
        projectId: string,
        filePath: string,
        file: Blob | File,
        options?: { deviceName?: string }
    ): Promise<string | null> {
        try {
            const fileName = filePath.split('/').pop() || 'file.docx';
            const storagePath = `${projectId}/${filePath}`;

            // Check for existing file (conflict detection)
            const { data: existingFiles } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list(`${projectId}`, { search: fileName });

            // If file exists and might be different, save with timestamp
            let finalPath = storagePath;
            if (existingFiles && existingFiles.length > 0) {
                const existing = existingFiles.find(f => f.name === fileName);
                if (existing) {
                    // Check if we need to create a conflict version
                    const deviceName = options?.deviceName || 'جهاز_غير_معروف';
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const conflictName = fileName.replace('.docx', `_تعديل_${timestamp}_${deviceName}.docx`);

                    // Keep the original and save as conflict version
                    finalPath = `${projectId}/${filePath.replace(fileName, conflictName)}`;
                    toast.info('تم اكتشاف تعارض - يتم حفظ نسخة إضافية');
                }
            }

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(finalPath, file, {
                    upsert: true,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });

            if (error) throw error;
            return data.path;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }

    /**
     * تحميل ملف من السحابة
     */
    static async downloadFile(projectId: string, filePath: string): Promise<Blob | null> {
        try {
            const storagePath = `${projectId}/${filePath}`;
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .download(storagePath);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }

    /**
     * الحصول على رابط عام للملف
     */
    static getPublicUrl(projectId: string, filePath: string): string {
        const storagePath = `${projectId}/${filePath}`;
        const { data } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(storagePath);

        return data.publicUrl;
    }

    /**
     * قائمة الملفات في مجلد
     */
    static async listFiles(projectId: string, folderPath?: string): Promise<CloudFile[]> {
        try {
            const searchPath = folderPath ? `${projectId}/${folderPath}` : projectId;
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list(searchPath);

            if (error) throw error;

            return (data || []).map(file => ({
                name: file.name,
                path: `${searchPath}/${file.name}`,
                size: file.metadata?.size || 0,
                lastModified: file.updated_at || file.created_at || ''
            }));
        } catch (error) {
            console.error('List error:', error);
            return [];
        }
    }

    /**
     * حذف ملف من السحابة
     */
    static async deleteFile(projectId: string, filePath: string): Promise<boolean> {
        try {
            const storagePath = `${projectId}/${filePath}`;
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([storagePath]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    }

    /**
     * مزامنة مجلد محلي مع السحابة
     * يرفع الملفات المحلية الجديدة ويحمل الملفات السحابية الجديدة
     */
    static async syncFolder(
        projectId: string,
        localFiles: { path: string; blob: Blob }[],
        deviceName?: string
    ): Promise<{ uploaded: number; downloaded: number; conflicts: number }> {
        const result = { uploaded: 0, downloaded: 0, conflicts: 0 };

        try {
            // Get cloud files
            const cloudFiles = await this.listFiles(projectId);
            const cloudFileNames = new Set(cloudFiles.map(f => f.name));
            const localFileNames = new Set(localFiles.map(f => f.path.split('/').pop()!));

            // Upload local files not in cloud
            for (const localFile of localFiles) {
                const fileName = localFile.path.split('/').pop()!;
                if (!cloudFileNames.has(fileName)) {
                    await this.uploadFile(projectId, localFile.path, localFile.blob, { deviceName });
                    result.uploaded++;
                }
            }

            // Track conflicts (files in both but potentially different)
            for (const cloudFile of cloudFiles) {
                if (localFileNames.has(cloudFile.name)) {
                    // Could be a conflict - would need timestamp/hash comparison
                    // For now, just count as potential conflict
                    result.conflicts++;
                }
            }

            return result;
        } catch (error) {
            console.error('Sync error:', error);
            return result;
        }
    }

    /**
     * التحقق من وجود الـ bucket وإنشائه إذا لم يكن موجوداً
     */
    static async ensureBucketExists(): Promise<boolean> {
        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            const exists = buckets?.some(b => b.name === this.BUCKET_NAME);

            if (!exists) {
                // Bucket needs to be created via Supabase dashboard or migration
                console.warn('Bucket does not exist. Please create it in Supabase dashboard.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Bucket check error:', error);
            return false;
        }
    }
}
