/**
 * خدمة تعدد المسودات - حفظ واستعادة نسخ من الهيكل
 * يستخدم localStorage كبديل مؤقت
 */

import { ThesisNode } from '@/types/thesis';

export interface ThesisVersion {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    structure: ThesisNode[];
    created_at: string;
}

export const VersioningService = {

    /**
     * الحصول على جميع المسودات لمشروع
     */
    async getVersions(projectId: string): Promise<ThesisVersion[]> {
        const stored = localStorage.getItem(`thesis_versions_${projectId}`);
        if (stored) {
            return JSON.parse(stored) as ThesisVersion[];
        }
        return [];
    },

    /**
     * حفظ مسودة جديدة
     */
    async saveVersion(projectId: string, name: string, structure: ThesisNode[], description?: string): Promise<ThesisVersion> {
        const newVersion: ThesisVersion = {
            id: crypto.randomUUID(),
            project_id: projectId,
            name,
            description,
            structure: JSON.parse(JSON.stringify(structure)), // نسخة عميقة
            created_at: new Date().toISOString()
        };

        const versions = await this.getVersions(projectId);
        versions.unshift(newVersion); // أحدث في البداية

        // الاحتفاظ بآخر 10 مسودات فقط
        const trimmed = versions.slice(0, 10);
        localStorage.setItem(`thesis_versions_${projectId}`, JSON.stringify(trimmed));

        return newVersion;
    },

    /**
     * حذف مسودة
     */
    async deleteVersion(projectId: string, versionId: string): Promise<void> {
        const versions = await this.getVersions(projectId);
        const filtered = versions.filter(v => v.id !== versionId);
        localStorage.setItem(`thesis_versions_${projectId}`, JSON.stringify(filtered));
    },

    /**
     * الحصول على مسودة محددة
     */
    async getVersion(projectId: string, versionId: string): Promise<ThesisVersion | null> {
        const versions = await this.getVersions(projectId);
        return versions.find(v => v.id === versionId) || null;
    },

    /**
     * مقارنة مسودتين
     */
    compareVersions(v1: ThesisVersion, v2: ThesisVersion): {
        added: string[];
        removed: string[];
        modified: string[];
    } {
        const getNodeIds = (nodes: ThesisNode[]): Map<string, string> => {
            const map = new Map<string, string>();
            const traverse = (items: ThesisNode[]) => {
                items.forEach(n => {
                    map.set(n.id, n.title);
                    if (n.children) traverse(n.children);
                });
            };
            traverse(nodes);
            return map;
        };

        const map1 = getNodeIds(v1.structure);
        const map2 = getNodeIds(v2.structure);

        const added: string[] = [];
        const removed: string[] = [];
        const modified: string[] = [];

        // العناصر الجديدة في v2
        map2.forEach((title, id) => {
            if (!map1.has(id)) {
                added.push(title);
            } else if (map1.get(id) !== title) {
                modified.push(title);
            }
        });

        // العناصر المحذوفة من v1
        map1.forEach((title, id) => {
            if (!map2.has(id)) {
                removed.push(title);
            }
        });

        return { added, removed, modified };
    }
};
