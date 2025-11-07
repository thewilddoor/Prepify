'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/session';
import type { ImageUpload } from '@/types';

interface UploadZoneProps {
  onImagesChange: (images: ImageUpload[]) => void;
  images: ImageUpload[];
}

export function UploadZone({ onImagesChange, images }: UploadZoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true);

      try {
        const newImages: ImageUpload[] = [];

        for (const file of acceptedFiles) {
          // Compress if needed
          const processedFile = await compressImage(file);

          // Create preview URL
          const preview = URL.createObjectURL(processedFile);

          newImages.push({
            file: processedFile,
            preview,
            description: '',
          });
        }

        onImagesChange([...images, ...newImages]);
      } catch (error) {
        console.error('Error processing files:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [images, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const updateDescription = (index: number, description: string) => {
    const newImages = [...images];
    newImages[index].description = description;
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-8">
      <Card
        {...getRootProps()}
        className={`
          relative overflow-hidden border-2 border-dashed transition-all duration-300 cursor-pointer
          ${
            isDragActive
              ? 'border-purple-custom bg-purple-custom/5 scale-[1.02]'
              : 'border-gray-200 dark:border-gray-800 hover:border-purple-custom/50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="p-16 text-center">
          <Upload
            className={`mx-auto h-16 w-16 mb-6 transition-colors ${
              isDragActive ? 'text-purple-custom' : 'text-gray-400'
            }`}
          />
          <p className="text-2xl font-medium mb-2">
            {isDragActive ? 'Drop images here' : 'Drop images here'}
          </p>
          <p className="text-lg text-gray-500">
            or click to browse
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Support for JPG, PNG, GIF, WEBP (max 10MB each)
          </p>
        </div>
      </Card>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <Card
              key={index}
              className="relative group overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-square relative bg-gray-100 dark:bg-gray-900">
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <ImageIcon className="h-4 w-4" />
                  <span className="truncate">{image.file.name}</span>
                </div>
                <input
                  type="text"
                  placeholder="Add description (optional)"
                  value={image.description}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-custom/50"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="text-center text-gray-500">
          Processing images...
        </div>
      )}
    </div>
  );
}
