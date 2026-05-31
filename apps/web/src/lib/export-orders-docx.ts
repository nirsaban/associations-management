import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface OrderFamily {
  familyId: string;
  familyName: string;
  contactName?: string;
  address?: string;
  items: unknown;
  status: string;
  notes?: string;
}

interface OrderGroup {
  groupId: string;
  groupName: string;
  families: OrderFamily[];
}

// Collapse every newline and run of whitespace into a single space,
// so line breaks behave exactly like spaces in the exported document.
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function formatItems(items: unknown): string {
  if (!items) return 'ללא פריטים';
  if (Array.isArray(items)) {
    return normalizeWhitespace(
      items
        .map((item: Record<string, unknown>) => {
          if (item.item) return `${item.item} - ${item.quantity || ''} ${item.unit || ''}`.trim();
          return JSON.stringify(item);
        })
        .join(', '),
    ) || 'ללא פריטים';
  }
  if (typeof items === 'object' && items !== null) {
    const obj = items as Record<string, unknown>;
    if (obj.text) return normalizeWhitespace(String(obj.text));
  }
  return normalizeWhitespace(String(items));
}

export async function exportOrdersToDocx(
  orgName: string,
  weekKey: string,
  groups: OrderGroup[],
) {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [
        new TextRun({ text: orgName, bold: true, size: 36, font: 'David' }),
      ],
      heading: HeadingLevel.HEADING_1,
    }),
  );

  // Date
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [
        new TextRun({ text: `הזמנות שבועיות - שבוע ${weekKey}`, size: 28, font: 'David' }),
      ],
      spacing: { after: 400 },
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [
        new TextRun({ text: `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`, size: 20, font: 'David', color: '666666' }),
      ],
      spacing: { after: 200 },
    }),
  );

  // Total families across all groups
  const totalFamilies = groups.reduce((sum, g) => sum + g.families.length, 0);
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [
        new TextRun({ text: `סה"כ משפחות: ${totalFamilies}`, bold: true, size: 24, font: 'David' }),
      ],
      spacing: { after: 400 },
    }),
  );

  for (const group of groups) {
    // Group header
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        children: [
          new TextRun({ text: group.groupName, bold: true, size: 28, font: 'David' }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
        },
      }),
    );

    if (group.families.length === 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: 'אין הזמנות לקבוצה זו', italics: true, size: 22, font: 'David', color: '999999' }),
          ],
          spacing: { after: 200 },
        }),
      );
      continue;
    }

    for (const family of group.families) {
      // Family name (address intentionally omitted)
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: `${family.familyName}`, bold: true, size: 24, font: 'David' }),
          ],
          spacing: { before: 200 },
        }),
      );

      // Items — the focus of the document, rendered larger
      const itemsText = formatItems(family.items);
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: `פריטים: `, bold: true, size: 32, font: 'David' }),
            new TextRun({ text: itemsText, bold: true, size: 32, font: 'David' }),
          ],
          indent: { right: 400 },
          spacing: { before: 100, after: 100 },
        }),
      );

      // Status
      const statusText = family.status === 'COMPLETED' ? 'הושלם' : 'טיוטה';
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: `סטטוס: ${statusText}`, size: 20, font: 'David', color: family.status === 'COMPLETED' ? '008000' : 'CC8800' }),
          ],
          indent: { right: 400 },
          spacing: { after: 200 },
        }),
      );

      if (family.notes) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({ text: `הערות: ${family.notes}`, size: 20, font: 'David', italics: true }),
            ],
            indent: { right: 400 },
            spacing: { after: 200 },
          }),
        );
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `orders-${weekKey}.docx`);
}
