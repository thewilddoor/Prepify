'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StudyGuideViewer } from '@/components/study-guide-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSession } from '@/lib/db';
import type { Session } from '@/types';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'combined'>('questions');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const loadedSession = await getSession(sessionId);

        if (!loadedSession) {
          setError('Session not found');
          setIsLoading(false);
          return;
        }

        if (loadedSession.status !== 'complete' || !loadedSession.result) {
          setError('Study guide not ready');
          setIsLoading(false);
          return;
        }

        setSession(loadedSession);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-custom mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading results...
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

  // Determine what content to display
  const mode = session.mode || 'study-guide';
  const isFocusedQuiz = mode === 'focused-quiz';

  const getDisplayContent = () => {
    switch (activeTab) {
      case 'questions':
        return session.studyGuide || '';
      case 'answers':
        return session.answerSheet || '';
      case 'combined':
        return session.result || '';
      default:
        return '';
    }
  };

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
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold inline-block">
              <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-[#C8A8E3] pr-1 animate-[typing_2s_steps(22)_1s_1_normal_both,blink_0.75s_step-end_infinite]">
                {isFocusedQuiz ? 'Focused Quiz Ready' : 'Study Materials Ready'}
              </span>
            </h1>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex justify-center gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'text-purple-custom border-b-2 border-purple-custom'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {isFocusedQuiz ? 'Quiz' : 'Study Guide'}
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'answers'
                  ? 'text-purple-custom border-b-2 border-purple-custom'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {isFocusedQuiz ? 'Answers' : 'Answer Sheet'}
            </button>
            {!isFocusedQuiz && (
              <button
                onClick={() => setActiveTab('combined')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'combined'
                    ? 'text-purple-custom border-b-2 border-purple-custom'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Combined
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={activeTab}
        >
          <StudyGuideViewer content={getDisplayContent()} />
        </motion.div>
      </main>
    </div>
  );
}
