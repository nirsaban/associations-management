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

function formatItems(items: unknown): string {
  if (!items) return 'ללא פריטים';
  if (Array.isArray(items)) {
    return items
      .map((item: Record<string, unknown>) => {
        if (item.item) return `${item.item} - ${item.quantity || ''} ${item.unit || ''}`.trim();
        return JSON.stringify(item);
      })
      .join(', ') || 'ללא פריטים';
  }
  if (typeof items === 'object' && items !== null) {
    const obj = items as Record<string, unknown>;
    if (obj.text) return String(obj.text);
  }
  return String(items);
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
      // Family name
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: `${family.familyName}`, bold: true, size: 24, font: 'David' }),
            ...(family.address ? [new TextRun({ text: ` - ${family.address}`, size: 20, font: 'David', color: '666666' })] : []),
          ],
          spacing: { before: 200 },
        }),
      );

      // Items
      const itemsText = formatItems(family.items);
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new TextRun({ text: `פריטים: `, bold: true, size: 22, font: 'David' }),
            new TextRun({ text: itemsText, size: 22, font: 'David' }),
          ],
          indent: { right: 400 },
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
