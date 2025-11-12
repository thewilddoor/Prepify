export type StepType = 'vision' | 'thinking' | 'tool_use' | 'generation';
export type StepStatus = 'pending' | 'active' | 'complete';
export type SessionStatus = 'uploading' | 'processing_questions' | 'questions_complete' | 'processing_answers' | 'complete' | 'error';
export type GenerationStep = 1 | 2;
export type SessionMode = 'study-guide' | 'focused-quiz';

export interface Step {
  id: string;
  type: StepType;
  content: string;
  status: StepStatus;
  timestamp: number;
  toolName?: string; // For tool_use type
  toolInput?: string; // For tool_use type
  generationStep?: GenerationStep; // Which generation step this belongs to
}

export interface Session {
  id: string;
  timestamp: number;
  images: string[]; // base64 encoded images
  descriptions: string[]; // optional context per image
  files?: FileUpload[]; // All uploaded files (images, PDFs, PPTs)
  status: SessionStatus;
  steps: Step[];
  studyGuide?: string; // Step 1: Questions only
  answerSheet?: string; // Step 2: Answers based on study guide
  result?: string; // Combined result (for backwards compatibility)
  currentStep?: GenerationStep; // Current generation step
  errorMessage?: string;
  completedAt?: number;
  mode?: SessionMode; // Mode: study-guide or focused-quiz
  config?: StudyGuideConfig | FocusedQuizConfig; // Configuration for generation
  title?: string; // Custom user-editable title
}

export interface StreamEvent {
  type: 'init' | 'step_start' | 'step_update' | 'step_complete' | 'thinking' | 'tool_use' | 'complete' | 'error';
  stepId?: string;
  stepType?: StepType;
  content?: string;
  toolName?: string;
  toolInput?: string;
  result?: string;
  error?: string;
}

export type FileType = 'image' | 'pdf' | 'ppt';

export interface ImageUpload {
  file: File;
  preview: string;
  description?: string;
}

export interface FileUpload {
  type: FileType;
  data: string; // base64 encoded for images/PDFs, or extracted text for PPTs
  description?: string;
  fileName: string;
  extractedText?: string; // For PPT files
  pageCount?: number; // For PDFs and PPTs
}

export interface StudyGuideConfig {
  mode?: 'study-guide';
  questionCount: number;
  focusPoints: string;
  curriculum?: string;
  gradeLevel?: string;
  difficulty: 'match' | 'easier' | 'harder';
  additionalInstructions?: string;
}

export interface FocusedQuizConfig {
  mode: 'focused-quiz';
  questionCount: number;
  curriculum?: string;
  gradeLevel?: string;
  difficulty: 'match' | 'easier' | 'harder';
  additionalInstructions?: string;
}
