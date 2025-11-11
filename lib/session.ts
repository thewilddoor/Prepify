import { v4 as uuidv4 } from 'uuid';
import type { Session, Step, SessionStatus, FileUpload, FileType, SessionMode } from '@/types';
import { saveSession, getSession, updateSession } from './db';

// Create a new session
export const createSession = async (
  images: string[],
  descriptions: string[],
  mode: SessionMode = 'study-guide'
): Promise<Session> => {
  const session: Session = {
    id: uuidv4(),
    timestamp: Date.now(),
    images,
    descriptions,
    mode,
    status: 'uploading',
    steps: [],
    currentStep: 1,
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

// Save study guide (Step 1 result)
export const saveStudyGuide = async (
  sessionId: string,
  studyGuide: string
): Promise<void> => {
  await updateSession(sessionId, {
    studyGuide,
    status: 'questions_complete',
    currentStep: 2,
  });
};

// Save answer sheet (Step 2 result) and mark complete
export const saveAnswerSheet = async (
  sessionId: string,
  answerSheet: string
): Promise<void> => {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Combine study guide and answer sheet for backwards compatibility
  const combinedResult = `# Study Guide\n\n${session.studyGuide}\n\n---\n\n# Answer Sheet\n\n${answerSheet}`;

  await updateSession(sessionId, {
    answerSheet,
    result: combinedResult,
    status: 'complete',
    completedAt: Date.now(),
  });
};

// Update session status
export const updateSessionStatus = async (
  sessionId: string,
  status: SessionStatus
): Promise<void> => {
  await updateSession(sessionId, { status });
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

// Detect file type
export const detectFileType = (file: File): FileType => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    fileName.endsWith('.ppt') ||
    fileName.endsWith('.pptx')
  ) {
    return 'ppt';
  }
  return 'image';
};

// Process PPT file - send to server-side API for text extraction
export const processPPTFile = async (file: File): Promise<{ text: string; pageCount: number }> => {
  try {
    // Send to server-side API for processing
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/process-ppt', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process PPT file');
    }

    const result = await response.json();
    return {
      text: result.text,
      pageCount: result.pageCount,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process PPT file: ${error.message}`);
    }
    throw new Error('Failed to process PPT file');
  }
};

// Process PDF file - convert to base64 for Claude native processing
export const processPDFFile = async (file: File): Promise<string> => {
  try {
    // Validate file size (32MB limit for Claude)
    if (file.size > 32 * 1024 * 1024) {
      throw new Error('PDF file exceeds 32MB limit');
    }

    // Convert to base64
    const base64 = await fileToBase64(file);
    return base64;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF file: ${error.message}`);
    }
    throw new Error('Failed to process PDF file');
  }
};

// Process any file type
export const processFile = async (file: File): Promise<FileUpload> => {
  const fileType = detectFileType(file);

  switch (fileType) {
    case 'pdf': {
      const base64Data = await processPDFFile(file);
      return {
        type: 'pdf',
        data: base64Data,
        fileName: file.name,
        description: '',
      };
    }

    case 'ppt': {
      const { text, pageCount } = await processPPTFile(file);
      return {
        type: 'ppt',
        data: text,
        fileName: file.name,
        extractedText: text,
        pageCount,
        description: '',
      };
    }

    case 'image': {
      // Compress if needed
      const processedFile = await compressImage(file);
      const base64Data = await fileToBase64(processedFile);
      return {
        type: 'image',
        data: base64Data,
        fileName: file.name,
        description: '',
      };
    }

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};
