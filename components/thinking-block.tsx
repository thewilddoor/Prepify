'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ThinkingBlockProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingBlock({ content, isStreaming = false }: ThinkingBlockProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  // Typewriter effect for streaming content
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content)
      return
    }

    let currentIndex = displayedContent.length

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1))
      }, 10)

      return () => clearTimeout(timer)
    }
  }, [content, isStreaming, displayedContent])

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [displayedContent, isStreaming])

  if (!content && !isStreaming) {
    return null
  }

  return (
    <div className="mt-3">
      <div
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto max-h-96 pr-4"
      >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-muted-foreground space-y-1 mb-3 list-disc list-inside">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-muted-foreground space-y-1 mb-3 list-decimal list-inside">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
              code: ({ className, children, ...props }) => {
                const isInline = !className
                return isInline ? (
                  <code
                    className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className={`block p-3 rounded-lg bg-muted text-muted-foreground font-mono text-xs overflow-x-auto ${className}`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold text-foreground mb-3">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold text-foreground mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-foreground mb-2">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#DAC2EF] pl-4 italic text-muted-foreground mb-3">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
            }}
          >
            {displayedContent}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[#C8A8E3] ml-1 animate-pulse" />
          )}
        </div>
    </div>
  )
}
