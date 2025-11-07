export type StepType = 'vision' | 'thinking' | 'tool_use' | 'generation';
export type StepStatus = 'pending' | 'active' | 'complete';
export type SessionStatus = 'uploading' | 'processing' | 'complete' | 'error';

export interface Step {
  id: string;
  type: StepType;
  content: string;
  status: StepStatus;
  timestamp: number;
  toolName?: string; // For tool_use type
  toolInput?: string; // For tool_use type
}

export interface Session {
  id: string;
  timestamp: number;
  images: string[]; // base64 encoded images
  descriptions: string[]; // optional context per image
  status: SessionStatus;
  steps: Step[];
  result?: string; // final generated content
  errorMessage?: string;
  completedAt?: number;
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

export interface ImageUpload {
  file: File;
  preview: string;
  description?: string;
}
