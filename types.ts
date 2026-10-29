export interface CVFormData {
  originalCV: string;
  targetCompany: string;
  targetRole: string;
  jobDescription: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export type QuestionCategory = 'Técnica' | 'Comportamental' | 'Situacional' | 'Cultura & Fit' | 'Para o Entrevistador' | string;

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  difficulty?: 'Básico' | 'Intermediário' | 'Avançado' | 'Estratégico';
  whyTheyAsk?: string;
  tips?: string;
  idealAnswerFramework?: string;
}

export interface SkillComparisonItem {
  skill: string;
  category?: 'Hard Skill' | 'Soft Skill' | 'Ferramenta' | 'Metodologia' | string;
  requiredLevel: number; // 0 to 100
  userLevel: number;     // 0 to 100
  status?: 'matched' | 'gap' | 'exceeded';
  notes?: string;
}

export interface AtsScoreBreakdown {
  keywordMatching: number;
  skillsAlignment: number;
  experienceRelevance: number;
  formattingReadability: number;
}

export type AtsCheckStatus = 'passed' | 'warning' | 'critical';
export type AtsCheckCategory = 'structure' | 'keywords' | 'metrics' | 'formatting' | 'personal_data';

export interface AtsCheckItem {
  id: string;
  category: AtsCheckCategory;
  categoryLabel: string;
  title: string;
  description: string;
  status: AtsCheckStatus;
  detail: string;
  recommendation: string;
  exampleGood?: string;
  exampleBad?: string;
  autoDetected?: boolean;
}

export interface AtsSystemCompatibility {
  system: 'Gupy' | 'Workday' | 'Greenhouse' | 'Taleo' | 'Kenoby / Sólides';
  status: 'passed' | 'warning' | 'critical';
  compatibilityScore: number;
  highlight: string;
  advice: string;
}

export interface AtsChecklistReport {
  overallScore: number;
  passedCount: number;
  warningCount: number;
  criticalCount: number;
  totalChecks: number;
  items: AtsCheckItem[];
  systemCompatibilities: AtsSystemCompatibility[];
  executiveSummary: string;
  topActionItems: string[];
}

export interface AtsScoreDetails {
  overallScore: number;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: AtsScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  skillsComparison?: SkillComparisonItem[];
  strengths: string[];
  improvementSuggestions: string[];
  summary: string;
  checklist?: AtsChecklistReport;
}

export interface StarItemFeedback {
  present: boolean;
  score: number; // 0 to 100
  observation: string;
}

export interface InterviewAnswerEvaluation {
  score: number;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  verdict?: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  starBreakdown?: {
    situation: StarItemFeedback;
    task: StarItemFeedback;
    action: StarItemFeedback;
    result: StarItemFeedback;
  };
  modelAnswer?: string;
  toneAndDeliveryTips?: string;
  elapsedSeconds?: number;
}

export interface InterviewSimulationSession {
  totalQuestions: number;
  answeredCount: number;
  averageScore: number;
  answers: Record<string, string>;
  evaluations: Record<string, InterviewAnswerEvaluation>;
}

export interface ExpertCareerTipCategory {
  id: string;
  title: string;
  iconName?: string;
  summary: string;
  tips: {
    title: string;
    description: string;
    actionableStep?: string;
    tag?: string;
  }[];
}

export interface ExpertCareerAdvice {
  targetRole: string;
  targetCompany: string;
  executiveSummary: string;
  seniorityLevel: string;
  marketOutlook: string;
  categories: ExpertCareerTipCategory[];
  goldenRule: string;
  powerKeywords: string[];
  mustAskInterviewQuestions: string[];
}

export interface OptimizationResult {
  content: string;
  targetCompany?: string;
  targetRole?: string;
  atsScore?: AtsScoreDetails;
  interviewQuestions?: InterviewQuestion[];
  careerAdvice?: ExpertCareerAdvice;
  groundingMetadata?: {
    groundingChunks: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
  isQuotaLimited?: boolean;
  notice?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

declare global {
  interface Window {
    html2pdf?: any;
    marked?: any;
    pdfjsLib?: any;
  }
}
