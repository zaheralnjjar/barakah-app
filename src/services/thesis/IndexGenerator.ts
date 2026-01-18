import { ThesisNode, ThesisProject } from '@/types/thesis';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableOfContents, Header, Footer, PageNumber, NumberFormat } from 'docx';

export interface IndexEntry {
    text: string;
    reference: string; // سورة وآية، أو مصدر الحديث
    page?: number;
    count: number; // عدد مرات الورود
    locations: string[]; // المواقع (الفصول/المباحث)
}

export interface ThesisIndex {
    verses: IndexEntry[]; // الآيات
    hadiths: IndexEntry[]; // الأحاديث
    scholars: IndexEntry[]; // الأعلام
    terms: IndexEntry[]; // المصطلحات
}

export class IndexGenerator {

    /**
     * استخراج الآيات القرآنية من النص
     * Patterns: ﴿آية﴾ | {آية} | قال تعالى: "آية" | يقول الله تعالى ...
     */
    static extractVerses(content: string, location: string): IndexEntry[] {
        const verses: Map<string, IndexEntry> = new Map();

        // Pattern 1: ﴿...﴾ (Quranic brackets)
        const pattern1 = /﴿([^﴾]+)﴾/g;
        // Pattern 2: {...} (curly braces)
        const pattern2 = /\{([^}]+)\}/g;
        // Pattern 3: قال تعالى: "..." or قال الله تعالى: "..."
        const pattern3 = /قال\s+(?:الله\s+)?تعالى\s*[:\s]*[""«]([^""»]+)[""»]/g;
        // Pattern 4: يقول الله تعالى ... (without quotes - capture until end of sentence)
        const pattern4 = /(?:يقول|قال)\s+(?:الله\s+)?تعالى\s*[:\s]*([^.،\n]+)/g;
        // Pattern 5: Common Quran phrases without explicit markers
        const pattern5 = /(?:وقوله\s+تعالى|لقوله\s+تعالى)\s*[:\s]*([^.،\n]+)/g;

        const patterns = [pattern1, pattern2, pattern3, pattern4, pattern5];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const verseText = match[1].trim();
                if (verseText.length > 5) { // تجاهل النصوص القصيرة جداً
                    const key = verseText.substring(0, 50); // استخدام أول 50 حرف كمفتاح

                    if (verses.has(key)) {
                        const existing = verses.get(key)!;
                        existing.count++;
                        if (!existing.locations.includes(location)) {
                            existing.locations.push(location);
                        }
                    } else {
                        verses.set(key, {
                            text: verseText,
                            reference: '', // سيتم ملؤها لاحقاً
                            count: 1,
                            locations: [location]
                        });
                    }
                }
            }
        }

        return Array.from(verses.values());
    }

    /**
     * استخراج الأحاديث النبوية من النص
     */
    static extractHadiths(content: string, location: string): IndexEntry[] {
        const hadiths: Map<string, IndexEntry> = new Map();

        // Pattern 1: قال رسول الله ﷺ: "..." (with quotes)
        const pattern1 = /قال\s+(?:رسول\s+الله|النبي)\s*[ﷺ﷽]*\s*[:\s]*[""«]([^""»]+)[""»]/g;
        // Pattern 2: قال رسول الله ﷺ ... (without quotes - until period)
        const pattern2 = /قال\s+(?:رسول\s+الله|النبي)\s*[ﷺ﷽]*\s*[:\s]*([^.،\n]+)/g;
        // Pattern 3: عن ... قال: "..."
        const pattern3 = /عن\s+[^،]+\s+قال\s*[:\s]*[""«]([^""»]+)[""»]/g;
        // Pattern 4: روى ... أن النبي قال
        const pattern4 = /روى\s+[^:]+[:\s]+([^.]+\.)/g;
        // Pattern 5: Flexible "رسول الله" without قال
        const pattern5 = /(?:رسول\s+الله|النبي)\s*[ﷺ﷽]*\s*[:\s]+([^.،\n]+)/g;

        const patterns = [pattern1, pattern2, pattern3, pattern4, pattern5];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const hadithText = match[1].trim();
                if (hadithText.length > 10) {
                    const key = hadithText.substring(0, 50);

                    if (hadiths.has(key)) {
                        const existing = hadiths.get(key)!;
                        existing.count++;
                        if (!existing.locations.includes(location)) {
                            existing.locations.push(location);
                        }
                    } else {
                        hadiths.set(key, {
                            text: hadithText,
                            reference: '',
                            count: 1,
                            locations: [location]
                        });
                    }
                }
            }
        }

        return Array.from(hadiths.values());
    }

    /**
     * استخراج أسماء العلماء والأعلام
     */
    static extractScholars(content: string, location: string): IndexEntry[] {
        const scholars: Map<string, IndexEntry> = new Map();

        // قائمة بالألقاب الشائعة
        const titles = [
            'الإمام', 'الشيخ', 'العلامة', 'المحدث', 'الحافظ',
            'ابن', 'أبو', 'أبي', 'الدكتور', 'د\\.', 'الأستاذ'
        ];

        // Pattern: لقب + اسم
        const titlePattern = new RegExp(`(${titles.join('|')})\\s+([\\p{L}\\s]{3,30})`, 'gu');

        let match;
        while ((match = titlePattern.exec(content)) !== null) {
            const fullName = (match[1] + ' ' + match[2]).trim();
            const key = fullName.toLowerCase();

            if (scholars.has(key)) {
                const existing = scholars.get(key)!;
                existing.count++;
                if (!existing.locations.includes(location)) {
                    existing.locations.push(location);
                }
            } else {
                scholars.set(key, {
                    text: fullName,
                    reference: '',
                    count: 1,
                    locations: [location]
                });
            }
        }

        return Array.from(scholars.values());
    }

    /**
     * بناء الفهارس من هيكل الرسالة
     */
    static async buildIndex(structure: ThesisNode[], getContent: (node: ThesisNode) => Promise<string>): Promise<ThesisIndex> {
        const index: ThesisIndex = {
            verses: [],
            hadiths: [],
            scholars: [],
            terms: []
        };

        const processNode = async (node: ThesisNode) => {
            try {
                const content = await getContent(node);
                const location = node.title;

                // استخراج الآيات
                const nodeVerses = this.extractVerses(content, location);
                index.verses.push(...nodeVerses);

                // استخراج الأحاديث
                const nodeHadiths = this.extractHadiths(content, location);
                index.hadiths.push(...nodeHadiths);

                // استخراج الأعلام
                const nodeScholars = this.extractScholars(content, location);
                index.scholars.push(...nodeScholars);

                // معالجة العناصر الفرعية
                if (node.children) {
                    for (const child of node.children) {
                        await processNode(child);
                    }
                }
            } catch (e) {
                console.error('Error processing node:', node.title, e);
            }
        };

        for (const node of structure) {
            await processNode(node);
        }

        // ترتيب النتائج
        index.verses.sort((a, b) => b.count - a.count);
        index.hadiths.sort((a, b) => b.count - a.count);
        index.scholars.sort((a, b) => a.text.localeCompare(b.text, 'ar'));

        return index;
    }

    /**
     * توليد فهرس الآيات كملف Word
     */
    static async generateVersesIndexDoc(index: ThesisIndex): Promise<Blob> {
        const children: Paragraph[] = [
            new Paragraph({
                text: "فهرس الآيات القرآنية",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { after: 400 }
            })
        ];

        if (index.verses.length === 0) {
            children.push(new Paragraph({
                text: "لم يتم العثور على آيات قرآنية",
                alignment: AlignmentType.CENTER,
                bidirectional: true
            }));
        } else {
            for (const verse of index.verses) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: `﴿${verse.text.substring(0, 60)}${verse.text.length > 60 ? '...' : ''}﴾`, bold: true, font: 'Traditional Arabic', size: 28 }),
                        new TextRun({ text: ` - `, font: 'Traditional Arabic', size: 24 }),
                        new TextRun({ text: verse.locations.join('، '), font: 'Traditional Arabic', size: 24 })
                    ],
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { after: 200 }
                }));
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
                },
                children
            }]
        });

        return await Packer.toBlob(doc);
    }

    /**
     * توليد فهرس الأحاديث كملف Word
     */
    static async generateHadithsIndexDoc(index: ThesisIndex): Promise<Blob> {
        const children: Paragraph[] = [
            new Paragraph({
                text: "فهرس الأحاديث النبوية",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { after: 400 }
            })
        ];

        if (index.hadiths.length === 0) {
            children.push(new Paragraph({
                text: "لم يتم العثور على أحاديث",
                alignment: AlignmentType.CENTER,
                bidirectional: true
            }));
        } else {
            for (const hadith of index.hadiths) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: `"${hadith.text.substring(0, 80)}${hadith.text.length > 80 ? '...' : ''}"`, bold: true, font: 'Traditional Arabic', size: 26 }),
                        new TextRun({ text: ` - `, font: 'Traditional Arabic', size: 24 }),
                        new TextRun({ text: hadith.locations.join('، '), font: 'Traditional Arabic', size: 24 })
                    ],
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { after: 200 }
                }));
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
                },
                children
            }]
        });

        return await Packer.toBlob(doc);
    }

    /**
     * توليد فهرس الأعلام كملف Word
     */
    static async generateScholarsIndexDoc(index: ThesisIndex): Promise<Blob> {
        const children: Paragraph[] = [
            new Paragraph({
                text: "فهرس الأعلام",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { after: 400 }
            })
        ];

        if (index.scholars.length === 0) {
            children.push(new Paragraph({
                text: "لم يتم العثور على أعلام",
                alignment: AlignmentType.CENTER,
                bidirectional: true
            }));
        } else {
            for (const scholar of index.scholars) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: scholar.text, bold: true, font: 'Traditional Arabic', size: 26 }),
                        new TextRun({ text: ` (${scholar.count} مرات)`, font: 'Traditional Arabic', size: 22 }),
                        new TextRun({ text: ` - `, font: 'Traditional Arabic', size: 24 }),
                        new TextRun({ text: scholar.locations.slice(0, 3).join('، '), font: 'Traditional Arabic', size: 22 })
                    ],
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { after: 150 }
                }));
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
                },
                children
            }]
        });

        return await Packer.toBlob(doc);
    }
}
