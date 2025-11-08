'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/upload-zone';
import { Button } from '@/components/ui/button';
import { ArrowRight, NotebookPen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ImageUpload, FileUpload } from '@/types';
import { createSession, fileToBase64, processFile } from '@/lib/session';
import { cleanupOldSessions } from '@/lib/db';
import { saveSession } from '@/lib/db';

export default function Home() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Cleanup old sessions on mount
  useEffect(() => {
    cleanupOldSessions().catch(console.error);
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
      const session = await createSession(base64Images, descriptions);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <UploadZone images={images} onImagesChange={setImages} />
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
