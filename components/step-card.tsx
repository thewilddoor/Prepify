'use client'

import { Check, Loader2, Eye, Brain, Code, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Step } from '@/types'
import { BreathingDot } from './breathing-dot'

interface StepCardProps {
  step: Step
  children?: React.ReactNode
}

const getStepIcon = (type: string, status: string) => {
  if (status === 'complete') {
    return <Check className="h-4 w-4 text-[#DAC2EF]" />
  }

  if (status === 'active') {
    return <Loader2 className="h-4 w-4 text-[#DAC2EF] animate-spin" />
  }

  // Pending icons based on type
  const icons: Record<string, React.ReactNode> = {
    vision: <Eye className="h-4 w-4 text-muted-foreground" />,
    thinking: <Brain className="h-4 w-4 text-muted-foreground" />,
    tool_use: <Code className="h-4 w-4 text-muted-foreground" />,
    generation: <FileText className="h-4 w-4 text-muted-foreground" />,
  }

  return icons[type] || <div className="h-4 w-4" />
}

const getStepTitle = (type: string, status: string, toolName?: string) => {
  if (type === 'vision') {
    return status === 'complete' ? 'Analyzed Images' : 'Analyzing Images'
  }
  if (type === 'thinking') {
    return status === 'complete' ? 'Thinking Complete' : 'Extended Thinking'
  }
  if (type === 'tool_use') {
    return status === 'complete'
      ? `Tool Used: ${toolName || 'Unknown'}`
      : `Using Tool: ${toolName || 'Unknown'}`
  }
  if (type === 'generation') {
    return status === 'complete' ? 'Generated Content' : 'Generating Study Guide'
  }
  return 'Processing'
}

export function StepCard({ step, children }: StepCardProps) {
  const isActive = step.status === 'active'
  const isComplete = step.status === 'complete'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex gap-6 py-4"
    >
      {/* Left: Breathing dot with vertical line */}
      <div className="flex flex-col items-center">
        {isActive ? (
          <BreathingDot isActive={true} />
        ) : isComplete ? (
          <div className="size-2 rounded-full bg-[#DAC2EF]/70" />
        ) : (
          <div className="size-2 rounded-full bg-muted-foreground/30" />
        )}
        {step.content && (
          <div className="w-px flex-1 bg-linear-to-b from-[#DAC2EF]/30 to-transparent mt-2" />
        )}
      </div>

      {/* Right: Content area */}
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <span className="text-sm font-medium text-foreground">
            {getStepTitle(step.type, step.status, step.toolName)}
          </span>
        </div>

        {children}

        {step.content && step.type !== 'thinking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-3"
          >
            {step.type === 'generation' ? (
              // Render markdown for generation content
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg font-semibold text-foreground mt-4 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold text-foreground mt-3 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
                        {children}
                      </h3>
                    ),
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
                          className={`block p-3 rounded-lg bg-muted text-muted-foreground font-mono text-xs overflow-x-auto mb-3 ${className}`}
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-[#DAC2EF] pl-4 italic text-muted-foreground mb-3">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                    a: ({ children, ...props }) => (
                      <a className="text-[#DAC2EF] hover:underline" {...props}>
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="min-w-full border-collapse">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border px-3 py-2 bg-muted text-left text-sm font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-3 py-2 text-sm text-muted-foreground">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {step.content}
                </ReactMarkdown>
              </div>
            ) : (
              // Plain text for other step types
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {step.content}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
