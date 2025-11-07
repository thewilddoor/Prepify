'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AgenticViewer } from '@/components/agentic-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSession, updateSession } from '@/lib/db';
import { saveStudyGuide, saveAnswerSheet } from '@/lib/session';
import type { Session } from '@/types';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const loadedSession = await getSession(sessionId);

        if (!loadedSession) {
          setError('Session not found');
          setIsLoading(false);
          return;
        }

        setSession(loadedSession);

        // Determine which step to start from
        const step = loadedSession.currentStep || 1;
        setCurrentStep(step as 1 | 2);

        // Update session status based on step
        const status = step === 1 ? 'processing_questions' : 'processing_answers';
        await updateSession(sessionId, { status });
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleComplete = async (result: string) => {
    try {
      if (currentStep === 1) {
        // Save study guide and prepare for step 2
        await saveStudyGuide(sessionId, result);

        // Reload session to get updated data
        const updatedSession = await getSession(sessionId);
        if (updatedSession) {
          setSession(updatedSession);
          setCurrentStep(2);
        }
      } else {
        // Save answer sheet and complete
        await saveAnswerSheet(sessionId, result);

        // Navigate to result page
        router.push(`/result/${sessionId}`);
      }
    } catch (err) {
      console.error('Error completing session:', err);
      setError('Failed to save results');
    }
  };

  const handleError = async (errorMessage: string) => {
    try {
      await updateSession(sessionId, {
        status: 'error',
        errorMessage,
      });
      setError(errorMessage);
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-custom mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {error || 'Session not found'}
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <main className="max-w-6xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          key={currentStep}
        >
          <AgenticViewer
            sessionId={sessionId}
            images={session.images}
            descriptions={session.descriptions}
            step={currentStep}
            studyGuide={session.studyGuide}
            onComplete={handleComplete}
            onError={handleError}
          />
        </motion.div>
      </main>
    </div>
  );
}
