
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { ReportData } from './pdfGenerator';

export const generateGenericWord = async (data: ReportData, filename: string) => {
    const children: any[] = [];

    // Title
    children.push(
        new Paragraph({
            text: data.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    // Sections
    data.sections.forEach((section) => {
        if (section.type === 'text') {
            let align: AlignmentType = AlignmentType.RIGHT; // Default RTL
            if (section.align === 'center') align = AlignmentType.CENTER;
            if (section.align === 'left') align = AlignmentType.LEFT;

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: section.content,
                            size: 24, // 12pt
                            rightToLeft: true,
                        }),
                    ],
                    alignment: align,
                    spacing: { after: 200 },
                    bidirectional: true,
                })
            );
        } else if (section.type === 'table') {
            if (section.title) {
                children.push(
                    new Paragraph({
                        text: section.title,
                        heading: HeadingLevel.HEADING_3,
                        alignment: AlignmentType.RIGHT,
                        bidirectional: true,
                        spacing: { before: 200, after: 100 },
                    })
                );
            }

            const tableRows = [
                new TableRow({
                    children: section.headers.map((h) =>
                        new TableCell({
                            children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER, bidirectional: true })],
                            width: { size: 100 / section.headers.length, type: WidthType.PERCENTAGE },
                            shading: { fill: "E0E0E0" }, // Light gray header
                        })
                    ),
                }),
                ...section.rows.map((row) =>
                    new TableRow({
                        children: row.map((cell) =>
                            new TableCell({
                                children: [new Paragraph({ text: cell, alignment: AlignmentType.CENTER, bidirectional: true })],
                                width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                            })
                        ),
                    })
                ),
            ];

            children.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                })
            );

            children.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
        }
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
};
