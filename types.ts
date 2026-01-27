export interface CVFormData {
  originalCV: string;
  targetCompany: string;
  targetRole: string;
  jobDescription: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface OptimizationResult {
  content: string;
  groundingMetadata?: {
    groundingChunks: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}