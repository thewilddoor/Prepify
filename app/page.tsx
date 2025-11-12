'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/upload-zone';
import { ModeCard } from '@/components/mode-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, NotebookPen, Target, History } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ImageUpload, FileUpload, SessionMode } from '@/types';
import { createSession, fileToBase64, processFile } from '@/lib/session';
import { cleanupOldSessions } from '@/lib/db';
import { saveSession } from '@/lib/db';

export default function Home() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SessionMode>('study-guide');
  const [totalGenerations, setTotalGenerations] = useState<number | null>(null);
  const router = useRouter();

  // Cleanup old sessions on mount
  useEffect(() => {
    cleanupOldSessions().catch(console.error);
  }, []);

  // Fetch generation stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setTotalGenerations(data.totalGenerations);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleGenerate = async () => {
    if (images.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsGenerating(true);

    try {
      // Process all files (images, PDFs, PPTs)
      const processedFiles: FileUpload[] = [];
      const base64Images: string[] = [];
      const descriptions: string[] = [];

      for (const img of images) {
        try {
          const processed = await processFile(img.file);
          processed.description = img.description || '';
          processedFiles.push(processed);

          // Keep base64 images for backwards compatibility
          if (processed.type === 'image') {
            base64Images.push(processed.data);
            descriptions.push(processed.description || '');
          }
        } catch (error) {
          console.error(`Error processing file ${img.file.name}:`, error);
          alert(`Failed to process ${img.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsGenerating(false);
          return;
        }
      }

      // Create session with both old (images) and new (files) format
      const session = await createSession(base64Images, descriptions, selectedMode);

      // Update session with processed files
      await saveSession({
        ...session,
        files: processedFiles,
      });

      // Navigate to config page
      router.push(`/config/${session.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to start generation. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <main className="max-w-6xl mx-auto px-8 py-16">
        {/* History Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-end mb-4"
        >
          <Button
            variant="outline"
            onClick={() => router.push('/history')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <NotebookPen className="h-8 w-8" style={{ color: '#C8A8E3' }} />
            <h1 className="text-5xl font-bold tracking-tight">
              Prepify
            </h1>
          </div>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Turns your unit notes and handouts into personalized study guides
          </p>
          {totalGenerations !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 text-lg text-gray-500 dark:text-gray-500"
            >
              Prepify has generated {totalGenerations.toLocaleString()} study guides...
            </motion.p>
          )}
        </motion.div>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ModeCard
              mode="study-guide"
              title="Study Guide Generator"
              description="Turn notes and handouts into comprehensive practice questions"
              icon={<NotebookPen className="h-6 w-6" />}
              selected={selectedMode === 'study-guide'}
              onClick={() => setSelectedMode('study-guide')}
            />
            <ModeCard
              mode="focused-quiz"
              title="Focused Quiz"
              description="Upload graded work to get targeted practice on your weak areas"
              icon={<Target className="h-6 w-6" />}
              selected={selectedMode === 'focused-quiz'}
              onClick={() => setSelectedMode('focused-quiz')}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <UploadZone
            images={images}
            onImagesChange={setImages}
            helpText={
              selectedMode === 'focused-quiz'
                ? 'Upload graded assignments/tests with marks and corrections visible'
                : undefined
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex justify-center"
        >
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={images.length === 0 || isGenerating}
            className="px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              'Proceeding to Configuration...'
            ) : (
              <>
                Next: Configure
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>

        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            {images.length} file{images.length !== 1 ? 's' : ''} ready to analyze
          </motion.div>
        )}
      </main>
    </div>
  );
}
