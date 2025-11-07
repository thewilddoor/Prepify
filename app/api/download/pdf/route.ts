import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import MarkdownIt from 'markdown-it';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { createCanvas, loadImage } from 'canvas';

// Initialize markdown parser
const md = new MarkdownIt();

// Initialize MathJax
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

// LaTeX equation data structure
interface LatexEquation {
  latex: string;
  isDisplay: boolean;
  placeholder: string;
}

// Convert LaTeX to SVG using MathJax
async function latexToSvg(latex: string, isDisplay: boolean = false): Promise<string> {
  try {
    const tex = new TeX({ packages: ['base', 'ams', 'newcommand', 'configmacros'] });
    const svg = new SVG({ fontCache: 'local' });
    const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

    const node = html.convert(latex, { display: isDisplay });
    return adaptor.outerHTML(node);
  } catch (error) {
    console.error('LaTeX to SVG conversion error:', error);
    throw error;
  }
}

// Convert SVG to PNG data URL
async function svgToPng(svgString: string, width: number = 400): Promise<string> {
  try {
    // Extract SVG dimensions if present
    const widthMatch = svgString.match(/width="([\d.]+)ex"/);
    const heightMatch = svgString.match(/height="([\d.]+)ex"/);

    const svgWidth = widthMatch ? parseFloat(widthMatch[1]) * 10 : width;
    const svgHeight = heightMatch ? parseFloat(heightMatch[1]) * 10 : width * 0.3;

    // Create a data URL for the SVG
    const svgDataUrl = 'data:image/svg+xml;base64,' +
      Buffer.from(svgString).toString('base64');

    // Create canvas
    const canvas = createCanvas(Math.ceil(svgWidth), Math.ceil(svgHeight));
    const ctx = canvas.getContext('2d');

    // Load and draw SVG
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

    // Return as PNG data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('SVG to PNG conversion error:', error);
    throw error;
  }
}

// Extract LaTeX equations from markdown
function extractLatexEquations(markdown: string): { equations: LatexEquation[]; processedMarkdown: string } {
  const equations: LatexEquation[] = [];
  let processedMarkdown = markdown;
  let equationIndex = 0;

  // Extract display math ($$...$$) first
  processedMarkdown = processedMarkdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const placeholder = `__EQUATION_${equationIndex}__`;
    equations.push({
      latex: latex.trim(),
      isDisplay: true,
      placeholder,
    });
    equationIndex++;
    return placeholder;
  });

  // Extract inline math ($...$) - avoid matching placeholders
  processedMarkdown = processedMarkdown.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (match, latex) => {
    const placeholder = `__EQUATION_${equationIndex}__`;
    equations.push({
      latex: latex.trim(),
      isDisplay: false,
      placeholder,
    });
    equationIndex++;
    return placeholder;
  });

  return { equations, processedMarkdown };
}

interface ParsedElement {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'hr' | 'table' | 'blockquote';
  level?: number;
  content?: string;
  items?: string[];
  ordered?: boolean;
  language?: string;
  tableData?: { headers: string[]; rows: string[][] };
}

function parseMarkdownToPDF(markdown: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  const tokens = md.parse(markdown, {});

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.substring(1)); // h1 -> 1, h2 -> 2, etc.
      const contentToken = tokens[i + 1];
      elements.push({
        type: 'heading',
        level,
        content: contentToken.content,
      });
      i += 3; // skip heading_open, inline, heading_close
    } else if (token.type === 'paragraph_open') {
      const contentToken = tokens[i + 1];
      if (contentToken && contentToken.type === 'inline') {
        elements.push({
          type: 'paragraph',
          content: extractTextFromInline(contentToken),
        });
      }
      i += 3; // skip paragraph_open, inline, paragraph_close
    } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const ordered = token.type === 'ordered_list_open';
      const items: string[] = [];
      i++; // move to first list_item_open

      while (i < tokens.length && tokens[i].type === 'list_item_open') {
        i++; // move to content
        let itemContent = '';
        while (i < tokens.length && tokens[i].type !== 'list_item_close') {
          if (tokens[i].type === 'inline') {
            itemContent += extractTextFromInline(tokens[i]);
          } else if (tokens[i].type === 'paragraph_open') {
            i++;
            if (tokens[i].type === 'inline') {
              itemContent += extractTextFromInline(tokens[i]);
            }
            i++; // skip paragraph_close
          }
          i++;
        }
        items.push(itemContent);
        i++; // skip list_item_close
      }

      elements.push({
        type: 'list',
        ordered,
        items,
      });
      i++; // skip bullet_list_close or ordered_list_close
    } else if (token.type === 'fence' || token.type === 'code_block') {
      elements.push({
        type: 'code',
        content: token.content,
        language: token.info || undefined,
      });
      i++;
    } else if (token.type === 'hr') {
      elements.push({
        type: 'hr',
      });
      i++;
    } else if (token.type === 'table_open') {
      const tableData = parseTable(tokens, i);
      if (tableData) {
        elements.push({
          type: 'table',
          tableData,
        });
        // Skip to after table_close
        while (i < tokens.length && tokens[i].type !== 'table_close') {
          i++;
        }
        i++; // skip table_close
      } else {
        i++;
      }
    } else if (token.type === 'blockquote_open') {
      let quoteContent = '';
      i++; // move past blockquote_open
      while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
        if (tokens[i].type === 'inline') {
          quoteContent += extractTextFromInline(tokens[i]) + ' ';
        } else if (tokens[i].type === 'paragraph_open') {
          i++;
          if (tokens[i] && tokens[i].type === 'inline') {
            quoteContent += extractTextFromInline(tokens[i]) + ' ';
          }
          i++; // skip paragraph_close
        }
        i++;
      }
      elements.push({
        type: 'blockquote',
        content: quoteContent.trim(),
      });
      i++; // skip blockquote_close
    } else {
      i++;
    }
  }

  return elements;
}

function extractTextFromInline(token: any): string {
  if (!token.children) return token.content || '';

  return token.children.map((child: any) => {
    if (child.type === 'text') return child.content;
    if (child.type === 'code_inline') return child.content;
    if (child.type === 'strong_open' || child.type === 'strong_close') return '';
    if (child.type === 'em_open' || child.type === 'em_close') return '';
    if (child.type === 'link_open' || child.type === 'link_close') return '';
    if (child.type === 's_open' || child.type === 's_close') return '';
    return child.content || '';
  }).join('');
}

function parseTable(tokens: any[], startIndex: number): { headers: string[]; rows: string[][] } | null {
  const headers: string[] = [];
  const rows: string[][] = [];

  let i = startIndex + 1; // skip table_open

  // Parse thead
  if (tokens[i]?.type === 'thead_open') {
    i++; // skip thead_open
    if (tokens[i]?.type === 'tr_open') {
      i++; // skip tr_open
      while (i < tokens.length && tokens[i].type === 'th_open') {
        i++; // skip th_open
        if (tokens[i].type === 'inline') {
          headers.push(extractTextFromInline(tokens[i]));
        }
        i++; // skip th content
        i++; // skip th_close
      }
      i++; // skip tr_close
    }
    i++; // skip thead_close
  }

  // Parse tbody
  if (tokens[i]?.type === 'tbody_open') {
    i++; // skip tbody_open
    while (i < tokens.length && tokens[i].type === 'tr_open') {
      i++; // skip tr_open
      const row: string[] = [];
      while (i < tokens.length && tokens[i].type === 'td_open') {
        i++; // skip td_open
        if (tokens[i].type === 'inline') {
          row.push(extractTextFromInline(tokens[i]));
        }
        i++; // skip td content
        i++; // skip td_close
      }
      rows.push(row);
      i++; // skip tr_close
    }
  }

  return headers.length > 0 ? { headers, rows } : null;
}

async function renderPDF(content: string): Promise<jsPDF> {
  // Extract and convert LaTeX equations first
  const { equations, processedMarkdown } = extractLatexEquations(content);

  // Convert all equations to PNG in parallel
  const equationImages: Map<string, string> = new Map();

  try {
    const renderedEquations = await Promise.all(
      equations.map(async (eq) => {
        try {
          const svg = await latexToSvg(eq.latex, eq.isDisplay);
          const png = await svgToPng(svg, eq.isDisplay ? 400 : 200);
          return { placeholder: eq.placeholder, png, isDisplay: eq.isDisplay };
        } catch (error) {
          console.error(`Failed to render equation: ${eq.latex}`, error);
          return { placeholder: eq.placeholder, png: null, isDisplay: eq.isDisplay };
        }
      })
    );

    for (const { placeholder, png } of renderedEquations) {
      if (png) {
        equationImages.set(placeholder, png);
      }
    }
  } catch (error) {
    console.error('Error rendering equations:', error);
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = 20;
  const maxWidth = pageWidth - margins * 2;
  let yPosition = margins;

  // Add title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Study Guide', margins, yPosition);
  yPosition += 10;

  // Add timestamp
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margins, yPosition);
  yPosition += 15;
  pdf.setTextColor(0, 0, 0);

  // Parse markdown (with equations replaced by placeholders)
  const elements = parseMarkdownToPDF(processedMarkdown);

  // Render each element
  for (const element of elements) {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margins;
    }

    switch (element.type) {
      case 'heading':
        yPosition += element.level === 1 ? 8 : 6;
        pdf.setFont('helvetica', 'bold');
        const headingSize = Math.max(18 - (element.level! - 1) * 2, 12);
        pdf.setFontSize(headingSize);
        const headingLines = pdf.splitTextToSize(element.content || '', maxWidth);
        for (const line of headingLines) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margins;
          }
          pdf.text(line, margins, yPosition);
          yPosition += headingSize * 0.5;
        }
        yPosition += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        break;

      case 'paragraph':
        // Check if this paragraph contains equation placeholders
        const paraContent = element.content || '';
        const equationPlaceholders = paraContent.match(/__EQUATION_\d+__/g);

        if (equationPlaceholders) {
          // Split content by equations and render each part
          const parts = paraContent.split(/(__EQUATION_\d+__)/);

          for (const part of parts) {
            if (part.match(/^__EQUATION_\d+__$/)) {
              // This is an equation placeholder
              const png = equationImages.get(part);
              if (png) {
                // Check if we need a new page
                if (yPosition > pageHeight - 40) {
                  pdf.addPage();
                  yPosition = margins;
                }

                // Add equation image
                const imgWidth = 60; // mm
                const imgHeight = 15; // mm
                pdf.addImage(png, 'PNG', margins, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 3;
              } else {
                // Fallback if image failed to render
                pdf.text(`[Math: ${part}]`, margins, yPosition);
                yPosition += 6;
              }
            } else if (part.trim()) {
              // Regular text
              const paraLines = pdf.splitTextToSize(part, maxWidth);
              for (const line of paraLines) {
                if (yPosition > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = margins;
                }
                pdf.text(line, margins, yPosition);
                yPosition += 6;
              }
            }
          }
          yPosition += 2;
        } else {
          // No equations, render normally
          const paraLines = pdf.splitTextToSize(paraContent, maxWidth);
          for (const line of paraLines) {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = margins;
            }
            pdf.text(line, margins, yPosition);
            yPosition += 6;
          }
          yPosition += 2;
        }
        break;

      case 'list':
        element.items?.forEach((item, index) => {
          const bullet = element.ordered ? `${index + 1}. ` : '• ';
          const itemLines = pdf.splitTextToSize(item, maxWidth - 5);
          for (let i = 0; i < itemLines.length; i++) {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = margins;
            }
            if (i === 0) {
              pdf.text(bullet + itemLines[i], margins, yPosition);
            } else {
              pdf.text(itemLines[i], margins + 7, yPosition);
            }
            yPosition += 6;
          }
        });
        yPosition += 3;
        break;

      case 'code':
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(10);
        pdf.setFillColor(245, 245, 245);
        const codeLines = (element.content || '').split('\n');
        const codeHeight = codeLines.length * 5 + 6;

        if (yPosition + codeHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = margins;
        }

        pdf.rect(margins, yPosition - 3, maxWidth, codeHeight, 'F');
        for (const line of codeLines) {
          pdf.text(line, margins + 2, yPosition);
          yPosition += 5;
        }
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        break;

      case 'hr':
        yPosition += 4;
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margins;
        }
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margins, yPosition, pageWidth - margins, yPosition);
        pdf.setDrawColor(0, 0, 0);
        yPosition += 6;
        break;

      case 'table':
        if (element.tableData) {
          const startY = yPosition;
          autoTable(pdf, {
            head: [element.tableData.headers],
            body: element.tableData.rows,
            startY: startY,
            margin: { left: margins, right: margins },
            styles: {
              fontSize: 10,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [100, 60, 200],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
          });
          yPosition = (pdf as any).lastAutoTable.finalY + 8;
        }
        break;

      case 'blockquote':
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        const quoteLines = pdf.splitTextToSize(element.content || '', maxWidth - 10);
        pdf.setLineWidth(2);
        pdf.setDrawColor(100, 60, 200);
        const quoteHeight = quoteLines.length * 6;

        if (yPosition + quoteHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = margins;
        }

        pdf.line(margins, yPosition - 3, margins, yPosition + quoteHeight);
        for (const line of quoteLines) {
          pdf.text(line, margins + 6, yPosition);
          yPosition += 6;
        }
        yPosition += 3;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        break;
    }
  }

  return pdf;
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

    // Render PDF with markdown and LaTeX support
    const pdf = await renderPDF(content);

    // Convert to buffer
    const pdfBuffer = pdf.output('arraybuffer');

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="study-guide-${sessionId || Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
