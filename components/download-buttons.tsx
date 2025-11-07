'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

interface DownloadButtonsProps {
  content: string;
  sessionId: string;
}

export function DownloadButtons({ content, sessionId }: DownloadButtonsProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const downloadFile = async (format: 'pdf' | 'docx') => {
    const setLoading = format === 'pdf' ? setIsDownloadingPdf : setIsDownloadingDocx;

    try {
      setLoading(true);

      const response = await fetch(`/api/download/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-guide-${sessionId}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error(`Error downloading ${format}:`, error);
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={() => downloadFile('pdf')}
        disabled={isDownloadingPdf || isDownloadingDocx}
        size="lg"
        className="flex-1"
      >
        {isDownloadingPdf ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-5 w-5" />
            Download PDF
          </>
        )}
      </Button>

      <Button
        onClick={() => downloadFile('docx')}
        disabled={isDownloadingPdf || isDownloadingDocx}
        size="lg"
        variant="outline"
        className="flex-1"
      >
        {isDownloadingDocx ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating DOCX...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-5 w-5" />
            Download DOCX
          </>
        )}
      </Button>
    </div>
  );
}
