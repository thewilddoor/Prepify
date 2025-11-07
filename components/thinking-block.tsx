'use client';

import { useState, useEffect, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingBlock({ content, isStreaming = false }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [displayedContent, setDisplayedContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for streaming content
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    let currentIndex = displayedContent.length;

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
      }, 10); // Adjust speed here (lower = faster)

      return () => clearTimeout(timer);
    }
  }, [content, isStreaming, displayedContent]);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedContent, isStreaming]);

  if (!content && !isStreaming) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-4 rounded-lg bg-purple-custom/5 hover:bg-purple-custom/10 transition-colors">
        <span className="text-sm font-medium text-purple-custom flex-1">
          Extended Thinking
          {isStreaming && (
            <span className="ml-2 inline-block w-2 h-2 bg-purple-custom rounded-full animate-pulse" />
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-purple-custom" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-custom" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          <div
            ref={contentRef}
            className="p-4 rounded-lg bg-purple-custom/5 border border-purple-custom/10 max-h-96 overflow-y-auto"
          >
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
              {displayedContent}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-purple-custom ml-1"
                />
              )}
            </pre>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
