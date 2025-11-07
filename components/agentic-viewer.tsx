'use client'

import { useEffect, useState, useRef } from 'react'
import { StepCard } from './step-card'
import { ThinkingBlock } from './thinking-block'
import { Progress } from '@/components/ui/progress'
import type { Step, StudyGuideConfig } from '@/types'

interface AgenticViewerProps {
  sessionId: string
  images: string[]
  descriptions: string[]
  step?: 1 | 2
  studyGuide?: string
  config?: StudyGuideConfig
  onComplete: (result: string) => void
  onError: (error: string) => void
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
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const resultRef = useRef<string>('')

  // Auto-scroll to latest step
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [steps])

  useEffect(() => {
    let mounted = true

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
        })

        if (!response.ok) {
          throw new Error('Failed to start generation')
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        setIsConnected(true)

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim() || !mounted) continue

            const eventMatch = line.match(/^event: (.+)$/m)
            const dataMatch = line.match(/^data: (.+)$/m)

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1]
              const data = JSON.parse(dataMatch[1])

              handleStreamEvent(eventType, data)
            }
          }
        }
      } catch (error: any) {
        console.error('Stream error:', error)
        if (mounted) {
          onError(error.message || 'Failed to generate study guide')
        }
      }
    }

    const handleStreamEvent = (eventType: string, data: any) => {
      if (!mounted) return

      switch (eventType) {
        case 'init':
          setProgress(5)
          break

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
          ])
          setProgress((prev) => Math.min(prev + 15, 90))
          break

        case 'step_update':
          setSteps((prev) =>
            prev.map((step) =>
              step.id === data.stepId
                ? { ...step, content: step.content + data.content }
                : step
            )
          )

          // Accumulate generation content
          if (data.stepType === 'generation') {
            resultRef.current += data.content
          }
          break

        case 'step_complete':
          setSteps((prev) =>
            prev.map((step) =>
              step.id === data.stepId ? { ...step, status: 'complete' } : step
            )
          )
          setProgress((prev) => Math.min(prev + 10, 95))
          break

        case 'complete':
          setProgress(100)
          setTimeout(() => {
            if (mounted) {
              onComplete(resultRef.current)
            }
          }, 1000)
          break

        case 'error':
          onError(data.error || 'Unknown error occurred')
          break
      }
    }

    connectToStream()

    return () => {
      mounted = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [sessionId, images, descriptions, onComplete, onError])

  return (
    <div className="min-h-screen">
      {/* Progress Bar - Fixed at top with equal margins */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 pb-6 pt-8">
        <div className="mx-auto max-w-4xl px-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-foreground">
              {progress === 100
                ? 'Complete'
                : step === 1
                ? 'Generating Questions'
                : 'Generating Answers'}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1" />

          {/* Config Summary */}
          {config && step === 1 && (
            <div className="mt-4 text-xs text-muted-foreground space-x-3">
              <span>{config.questionCount} questions</span>
              {config.curriculum && <span>• {config.curriculum}</span>}
              {config.gradeLevel && <span>• {config.gradeLevel}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Steps Container - Centered with equal margins */}
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div ref={containerRef} className="space-y-1">
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
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-[#DAC2EF] border-t-transparent" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecting to generation service...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
