'use client';

import { useEffect, useState, useRef } from 'react';
import { StepCard } from './step-card';
import { ThinkingBlock } from './thinking-block';
import { Progress } from '@/components/ui/progress';
import type { Step, StudyGuideConfig } from '@/types';

interface AgenticViewerProps {
  sessionId: string;
  images: string[];
  descriptions: string[];
  step?: 1 | 2;
  studyGuide?: string;
  config?: StudyGuideConfig;
  onComplete: (result: string) => void;
  onError: (error: string) => void;
}

export function AgenticViewer({
  sessionId,
  images,
  descriptions,
  step = 1,
  studyGuide,
  config,
  onComplete,
  onError,
}: AgenticViewerProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const resultRef = useRef<string>('');

  // Auto-scroll to latest step
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  useEffect(() => {
    let mounted = true;

    const connectToStream = async () => {
      try {
        // Start streaming generation
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images,
            descriptions,
            step,
            studyGuide,
            config,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start generation');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        setIsConnected(true);

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !mounted) continue;

            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const data = JSON.parse(dataMatch[1]);

              handleStreamEvent(eventType, data);
            }
          }
        }
      } catch (error: any) {
        console.error('Stream error:', error);
        if (mounted) {
          onError(error.message || 'Failed to generate study guide');
        }
      }
    };

    const handleStreamEvent = (eventType: string, data: any) => {
      if (!mounted) return;

      switch (eventType) {
        case 'init':
          setProgress(5);
          break;

        case 'step_start':
          setSteps((prev) => [
            ...prev,
            {
              id: data.stepId,
              type: data.stepType,
              content: '',
              status: 'active',
              timestamp: Date.now(),
              toolName: data.toolName,
              generationStep: step,
            },
          ]);
          setProgress((prev) => Math.min(prev + 15, 90));
          break;

        case 'step_update':
          setSteps((prev) =>
            prev.map((step) =>
              step.id === data.stepId
                ? { ...step, content: step.content + data.content }
                : step
            )
          );

          // Accumulate generation content
          if (data.stepType === 'generation') {
            resultRef.current += data.content;
          }
          break;

        case 'step_complete':
          setSteps((prev) =>
            prev.map((step) =>
              step.id === data.stepId ? { ...step, status: 'complete' } : step
            )
          );
          setProgress((prev) => Math.min(prev + 10, 95));
          break;

        case 'complete':
          setProgress(100);
          setTimeout(() => {
            if (mounted) {
              onComplete(resultRef.current);
            }
          }, 1000);
          break;

        case 'error':
          onError(data.error || 'Unknown error occurred');
          break;
      }
    };

    connectToStream();

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sessionId, images, descriptions, onComplete, onError]);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">
            {progress === 100 ? 'Complete!' : step === 1 ? 'Step 1: Generating Questions...' : 'Step 2: Generating Answers...'}
          </h2>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Config Summary */}
        {config && step === 1 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Generating {config.questionCount} questions
            {config.focusPoints && ` • Focus: ${config.focusPoints.substring(0, 50)}${config.focusPoints.length > 50 ? '...' : ''}`}
            {config.curriculum && ` • ${config.curriculum}`}
            {config.gradeLevel && ` • ${config.gradeLevel}`}
          </div>
        )}
      </div>

      {/* Steps Container */}
      <div
        ref={containerRef}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
      >
        {steps.map((step) => (
          <StepCard key={step.id} step={step}>
            {step.type === 'thinking' && (
              <ThinkingBlock
                content={step.content}
                isStreaming={step.status === 'active'}
              />
            )}
          </StepCard>
        ))}

        {!isConnected && steps.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Connecting to generation service...
          </div>
        )}
      </div>
    </div>
  );
}
