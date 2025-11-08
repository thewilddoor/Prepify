'use client';

import { Copy, Check, Printer } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface StudyGuideViewerProps {
  content: string;
}

export function StudyGuideViewer({ content }: StudyGuideViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-study-guide');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Study Guide</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 20mm;
            }
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
              page-break-inside: avoid;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.25em; }
            p { margin: 1em 0; }
            .katex-display, pre, code, table {
              page-break-inside: avoid;
            }
            pre {
              background: #f5f5f5;
              padding: 1em;
              border-radius: 4px;
              overflow-x: auto;
            }
            code {
              background: #f5f5f5;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
            }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            li {
              margin: 0.5em 0;
            }
            blockquote {
              border-left: 4px solid #643caa;
              padding-left: 1em;
              margin: 1em 0;
              font-style: italic;
              color: #555;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load (especially KaTeX)
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          /* This will be used if user prints directly from browser */
          body * {
            visibility: hidden;
          }
          #printable-study-guide,
          #printable-study-guide * {
            visibility: visible;
          }
          #printable-study-guide {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        /* Ensure buttons are always fixed and never in flow */
        .action-buttons-fixed {
          position: fixed !important;
          top: 2rem !important;
          right: 2rem !important;
          z-index: 9999 !important;
          display: flex !important;
          gap: 0.75rem !important;
        }
      `}</style>

      {/* Action buttons - Fixed at top right - rendered first */}
      <div className="action-buttons-fixed no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all border border-border/40 hover:border-[#DAC2EF]/40"
          aria-label="Print to PDF"
        >
          <Printer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Print</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all border border-border/40 hover:border-[#DAC2EF]/40"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[#DAC2EF]" />
              <span className="text-sm font-medium text-[#DAC2EF]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content - Centered with equal margins */}
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-8 py-8">
          <div id="printable-study-guide" className="print-container">
            <div className="prose prose-lg dark:prose-invert max-w-none print:prose-print">
              <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-semibold mt-12 mb-4 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-8 mb-2 text-foreground">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-semibold mt-6 mb-2 text-foreground">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-sm font-semibold mt-4 mb-2 text-foreground">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm font-medium mt-3 mb-1 text-foreground">
                  {children}
                </h6>
              ),
              p: ({ children }) => (
                <p className="my-4 text-muted-foreground leading-relaxed">{children}</p>
              ),
              a: ({ children, ...props }) => (
                <a
                  className="text-[#DAC2EF] hover:underline transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="my-4 space-y-2 list-none pl-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 space-y-2 list-none pl-0 counter-reset-item">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-muted-foreground leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-[#DAC2EF]">
                  {children}
                </li>
              ),
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg my-6 text-sm"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-muted px-2 py-0.5 rounded text-sm font-mono text-muted-foreground"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: ({ children }) => (
                <div className="my-6 overflow-x-auto">
                  <table className="min-w-full border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/50">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="border-b border-border/40 last:border-0">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm text-muted-foreground">{children}</td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#DAC2EF] pl-6 my-6 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className="my-8 border-border/40" />
              ),
              del: ({ children }) => (
                <del className="text-muted-foreground/60">{children}</del>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
            }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
