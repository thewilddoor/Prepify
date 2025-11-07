import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Math as OfficeMath,
} from 'docx';
// Simplified approach: For now, we'll display LaTeX as code until we can properly convert
// This is a fallback that shows the math notation in a readable format
function latexToOmml(latex: string, display: boolean = false): null {
  // TODO: Implement proper LaTeX to OMML conversion
  // For now, this returns null to fall back to plain text rendering
  // Users will see the LaTeX notation which is still readable
  return null;
}

// Helper to parse markdown and convert to docx elements
function parseMarkdownToDocx(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inList = false;
  let listType: 'bullet' | 'number' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockLines.length > 0) {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockLines.join('\n'),
                  font: 'Consolas',
                  size: 20,
                }),
              ],
              spacing: { before: 200, after: 200 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
              shading: { fill: 'F5F5F5' },
            })
          );
        }
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Handle horizontal rules (---, ___, ***)
    if (trimmedLine.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
      inList = false;
      elements.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }

    // Handle tables
    if (trimmedLine.includes('|') && trimmedLine.startsWith('|')) {
      inList = false;
      const tableLines: string[] = [];
      tableLines.push(trimmedLine);

      // Collect all consecutive table lines
      while (i + 1 < lines.length && lines[i + 1].trim().includes('|')) {
        i++;
        tableLines.push(lines[i].trim());
      }

      // Parse and create table
      const table = parseTableToDocx(tableLines);
      if (table) {
        elements.push(table);
      }
      continue;
    }

    // Handle headers
    if (trimmedLine.startsWith('# ')) {
      inList = false;
      elements.push(
        new Paragraph({
          text: trimmedLine.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      inList = false;
      elements.push(
        new Paragraph({
          text: trimmedLine.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      continue;
    }

    if (trimmedLine.startsWith('### ')) {
      inList = false;
      elements.push(
        new Paragraph({
          text: trimmedLine.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }

    // Handle numbered lists
    if (trimmedLine.match(/^\d+\.\s/)) {
      const text = trimmedLine.replace(/^\d+\.\s+/, '');
      elements.push(
        new Paragraph({
          text,
          numbering: {
            reference: 'default-numbering',
            level: 0,
          },
          spacing: { before: 100, after: 100 },
        })
      );
      inList = true;
      listType = 'number';
      continue;
    }

    // Handle bullet lists
    if (trimmedLine.match(/^[-*]\s/)) {
      const text = trimmedLine.replace(/^[-*]\s+/, '');
      elements.push(
        new Paragraph({
          text,
          bullet: {
            level: 0,
          },
          spacing: { before: 100, after: 100 },
        })
      );
      inList = true;
      listType = 'bullet';
      continue;
    }

    // Handle empty lines
    if (trimmedLine === '') {
      inList = false;
      elements.push(
        new Paragraph({
          text: '',
          spacing: { before: 120, after: 120 },
        })
      );
      continue;
    }

    // Handle display math ($$...$$)
    const displayMathMatch = trimmedLine.match(/^\$\$([\s\S]*?)\$\$$/);
    if (displayMathMatch) {
      inList = false;
      const latex = displayMathMatch[1].trim();
      const mathElement = latexToOmml(latex, true);

      if (mathElement) {
        elements.push(
          new Paragraph({
            children: [mathElement],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
      } else {
        // Fallback to plain text if conversion fails
        elements.push(
          new Paragraph({
            text: `$$${latex}$$`,
            spacing: { before: 200, after: 200 },
            alignment: AlignmentType.CENTER,
          })
        );
      }
      continue;
    }

    // Handle regular paragraphs with inline formatting (including inline math)
    inList = false;
    const textRuns = parseInlineFormattingWithMath(trimmedLine);
    elements.push(
      new Paragraph({
        children: textRuns,
        spacing: { before: 120, after: 120 },
      })
    );
  }

  return elements;
}

// Helper to parse markdown table to docx Table
function parseTableToDocx(tableLines: string[]): Table | null {
  if (tableLines.length < 2) return null;

  // Parse header row
  const headerCells = tableLines[0]
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell !== '');

  // Skip separator row (line with dashes)
  let dataStartIndex = 1;
  if (tableLines[1].includes('---') || tableLines[1].includes(':--')) {
    dataStartIndex = 2;
  }

  // Parse data rows
  const dataRows: string[][] = [];
  for (let i = dataStartIndex; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
    if (cells.length > 0) {
      dataRows.push(cells);
    }
  }

  // Create table rows
  const tableRows: TableRow[] = [];

  // Add header row
  tableRows.push(
    new TableRow({
      children: headerCells.map(
        cellText =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    bold: true,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: {
              fill: '643CC8', // Purple color
            },
            width: {
              size: 100 / headerCells.length,
              type: WidthType.PERCENTAGE,
            },
          })
      ),
    })
  );

  // Add data rows
  dataRows.forEach((row, rowIndex) => {
    tableRows.push(
      new TableRow({
        children: row.map(
          cellText =>
            new TableCell({
              children: [
                new Paragraph({
                  text: cellText,
                }),
              ],
              shading: {
                fill: rowIndex % 2 === 0 ? 'FFFFFF' : 'F5F5F5',
              },
              width: {
                size: 100 / row.length,
                type: WidthType.PERCENTAGE,
              },
            })
        ),
      })
    );
  });

  return new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

// Helper to parse inline markdown formatting (bold, italic, code, strikethrough)
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Bold (**text** or __text__)
    if (
      (text[i] === '*' && text[i + 1] === '*') ||
      (text[i] === '_' && text[i + 1] === '_')
    ) {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      const delimiter = text[i] + text[i + 1];
      i += 2;
      let boldText = '';
      while (i < text.length - 1) {
        if (text[i] === delimiter[0] && text[i + 1] === delimiter[1]) {
          runs.push(new TextRun({ text: boldText, bold: true }));
          i += 2;
          break;
        }
        boldText += text[i];
        i++;
      }
      continue;
    }

    // Italic (*text* or _text_)
    if (text[i] === '*' || text[i] === '_') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      const delimiter = text[i];
      i++;
      let italicText = '';
      while (i < text.length) {
        if (text[i] === delimiter) {
          runs.push(new TextRun({ text: italicText, italics: true }));
          i++;
          break;
        }
        italicText += text[i];
        i++;
      }
      continue;
    }

    // Inline code (`text`)
    if (text[i] === '`') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      i++;
      let codeText = '';
      while (i < text.length) {
        if (text[i] === '`') {
          runs.push(
            new TextRun({ text: codeText, font: 'Consolas', size: 20 })
          );
          i++;
          break;
        }
        codeText += text[i];
        i++;
      }
      continue;
    }

    // Strikethrough (~~text~~)
    if (text[i] === '~' && text[i + 1] === '~') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      i += 2;
      let strikeText = '';
      while (i < text.length - 1) {
        if (text[i] === '~' && text[i + 1] === '~') {
          runs.push(new TextRun({ text: strikeText, strike: true }));
          i += 2;
          break;
        }
        strikeText += text[i];
        i++;
      }
      continue;
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    runs.push(new TextRun(currentText));
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

// Helper to parse inline formatting with math support
function parseInlineFormattingWithMath(text: string): (TextRun | OfficeMath)[] {
  const elements: (TextRun | OfficeMath)[] = [];

  // First, split by inline math ($...$) but preserve the delimiters
  const parts: string[] = [];
  let currentPart = '';
  let i = 0;

  while (i < text.length) {
    // Check for inline math ($...$) - avoid matching $$
    if (text[i] === '$' && text[i + 1] !== '$' && (i === 0 || text[i - 1] !== '$')) {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }

      // Find the closing $
      i++; // Skip opening $
      let mathContent = '';
      while (i < text.length && text[i] !== '$') {
        mathContent += text[i];
        i++;
      }

      if (i < text.length) { // Found closing $
        parts.push(`$${mathContent}$`); // Mark as math
        i++; // Skip closing $
      } else {
        // No closing $, treat as regular text
        currentPart = '$' + mathContent;
      }
      continue;
    }

    currentPart += text[i];
    i++;
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  // Now process each part
  for (const part of parts) {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      // This is inline math
      const latex = part.slice(1, -1); // Remove $ delimiters
      const mathElement = latexToOmml(latex, false);

      if (mathElement) {
        elements.push(mathElement);
      } else {
        // Fallback to plain text
        elements.push(new TextRun(part));
      }
    } else {
      // Regular text with markdown formatting
      const textRuns = parseInlineFormatting(part);
      elements.push(...textRuns);
    }
  }

  return elements.length > 0 ? elements : [new TextRun(text)];
}

export async function POST(request: NextRequest) {
  try {
    const { content, sessionId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Parse markdown content
    const elements = parseMarkdownToDocx(content);

    // Add title and metadata at the beginning
    const titleElements: (Paragraph | Table)[] = [
      new Paragraph({
        text: 'Study Guide',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            color: '666666',
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      }),
    ];

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [...titleElements, ...elements],
        },
      ],
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 },
                  },
                },
              },
            ],
          },
        ],
      },
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: 'Calibri',
              size: 24,
              color: '0A0A0A',
            },
            paragraph: {
              spacing: { line: 360, before: 120, after: 120 },
            },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: 'Calibri',
              size: 32,
              bold: true,
              color: '0A0A0A',
            },
            paragraph: {
              spacing: { before: 400, after: 200 },
            },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: 'Calibri',
              size: 28,
              bold: true,
              color: '0A0A0A',
            },
            paragraph: {
              spacing: { before: 300, after: 150 },
            },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: 'Calibri',
              size: 26,
              bold: true,
              color: '0A0A0A',
            },
            paragraph: {
              spacing: { before: 240, after: 120 },
            },
          },
        ],
      },
    });

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    // Return DOCX as download
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="study-guide-${sessionId || Date.now()}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
