'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StudyGuideViewer } from '@/components/study-guide-viewer';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Plus } from 'lucide-react';
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

  const generationTime = session.completedAt
    ? Math.round((session.completedAt - session.timestamp) / 1000)
    : 0;

  const questionCount = (session.studyGuide?.match(/\d+\./g) || []).length;

  // Determine what content to display
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h1 className="text-4xl font-bold">Study Materials Ready</h1>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Generated in</span>{' '}
              <span className="text-purple-custom font-semibold">
                {generationTime} seconds
              </span>
            </div>
            {questionCount > 0 && (
              <div>
                <span className="font-medium">Questions</span>{' '}
                <span className="text-purple-custom font-semibold">
                  {questionCount}
                </span>
              </div>
            )}
          </div>

          {/* Config Metadata */}
          {session.config && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3">
                  Generation Settings
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Question Count:</span>{' '}
                    <span className="font-medium">{session.config.questionCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>{' '}
                    <span className="font-medium capitalize">{session.config.difficulty}</span>
                  </div>
                  {session.config.gradeLevel && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Grade Level:</span>{' '}
                      <span className="font-medium">{session.config.gradeLevel}</span>
                    </div>
                  )}
                  {session.config.curriculum && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Curriculum:</span>{' '}
                      <span className="font-medium">{session.config.curriculum}</span>
                    </div>
                  )}
                  {session.config.focusPoints && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Focus Points:</span>{' '}
                      <span className="font-medium">{session.config.focusPoints}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
              Study Guide
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'answers'
                  ? 'text-purple-custom border-b-2 border-purple-custom'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Answer Sheet
            </button>
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
