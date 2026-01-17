import { supabase } from '@/integrations/supabase/client';

export interface ThesisLink {
    id: string;
    project_id: string;
    source_node_id: string;
    target_node_id: string;
    link_type: 'reference' | 'related' | 'depends_on' | 'contradicts' | 'supports';
    description?: string;
    created_at?: string;
}

export const ZettelkastenService = {

    /**
     * الحصول على جميع الروابط لمشروع معين
     */
    async getLinks(projectId: string): Promise<ThesisLink[]> {
        // استخدام localStorage كبديل مؤقت حتى يتم إنشاء الجدول في قاعدة البيانات
        const stored = localStorage.getItem(`thesis_links_${projectId}`);
        if (stored) {
            return JSON.parse(stored) as ThesisLink[];
        }
        return [];
    },

    /**
     * إضافة رابط جديد
     */
    async addLink(link: Omit<ThesisLink, 'id' | 'created_at'>): Promise<ThesisLink> {
        const newLink: ThesisLink = {
            ...link,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        };

        const links = await this.getLinks(link.project_id);
        links.push(newLink);
        localStorage.setItem(`thesis_links_${link.project_id}`, JSON.stringify(links));

        return newLink;
    },

    /**
     * حذف رابط
     */
    async deleteLink(projectId: string, linkId: string): Promise<void> {
        const links = await this.getLinks(projectId);
        const filtered = links.filter(l => l.id !== linkId);
        localStorage.setItem(`thesis_links_${projectId}`, JSON.stringify(filtered));
    },

    /**
     * الحصول على روابط عنصر معين (كمصدر أو هدف)
     */
    async getNodeLinks(projectId: string, nodeId: string): Promise<ThesisLink[]> {
        const links = await this.getLinks(projectId);
        return links.filter(l => l.source_node_id === nodeId || l.target_node_id === nodeId);
    },

    /**
     * تحويل الروابط إلى صيغة الرسم البياني
     */
    async toGraphData(projectId: string, nodes: { id: string; title: string }[]): Promise<{
        nodes: { id: string; label: string }[];
        edges: { source: string; target: string; label: string }[];
    }> {
        const links = await this.getLinks(projectId);

        // فقط العناصر التي لها روابط
        const linkedNodeIds = new Set<string>();
        links.forEach(l => {
            linkedNodeIds.add(l.source_node_id);
            linkedNodeIds.add(l.target_node_id);
        });

        const graphNodes = nodes
            .filter(n => linkedNodeIds.has(n.id))
            .map(n => ({ id: n.id, label: n.title }));

        const linkTypeLabels: Record<string, string> = {
            reference: 'مرجع',
            related: 'متعلق',
            depends_on: 'يعتمد على',
            contradicts: 'يخالف',
            supports: 'يدعم'
        };

        const edges = links.map(l => ({
            source: l.source_node_id,
            target: l.target_node_id,
            label: linkTypeLabels[l.link_type] || l.link_type
        }));

        return { nodes: graphNodes, edges };
    }
};
