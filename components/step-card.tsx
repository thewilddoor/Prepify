'use client';

import { Card } from '@/components/ui/card';
import { Check, Loader2, Clock, Eye, Brain, Code, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Step } from '@/types';

interface StepCardProps {
  step: Step;
  children?: React.ReactNode;
}

const getStepIcon = (type: string, status: string) => {
  if (status === 'complete') {
    return <Check className="h-5 w-5 text-green-500" />;
  }

  if (status === 'active') {
    return <Loader2 className="h-5 w-5 text-purple-custom animate-spin" />;
  }

  // Pending icons based on type
  const icons: Record<string, React.ReactNode> = {
    vision: <Eye className="h-5 w-5 text-gray-400" />,
    thinking: <Brain className="h-5 w-5 text-gray-400" />,
    tool_use: <Code className="h-5 w-5 text-gray-400" />,
    generation: <FileText className="h-5 w-5 text-gray-400" />,
  };

  return icons[type] || <Clock className="h-5 w-5 text-gray-400" />;
};

const getStepTitle = (type: string, status: string, toolName?: string) => {
  if (type === 'vision') {
    return status === 'complete' ? 'Analyzed Images' : 'Analyzing Images';
  }
  if (type === 'thinking') {
    return status === 'complete' ? 'Thinking Complete' : 'Extended Thinking';
  }
  if (type === 'tool_use') {
    return status === 'complete'
      ? `Tool Used: ${toolName || 'Unknown'}`
      : `Using Tool: ${toolName || 'Unknown'}`;
  }
  if (type === 'generation') {
    return status === 'complete' ? 'Generated Content' : 'Generating Study Guide';
  }
  return 'Processing';
};

export function StepCard({ step, children }: StepCardProps) {
  const formattedTime = new Date(step.timestamp).toLocaleTimeString();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getStepIcon(step.type, step.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {getStepTitle(step.type, step.status, step.toolName)}
                </h3>
                <span className="text-xs text-gray-500">{formattedTime}</span>
              </div>

              {children}

              {step.content && step.type !== 'thinking' && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {step.type === 'generation' ? (
                        // Render markdown for generation content
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Compact styling for generation preview
                              h1: ({ node, ...props }) => (
                                <h1 className="text-base font-bold mt-2 mb-1 text-foreground" {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="text-sm font-bold mt-2 mb-1 text-foreground" {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="text-sm font-semibold mt-1 mb-1 text-foreground" {...props} />
                              ),
                              p: ({ node, ...props }) => (
                                <p className="my-1 text-foreground leading-relaxed" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="my-1 ml-4 list-disc space-y-0.5" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="my-1 ml-4 list-decimal space-y-0.5" {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="text-foreground" {...props} />
                              ),
                              code: ({ node, inline, ...props }: any) => (
                                inline ? (
                                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                ) : (
                                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono my-1" {...props} />
                                )
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-bold text-foreground" {...props} />
                              ),
                              em: ({ node, ...props }) => (
                                <em className="italic" {...props} />
                              ),
                              a: ({ node, ...props }) => (
                                <a className="text-purple-custom underline" {...props} />
                              ),
                            }}
                          >
                            {step.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        // Plain text for other step types
                        <div className="whitespace-pre-wrap">{step.content}</div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
