import { v4 as uuidv4 } from 'uuid';
import type { Session, Step } from '@/types';
import { saveSession, getSession, updateSession } from './db';

// Create a new session
export const createSession = async (
  images: string[],
  descriptions: string[]
): Promise<Session> => {
  const session: Session = {
    id: uuidv4(),
    timestamp: Date.now(),
    images,
    descriptions,
    status: 'uploading',
    steps: [],
  };

  await saveSession(session);
  return session;
};

// Add a step to a session
export const addStep = async (
  sessionId: string,
  step: Omit<Step, 'id' | 'timestamp'>
): Promise<void> => {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const newStep: Step = {
    ...step,
    id: uuidv4(),
    timestamp: Date.now(),
  };

  await updateSession(sessionId, {
    steps: [...session.steps, newStep],
  });
};

// Update a step in a session
export const updateStep = async (
  sessionId: string,
  stepId: string,
  updates: Partial<Step>
): Promise<void> => {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const updatedSteps = session.steps.map((step) =>
    step.id === stepId ? { ...step, ...updates } : step
  );

  await updateSession(sessionId, { steps: updatedSteps });
};

// Mark session as complete
export const completeSession = async (
  sessionId: string,
  result: string
): Promise<void> => {
  await updateSession(sessionId, {
    status: 'complete',
    result,
    completedAt: Date.now(),
  });
};

// Mark session as error
export const errorSession = async (
  sessionId: string,
  errorMessage: string
): Promise<void> => {
  await updateSession(sessionId, {
    status: 'error',
    errorMessage,
  });
};

// Convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// Compress image if too large (>5MB)
export const compressImage = async (
  file: File,
  maxSizeMB: number = 5
): Promise<File> => {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file; // No compression needed
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate scale to achieve target size
        const scaleFactor = Math.sqrt(
          (maxSizeMB * 1024 * 1024) / file.size
        );
        width *= scaleFactor;
        height *= scaleFactor;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Get media type from base64 or file
export const getMediaType = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return file.type;
  }
  return 'image/jpeg'; // Default
};
