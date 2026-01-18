import { ThesisNode } from '@/types/thesis';

export interface ThesisTemplate {
    id: string;
    name: string;
    nameAr: string;
    description: string;
    structure: Partial<ThesisNode>[];
}

export const THESIS_TEMPLATES: ThesisTemplate[] = [
    {
        id: 'masters-thesis',
        name: 'Master\'s Thesis',
        nameAr: 'رسالة ماجستير',
        description: 'هيكل رسالة ماجستير كاملة مع جميع الفصول الأساسية',
        structure: [
            { title: 'المقدمة', type: 'chapter', order_index: 0 },
            { title: 'الإطار النظري', type: 'chapter', order_index: 1 },
            { title: 'الدراسات السابقة', type: 'chapter', order_index: 2 },
            { title: 'منهجية البحث', type: 'chapter', order_index: 3 },
            { title: 'نتائج الدراسة', type: 'chapter', order_index: 4 },
            { title: 'الخاتمة والتوصيات', type: 'chapter', order_index: 5 }
        ]
    },
    {
        id: 'phd-thesis',
        name: 'PhD Dissertation',
        nameAr: 'أطروحة دكتوراه',
        description: 'هيكل شامل لأطروحة دكتوراه مع فصول متعمقة',
        structure: [
            { title: 'المقدمة العامة', type: 'chapter', order_index: 0 },
            { title: 'الفصل التمهيدي: الإطار المنهجي', type: 'chapter', order_index: 1 },
            { title: 'الباب الأول: الإطار النظري', type: 'chapter', order_index: 2 },
            { title: 'الباب الثاني: الدراسة الميدانية', type: 'chapter', order_index: 3 },
            { title: 'الباب الثالث: النتائج والتحليل', type: 'chapter', order_index: 4 },
            { title: 'الخاتمة العامة', type: 'chapter', order_index: 5 },
            { title: 'الملاحق', type: 'chapter', order_index: 6 }
        ]
    },
    {
        id: 'research-paper',
        name: 'Research Paper',
        nameAr: 'بحث علمي',
        description: 'هيكل بحث علمي قصير',
        structure: [
            { title: 'المقدمة', type: 'chapter', order_index: 0 },
            { title: 'مراجعة الأدبيات', type: 'chapter', order_index: 1 },
            { title: 'المنهجية', type: 'chapter', order_index: 2 },
            { title: 'النتائج', type: 'chapter', order_index: 3 },
            { title: 'المناقشة', type: 'chapter', order_index: 4 },
            { title: 'الخلاصة', type: 'chapter', order_index: 5 }
        ]
    },
    {
        id: 'legal-thesis',
        name: 'Legal Thesis',
        nameAr: 'رسالة قانونية',
        description: 'هيكل رسالة في القانون والشريعة',
        structure: [
            { title: 'المقدمة', type: 'chapter', order_index: 0 },
            { title: 'الفصل التمهيدي: التعريفات والمفاهيم', type: 'chapter', order_index: 1 },
            { title: 'الباب الأول: الأحكام الموضوعية', type: 'chapter', order_index: 2 },
            { title: 'الباب الثاني: الأحكام الإجرائية', type: 'chapter', order_index: 3 },
            { title: 'الخاتمة والنتائج والتوصيات', type: 'chapter', order_index: 4 }
        ]
    },
    {
        id: 'islamic-studies',
        name: 'Islamic Studies Thesis',
        nameAr: 'رسالة في الدراسات الإسلامية',
        description: 'هيكل رسالة في الدراسات الإسلامية والفقه',
        structure: [
            { title: 'المقدمة', type: 'chapter', order_index: 0 },
            { title: 'الفصل التمهيدي: التعريف بموضوع البحث', type: 'chapter', order_index: 1 },
            { title: 'الباب الأول: الأصول والقواعد', type: 'chapter', order_index: 2 },
            { title: 'الباب الثاني: الفروع والتطبيقات', type: 'chapter', order_index: 3 },
            { title: 'الباب الثالث: المقارنة والترجيح', type: 'chapter', order_index: 4 },
            { title: 'الخاتمة', type: 'chapter', order_index: 5 }
        ]
    }
];

export const getTemplateById = (id: string): ThesisTemplate | undefined => {
    return THESIS_TEMPLATES.find(t => t.id === id);
};
