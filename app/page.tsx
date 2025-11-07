'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/upload-zone';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ImageUpload } from '@/types';
import { createSession, fileToBase64 } from '@/lib/session';
import { cleanupOldSessions } from '@/lib/db';

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
      alert('Please upload at least one image');
      return;
    }

    setIsGenerating(true);

    try {
      // Convert all images to base64
      const base64Images = await Promise.all(
        images.map((img) => fileToBase64(img.file))
      );

      const descriptions = images.map((img) => img.description || '');

      // Create session in IndexedDB
      const session = await createSession(base64Images, descriptions);

      // Navigate to generation page
      router.push(`/generate/${session.id}`);
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
            <Sparkles className="h-8 w-8 text-purple-custom" />
            <h1 className="text-5xl font-bold tracking-tight">
              Assignment Prep AI
            </h1>
          </div>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Transform notes into practice materials
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
              'Starting Generation...'
            ) : (
              <>
                Generate Study Guide
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
            {images.length} image{images.length !== 1 ? 's' : ''} ready to analyze
          </motion.div>
        )}
      </main>
    </div>
  );
}
