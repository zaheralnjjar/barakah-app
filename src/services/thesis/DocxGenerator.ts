import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header, Footer, PageNumber, BorderStyle, FootnoteReferenceRun, Bookmark, ExternalHyperlink, InternalHyperlink, PageBreak } from 'docx';
import { ThesisNode, ThesisProject, ThesisSettings, FormattingSettings, TextStyle } from '@/types/thesis';

export class DocxGenerator {
    private static mmToTwip(mm: number): number {
        return Math.round((mm / 25.4) * 1440);
    }

    private static getAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
        switch (align) {
            case 'left': return AlignmentType.LEFT;
            case 'center': return AlignmentType.CENTER;
            case 'justify': return AlignmentType.JUSTIFIED;
            case 'right':
            default: return AlignmentType.RIGHT;
        }
    }

    private static createTextStyle(text: string, style?: TextStyle, latinStyle?: TextStyle, overrides: any = {}) {
        return new TextRun({
            text: text,
            font: {
                cs: style?.fontFamily || "Traditional Arabic",
                ascii: latinStyle?.fontFamily || "Times New Roman",
                hAnsi: latinStyle?.fontFamily || "Times New Roman",
                eastAsia: latinStyle?.fontFamily || "Times New Roman",
            },
            size: (style?.fontSize || 16) * 2, // docx uses half-points
            color: style?.color || "000000",
            bold: style?.isBold,
            rightToLeft: true,
            language: {
                value: "ar-SA"
            },
            ...overrides
        });
    }


    public static async generateNodeDoc(node: ThesisNode, settings?: ThesisSettings): Promise<Blob> {
        const formatting = settings?.formatting;

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: this.mmToTwip(25.4),
                            bottom: this.mmToTwip(25.4),
                            left: this.mmToTwip(31.7),
                            right: this.mmToTwip(31.7),
                        }
                    }
                    // Note: RTL is handled at paragraph level via bidirectional: true
                },
                children: [
                    // العنوان
                    new Paragraph({
                        text: node.title,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.RIGHT,
                        bidirectional: true,
                        spacing: { after: 400, before: 200 }
                    }),
                    // النص البسيط
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "ابدأ الكتابة هنا...",
                                font: {
                                    cs: formatting?.body?.fontFamily || "Traditional Arabic",
                                    ascii: formatting?.body?.fontFamily || "Traditional Arabic"
                                },
                                size: (formatting?.body?.fontSize || 14) * 2,
                                rightToLeft: true,
                                language: {
                                    value: "ar-SA"
                                }
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        bidirectional: true,
                        spacing: { after: 200, line: 360 }
                    })
                ]
            }]
        });

        return await Packer.toBlob(doc);
    }

    public static async generateMasterDoc(project: ThesisProject, structure: ThesisNode[]): Promise<Blob> {
        const formatting = project.settings?.formatting;
        const latinStyle = formatting?.bodyLatin;


        const sections = [];

        // Title Page (Simplified)
        sections.push({
            properties: {
                page: {
                    margin: {
                        top: this.mmToTwip(formatting?.page?.margins?.top || 25.4),
                        bottom: this.mmToTwip(formatting?.page?.margins?.bottom || 25.4),
                        left: this.mmToTwip(formatting?.page?.margins?.left || 31.7),
                        right: this.mmToTwip(formatting?.page?.margins?.right || 31.7),
                    }
                }
            },
            children: [
                new Paragraph({
                    text: project.name,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    spacing: { before: 4000, after: 4000 } // Big spacing
                }),
                new Paragraph({
                    text: "إعداد الباحث",
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: "نسخة مسودة",
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    spacing: { before: 200 }
                }),
            ]
        });

        // Table of Contents Section
        const tocChildren: any[] = [];

        tocChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "فهرس المحتويات",
                        font: { cs: "Traditional Arabic", ascii: "Times New Roman" },
                        size: 36,
                        bold: true,
                        rightToLeft: true
                    })
                ],
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { before: 400, after: 600 },
                border: {
                    bottom: { style: BorderStyle.DOUBLE, size: 3, space: 10, color: "000000" }
                }
            })
        );

        // Page counter for simulated page numbers
        let pageCounter = 1;

        // Build TOC entries recursively with proper Arabic formatting
        const buildTocEntry = (node: ThesisNode, level: number, index: string) => {
            // Arabic-style indentation (right side)
            const indentSize = (level - 1) * 400;  // twips for right indent

            // Calculate simulated page number
            const pageNum = pageCounter++;

            // Create dots leader
            const dotLeader = ".".repeat(Math.max(5, 40 - node.title.length - index.length));

            tocChildren.push(
                new Paragraph({
                    children: [
                        // Page number first (will appear on LEFT in RTL)
                        new TextRun({
                            text: `${pageNum}`,
                            font: { cs: "Traditional Arabic", ascii: "Times New Roman" },
                            size: 24,
                            bold: true
                        }),
                        // Dot leader
                        new TextRun({
                            text: ` ${dotLeader} `,
                            font: { cs: "Traditional Arabic", ascii: "Times New Roman" },
                            size: 20,
                            color: "999999"
                        }),
                        // Title
                        new TextRun({
                            text: node.title,
                            font: { cs: "Traditional Arabic", ascii: "Times New Roman" },
                            size: level === 1 ? 28 : 24,
                            bold: level === 1,
                            rightToLeft: true
                        }),
                        new TextRun({
                            text: "  ",
                            size: 24
                        }),
                        // Index number (for RTL - appears on RIGHT)
                        new TextRun({
                            text: `${index}`,
                            font: { cs: "Traditional Arabic", ascii: "Times New Roman" },
                            size: level === 1 ? 28 : 24,
                            bold: level === 1,
                            rightToLeft: true
                        }),
                    ],
                    alignment: AlignmentType.DISTRIBUTE,  // Spread content across line
                    bidirectional: true,
                    indent: { right: indentSize },
                    spacing: { after: level === 1 ? 150 : 80, line: 280 }
                })
            );

            // Recurse children
            if (node.children) {
                node.children.forEach((child, i) => {
                    buildTocEntry(child, level + 1, `${index}.${i + 1}`);
                });
            }
        };

        structure.forEach((node, i) => {
            buildTocEntry(node, 1, `${i + 1}`);
        });

        sections.push({
            properties: {
                page: {
                    margin: {
                        top: this.mmToTwip(formatting?.page?.margins?.top || 25.4),
                        bottom: this.mmToTwip(formatting?.page?.margins?.bottom || 25.4),
                        left: this.mmToTwip(formatting?.page?.margins?.left || 31.7),
                        right: this.mmToTwip(formatting?.page?.margins?.right || 31.7),
                    }
                }
            },
            children: tocChildren
        });

        // Content Iteration
        const contentChildren: any[] = [];

        // Helper to traverse
        const traverse = (node: ThesisNode, level: number) => {
            // Determine Heading Level - use type assertion for compatibility
            const headingLevels = [
                HeadingLevel.HEADING_1,
                HeadingLevel.HEADING_2,
                HeadingLevel.HEADING_3,
                HeadingLevel.HEADING_4,
                HeadingLevel.HEADING_5
            ];
            const headingLevel = headingLevels[Math.min(level - 1, 4)];

            // Page break before ALL sections (every chapter/section/subsection starts on new page)
            const shouldBreakPage = true;  // All levels start on new page

            // Heading with optional page break
            contentChildren.push(
                new Paragraph({
                    text: node.title,
                    heading: headingLevel as typeof HeadingLevel.HEADING_1,
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    pageBreakBefore: shouldBreakPage,  // Start on new page for chapters/sections
                    spacing: { before: 400, after: 200 },
                })
            );

            // Dummy Content with simulation of formatting
            // "إضافة سطرين تحت العنوان محاكاة للنص"
            contentChildren.push(
                new Paragraph({
                    children: [
                        this.createTextStyle("هذا نص  تجريبي يحاكي محتوى هذا القسم. ", formatting?.body),
                        this.createTextStyle("يمكنك استبدال هذا النص لاحقاً بما تريد. ", formatting?.body),
                        // Simulated Footnote Reference (Manual superscript number)
                        new TextRun({
                            text: "1",
                            font: {
                                cs: formatting?.footnotes?.fontFamily || "Arial",
                                ascii: formatting?.footnotes?.fontFamily || "Arial"
                            },
                            size: (formatting?.footnotes?.fontSize || 10) * 2,
                            superScript: true,
                            color: "FF0000"
                        })
                    ],
                    alignment: this.getAlignment(formatting?.body?.alignment),
                    bidirectional: true,
                    spacing: { line: 360 } // 1.5 line spacing approx
                })
            );
            contentChildren.push(
                new Paragraph({
                    children: [
                        this.createTextStyle("تتمة للنص التجريبي لإظهار التنسيق والمسافات بين الأسطر بشكل أوضح.", formatting?.body),
                    ],
                    alignment: this.getAlignment(formatting?.body?.alignment),
                    bidirectional: true,
                    spacing: { after: 200 }
                })
            );

            // (Footnotes removed - user can add their own through Word)


            // Recurse
            if (node.children) {
                node.children.forEach(child => traverse(child, level + 1));
            }
        };

        structure.forEach(node => traverse(node, 1));

        // Main Section
        sections.push({
            properties: {
                page: {
                    margin: {
                        top: this.mmToTwip(formatting?.page?.margins?.top || 25.4),
                        bottom: this.mmToTwip(formatting?.page?.margins?.bottom || 25.4),
                        left: this.mmToTwip(formatting?.page?.margins?.left || 31.7),
                        right: this.mmToTwip(formatting?.page?.margins?.right || 31.7),
                    },
                    pageNumbers: {
                        start: 1,
                        formatType: "decimal"
                    }
                }
            },
            // No header (page numbers moved to footer)
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            children: contentChildren
        });

        const doc = new Document({
            sections: sections as any
        });

        return await Packer.toBlob(doc);
    }
}
