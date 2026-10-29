import { 
  OptimizationResult, 
  InterviewQuestion, 
  AtsScoreDetails, 
  ExpertCareerAdvice,
  InterviewAnswerEvaluation 
} from "../types";

/**
 * Envia o currículo para otimização no servidor (Proxy Seguro Backend Gemini API).
 */
export const optimizeCV = async (
  cvText: string,
  company: string,
  role: string,
  jobDesc: string,
  linkedinUrl?: string,
  githubUrl?: string
): Promise<OptimizationResult> => {
  try {
    const res = await fetch('/api/optimize-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvText,
        company,
        role,
        jobDesc,
        linkedinUrl,
        githubUrl,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status} ao otimizar currículo.`);
    }

    const data: OptimizationResult = await res.json();
    return data;
  } catch (error: any) {
    console.error("Erro na chamada de otimização de CV:", error);
    throw new Error(error.message || "Falha ao comunicar com o servidor de IA.");
  }
};

/**
 * Recalcula o ATS Score enviando o texto atualizado ao servidor.
 */
export const recalculateAtsScore = async (
  currentCvContent: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<AtsScoreDetails> => {
  try {
    const res = await fetch('/api/recalculate-ats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentCvContent,
        role,
        company,
        jobDesc,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status}`);
    }

    const data: AtsScoreDetails = await res.json();
    return data;
  } catch (err: any) {
    console.error("Erro ao recalcular ATS Score no servidor:", err);
    throw new Error(err.message || "Falha ao recalcular pontuação ATS.");
  }
};

/**
 * Solicita novas perguntas de entrevista ao servidor.
 */
export const generateMoreInterviewQuestions = async (
  role: string,
  company: string,
  jobDesc?: string,
  categoryFilter?: string
): Promise<InterviewQuestion[]> => {
  try {
    const res = await fetch('/api/generate-interview-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        company,
        jobDesc,
        categoryFilter,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status}`);
    }

    const data: InterviewQuestion[] = await res.json();
    return data;
  } catch (error: any) {
    console.error("Erro ao gerar novas perguntas no servidor:", error);
    throw new Error(error.message || "Falha ao gerar perguntas de entrevista.");
  }
};

/**
 * Avalia uma resposta de simulação de entrevista no servidor.
 */
export const evaluateInterviewAnswer = async (
  question: string,
  answer: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<InterviewAnswerEvaluation> => {
  try {
    const res = await fetch('/api/evaluate-interview-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        role,
        company,
        jobDesc,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status}`);
    }

    const data: InterviewAnswerEvaluation = await res.json();
    return data;
  } catch (error: any) {
    console.error("Erro ao avaliar resposta no servidor:", error);
    throw new Error(error.message || "Falha ao avaliar resposta com IA.");
  }
};

/**
 * Obtém conselho de carreira de especialista a partir do servidor.
 */
export const getExpertCareerAdvice = async (
  role: string,
  company: string,
  jobDesc?: string,
  cvText?: string
): Promise<ExpertCareerAdvice> => {
  try {
    const res = await fetch('/api/expert-career-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        company,
        jobDesc,
        cvText,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status}`);
    }

    const data: ExpertCareerAdvice = await res.json();
    return data;
  } catch (error: any) {
    console.error("Erro ao obter conselhos de especialista no servidor:", error);
    throw new Error(error.message || "Falha ao obter conselhos de carreira.");
  }
};
