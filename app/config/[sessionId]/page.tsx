'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ConfigForm } from '@/components/config-form';
import { getSession, updateSession } from '@/lib/db';
import type { Session, StudyGuideConfig } from '@/types';

export default function ConfigPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const loadedSession = await getSession(sessionId);
        if (!loadedSession) {
          setError('Session not found');
          return;
        }
        setSession(loadedSession);
      } catch (err) {
        setError('Failed to load session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleConfigSubmit = async (config: StudyGuideConfig) => {
    if (!session) return;

    try {
      // Save config to session
      await updateSession(sessionId, {
        config,
        status: 'processing_questions',
      });

      // Navigate to generation page
      router.push(`/generate/${sessionId}`);
    } catch (err) {
      setError('Failed to save configuration');
      console.error(err);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Configure Study Guide
          </h1>
          <p className="text-gray-600">
            {session.images.length} {session.images.length === 1 ? 'file' : 'files'} uploaded
          </p>
        </div>

        <ConfigForm
          onSubmit={handleConfigSubmit}
          onBack={handleBack}
          initialConfig={session.config}
        />
      </div>
    </div>
  );
}
