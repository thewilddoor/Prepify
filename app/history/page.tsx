'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HistoryCard } from '@/components/history-card';
import { ArrowLeft, History, Search } from 'lucide-react';
import { getCompletedSessions } from '@/lib/db';
import type { Session } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const completedSessions = await getCompletedSessions();
      setSessions(completedSessions);
      setFilteredSessions(completedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sessions.filter(
        (session) =>
          session.title?.toLowerCase().includes(query) ||
          session.config?.curriculum?.toLowerCase().includes(query) ||
          session.config?.gradeLevel?.toLowerCase().includes(query)
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  const handleDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setFilteredSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdate = () => {
    loadSessions();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-custom mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
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
            Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <History className="h-8 w-8" style={{ color: '#C8A8E3' }} />
            <h1 className="text-4xl font-bold tracking-tight">
              Your History
            </h1>
          </div>

          {/* Search Bar */}
          {sessions.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, subject, or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-custom/50"
              />
            </div>
          )}
        </motion.div>

        {/* Content */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-20"
          >
            <History className="h-24 w-24 mx-auto mb-6 text-gray-300 dark:text-gray-700" />
            <h2 className="text-2xl font-semibold mb-3">No history yet</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Your completed study guides will appear here
            </p>
            <Button onClick={() => router.push('/')} size="lg">
              Create Your First Study Guide
            </Button>
          </motion.div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="h-24 w-24 mx-auto mb-6 text-gray-300 dark:text-gray-700" />
            <h2 className="text-2xl font-semibold mb-3">No results found</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Try a different search term
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {filteredSessions.length} study guide{filteredSessions.length !== 1 ? 's' : ''}
              {searchQuery && ' found'}
            </p>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HistoryCard
                      session={session}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
