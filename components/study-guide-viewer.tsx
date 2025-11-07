'use client';

import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
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

  return (
    <Card className="relative overflow-hidden shadow-xl">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="text-sm font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Study Guide</h1>
          <p className="text-gray-500">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom heading styles
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
              ),
              h5: ({ node, ...props }) => (
                <h5 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props} />
              ),
              h6: ({ node, ...props }) => (
                <h6 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />
              ),
              // Paragraph styling
              p: ({ node, ...props }) => (
                <p className="my-4 text-foreground leading-relaxed" {...props} />
              ),
              // Links with purple accent
              a: ({ node, ...props }) => (
                <a
                  className="text-purple-custom underline hover:no-underline transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              // Lists
              ul: ({ node, ...props }) => (
                <ul className="my-4 ml-6 list-disc space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="my-4 ml-6 list-decimal space-y-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-foreground leading-relaxed" {...props} />
              ),
              // Code blocks with syntax highlighting
              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg my-4"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Tables
              table: ({ node, ...props }) => (
                <div className="my-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" {...props} />
              ),
              // Block quotes
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-purple-custom pl-4 my-4 italic text-gray-700 dark:text-gray-300"
                  {...props}
                />
              ),
              // Horizontal rule
              hr: ({ node, ...props }) => (
                <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />
              ),
              // Strikethrough (from remark-gfm)
              del: ({ node, ...props }) => (
                <del className="text-gray-500" {...props} />
              ),
              // Strong and emphasis
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-foreground" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}
