import React, { useState, useEffect, useRef } from 'react';
import { InterviewQuestion, InterviewAnswerEvaluation } from '../types';
import { evaluateInterviewAnswer } from '../services/geminiService';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Volume2,
  FileText,
  Copy,
  Check,
  Zap,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  BarChart3,
  ThumbsUp,
  Target,
  MessageSquare,
  Lightbulb,
  Circle
} from 'lucide-react';

interface InterviewSimulatorProps {
  questions: InterviewQuestion[];
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  onClose?: () => void;
}

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({
  questions,
  targetRole,
  targetCompany,
  jobDescription,
}) => {
  // Controle de pergunta ativa
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQuestion = questions[currentIndex] || questions[0];

  // Resposta atual digitada/falada
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const currentAnswer = (currentQuestion && answers[currentQuestion.id]) || '';

  // Histórico de avaliações por ID da pergunta
  const [evaluations, setEvaluations] = useState<Record<string, InterviewAnswerEvaluation>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Modo de exibição: 'practice' (Respondendo) | 'result' (Feedback da IA) | 'summary' (Painel Geral da Sessão)
  const [viewState, setViewState] = useState<'practice' | 'result' | 'summary'>('practice');

  // Cronômetro de resposta
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reconhecimento de Voz / Microfone
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Estado de cópia de texto
  const [copiedModelAnswer, setCopiedModelAnswer] = useState<boolean>(false);
  const [copiedFullReport, setCopiedFullReport] = useState<boolean>(false);

  // Inicialização de suporte a Web Speech API
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setAnswers(prev => {
              const currentId = currentQuestion?.id;
              if (!currentId) return prev;
              const existing = prev[currentId] || '';
              const separator = existing && !existing.endsWith(' ') ? ' ' : '';
              return {
                ...prev,
                [currentId]: existing + separator + transcript
              };
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Aviso no reconhecimento de voz:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('Web Speech API indisponível ou bloqueada neste navegador/iframe:', err);
      setSpeechSupported(false);
    }
  }, [currentQuestion?.id]);

  // Gestão do Cronômetro
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Reiniciar timer quando mudar de pergunta
  useEffect(() => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    // Se já tem avaliação para essa pergunta, mostra o resultado; senão, modo de prática
    if (currentQuestion && evaluations[currentQuestion.id]) {
      setViewState('result');
    } else {
      setViewState('practice');
    }
  }, [currentIndex, currentQuestion?.id]);

  // Formatação do tempo MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Toggle gravação de microfone
  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        if (!isTimerRunning) {
          setIsTimerRunning(true);
        }
      } catch (err) {
        console.error('Falha ao iniciar reconhecimento:', err);
      }
    }
  };

  // Atualizar resposta digitada
  const handleAnswerChange = (text: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: text
    }));
    if (!isTimerRunning && text.length > 5) {
      setIsTimerRunning(true);
    }
  };

  // Submeter resposta para avaliação imediata da IA
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !currentAnswer.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setIsTimerRunning(false);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    try {
      const evaluation = await evaluateInterviewAnswer(
        currentQuestion.question,
        currentAnswer,
        targetRole,
        targetCompany,
        jobDescription
      );

      evaluation.elapsedSeconds = timerSeconds;

      setEvaluations(prev => ({
        ...prev,
        [currentQuestion.id]: evaluation
      }));

      setViewState('result');
    } catch (err) {
      console.error('Erro na avaliação da IA:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Refazer pergunta atual
  const handleRetryQuestion = () => {
    setViewState('practice');
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  // Navegar entre perguntas
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setViewState('summary');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Estatísticas da sessão
  const evaluatedKeys = Object.keys(evaluations);
  const totalQuestions = questions.length;
  const answeredCount = evaluatedKeys.length;
  const averageScore = answeredCount > 0
    ? Math.round(evaluatedKeys.reduce((acc, k) => acc + (evaluations[k]?.score || 0), 0) / answeredCount)
    : 0;

  const currentEval = currentQuestion ? evaluations[currentQuestion.id] : undefined;

  // Cor do score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-300';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  const copyModelAnswer = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedModelAnswer(true);
    setTimeout(() => setCopiedModelAnswer(false), 2000);
  };

  const copyFullSessionReport = () => {
    let report = `=== RELATÓRIO DA SIMULAÇÃO DE ENTREVISTA ===\n`;
    report += `Cargo: ${targetRole} | Empresa: ${targetCompany}\n`;
    report += `Média Geral: ${averageScore}/100 (${answeredCount}/${totalQuestions} perguntas respondidas)\n\n`;

    questions.forEach((q, idx) => {
      const ev = evaluations[q.id];
      const ans = answers[q.id];
      report += `--- Pergunta ${idx + 1} [${q.category}] ---\n`;
      report += `Q: ${q.question}\n`;
      if (ans) {
        report += `Sua Resposta: "${ans}"\n`;
      }
      if (ev) {
        report += `Nota: ${ev.score}/100 (${ev.grade})\n`;
        report += `Feedback: ${ev.feedback}\n`;
        report += `Pontos Fortes: ${ev.strengths.join(', ')}\n`;
        report += `Melhorias: ${ev.improvements.join(', ')}\n`;
        if (ev.modelAnswer) {
          report += `Resposta Modelo: ${ev.modelAnswer}\n`;
        }
      } else {
        report += `Status: Não respondida\n`;
      }
      report += `\n`;
    });

    navigator.clipboard.writeText(report);
    setCopiedFullReport(true);
    setTimeout(() => setCopiedFullReport(false), 2500);
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhuma pergunta disponível para a simulação no momento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Simulador com Barra de Progresso e Métricas */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Simulador Interativo de Entrevista
              </span>
              <span className="text-xs text-slate-400">
                {targetRole} @ {targetCompany}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Treinamento com Feedback Imediato da IA
            </h2>
          </div>

          {/* Indicadores de Progresso e Média */}
          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <div className="text-center">
              <div className="text-[11px] text-slate-400 font-medium">Respondidas</div>
              <div className="text-base font-bold text-white">
                {answeredCount} <span className="text-slate-500 text-xs">/ {totalQuestions}</span>
              </div>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-[11px] text-slate-400 font-medium">Média da Sessão</div>
              <div className="text-base font-bold text-emerald-400">
                {answeredCount > 0 ? `${averageScore}/100` : '--'}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <button
              type="button"
              onClick={() => setViewState('summary')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewState === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
              Painel Geral
            </button>
          </div>
        </div>

        {/* Trilha de Navegação de Perguntas em Pílulas */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {questions.map((q, idx) => {
            const hasEval = !!evaluations[q.id];
            const isCurrent = idx === currentIndex && viewState !== 'summary';
            const evalData = evaluations[q.id];

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  if (evalData) {
                    setViewState('result');
                  } else {
                    setViewState('practice');
                  }
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 shadow-md'
                    : hasEval
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {hasEval ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                )}
                <span>Q{idx + 1}</span>
                {hasEval && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200">
                    {evalData.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VISTA 1 & 2: PRÁTICA OU FEEDBACK DA PERGUNTA ATIVA */}
      {viewState !== 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Principal: Card da Pergunta e Interface de Resposta */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Card da Pergunta */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentQuestion.category}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                    Dificuldade: {currentQuestion.difficulty || 'Intermediário'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Tempo de Resposta:</span>
                  <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-md ${
                    timerSeconds > 120 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pergunta {currentIndex + 1} de {questions.length}
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-snug">
                  "{currentQuestion.question}"
                </h3>
              </div>

              {/* Por que o recrutador pergunta isso */}
              {currentQuestion.whyTheyAsk && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-semibold block mb-0.5">O que o entrevistador quer avaliar:</strong>
                    <span>{currentQuestion.whyTheyAsk}</span>
                  </div>
                </div>
              )}
            </div>

            {/* MODO PRÁTICA (DIGITAÇÃO / ÁUDIO) */}
            {viewState === 'practice' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Sua Resposta:
                  </label>

                  {/* Controles de Áudio / Microfone */}
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isRecording
                          ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-md'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isRecording ? 'Ouvindo... Clique para Parar' : 'Responder por Voz (Microfone)'}
                    </button>
                  )}
                </div>

                {/* Textarea de Resposta */}
                <div className="relative">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Fale ou digite sua resposta aqui com naturalidade. Estruture seu raciocínio: contexto inicial, seu papel específico, ações práticas tomadas e o resultado concreto alcançado..."
                    rows={7}
                    className="w-full p-4 border border-slate-300 rounded-xl text-slate-800 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-white/90 px-2 py-0.5 rounded">
                    {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} palavras
                  </div>
                </div>

                {/* Dica de Método STAR em pílulas */}
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950">
                  <div className="font-bold flex items-center gap-1.5 mb-1.5 text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Dica de Estruturação (Método STAR):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-700 block">1. Situação</strong>
                      Contexto rápido do desafio
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-700 block">2. Tarefa</strong>
                      Sua meta individual
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-700 block">3. Ação</strong>
                      Como você resolveu (ferramentas)
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-700 block">4. Resultado</strong>
                      Impacto com números ou aprendizado
                    </div>
                  </div>
                </div>

                {/* Botão de Envio para Avaliação */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none px-3 py-2 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || isEvaluating}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        O Headhunter IA está avaliando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Receber Feedback Imediato da IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* MODO RESULTADO (FEEDBACK DETALHADO DA IA) */}
            {viewState === 'result' && currentEval && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
                
                {/* Cabeçalho do Feedback com Score e Veredicto */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black">
                      <span className="text-2xl leading-none">{currentEval.score}</span>
                      <span className="text-[10px] text-indigo-200 uppercase tracking-widest mt-0.5">/100</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-white/10 text-emerald-300 border border-emerald-400/30">
                          Nota {currentEval.grade || 'A'}
                        </span>
                        <span className="text-xs text-slate-300">
                          Tempo: {formatTime(currentEval.elapsedSeconds || timerSeconds)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {currentEval.verdict || 'Avaliação da Resposta'}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRetryQuestion}
                    className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition-all border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tentar Novamente
                  </button>
                </div>

                {/* Diagnóstico Geral */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Diagnóstico do Recrutador
                  </h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                    {currentEval.feedback}
                  </p>
                </div>

                {/* Auditoria STAR (Situação, Tarefa, Ação, Resultado) */}
                {currentEval.starBreakdown && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Auditoria do Método STAR
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Situação */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">1. Situação (Contexto)</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            currentEval.starBreakdown.situation.present ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {currentEval.starBreakdown.situation.present ? '✓ Presente' : '✕ Faltou'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{currentEval.starBreakdown.situation.observation}</p>
                      </div>

                      {/* Tarefa */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">2. Tarefa (Seu Papel)</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            currentEval.starBreakdown.task.present ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {currentEval.starBreakdown.task.present ? '✓ Presente' : '✕ Faltou'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{currentEval.starBreakdown.task.observation}</p>
                      </div>

                      {/* Ação */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">3. Ação (Como Executou)</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            currentEval.starBreakdown.action.present ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {currentEval.starBreakdown.action.present ? '✓ Presente' : '✕ Faltou'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{currentEval.starBreakdown.action.observation}</p>
                      </div>

                      {/* Resultado */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">4. Resultado (Impacto)</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            currentEval.starBreakdown.result.present ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {currentEval.starBreakdown.result.present ? '✓ Presente' : '✕ Faltou'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{currentEval.starBreakdown.result.observation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pontos Fortes e Melhorias em 2 Colunas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pontos Fortes */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pontos Fortes da Sua Resposta
                    </h5>
                    <ul className="space-y-1.5">
                      {currentEval.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-emerald-950 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Oportunidades de Melhoria */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Oportunidades de Melhoria
                    </h5>
                    <ul className="space-y-1.5">
                      {currentEval.improvements.map((imp, idx) => (
                        <li key={idx} className="text-xs text-amber-950 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Resposta Modelo Padrão Ouro */}
                {currentEval.modelAnswer && (
                  <div className="bg-indigo-950 text-white rounded-xl p-5 border border-indigo-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Exemplo de Resposta "Padrão Ouro" (Benchmark)
                      </div>
                      <button
                        type="button"
                        onClick={() => copyModelAnswer(currentEval.modelAnswer)}
                        className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1"
                      >
                        {copiedModelAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedModelAnswer ? 'Copiado!' : 'Copiar Exemplo'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-black/20 p-3.5 rounded-lg border border-white/5">
                      "{currentEval.modelAnswer}"
                    </p>
                    {currentEval.toneAndDeliveryTips && (
                      <p className="text-[11px] text-indigo-300 flex items-center gap-1.5 pt-1">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>Dica de Postura & Tom:</strong> {currentEval.toneAndDeliveryTips}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Botões de Ação Final da Pergunta */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 px-3 py-2 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" /> Pergunta Anterior
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Próxima Pergunta ({currentIndex + 2}/{questions.length})
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Ver Relatório Final da Simulação
                        <BarChart3 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Dicas da Pergunta & Estrutura Recomendada */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Dica da Pergunta */}
            {currentQuestion.tips && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Dica de Especialista para Esta Pergunta
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  {currentQuestion.tips}
                </p>
              </div>
            )}

            {/* Estrutura Recomendada de Resposta */}
            {currentQuestion.idealAnswerFramework && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Estrutura Sugerida de Resposta
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {currentQuestion.idealAnswerFramework}
                </p>
              </div>
            )}

            {/* Guia Rápido de Timing de Entrevista */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Guia de Timing do Recrutador
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span>Até 1 min:</span>
                  <span className="font-semibold text-amber-300">Rápido (pode faltar detalhes)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span>1 a 2 min:</span>
                  <span className="font-bold text-emerald-400">Tempo Ideal (STAR completo)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Mais de 2.5 min:</span>
                  <span className="font-semibold text-rose-300">Prolixo (risco de perder atenção)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: PAINEL GERAL / RELATÓRIO COMPLETO DA SESSÃO */}
      {viewState === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8 animate-fade-in">
          
          {/* Card Topo do Relatório */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Relatório de Desempenho
              </span>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Simulação de Entrevista Concluída
              </h3>
              <p className="text-xs text-slate-300 max-w-lg">
                Avaliação consolidada para a vaga de <strong>{targetRole}</strong> na <strong>{targetCompany}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-center p-4 rounded-2xl bg-white/10 border border-white/10">
                <div className="text-xs text-slate-300 font-semibold mb-1">Média Geral</div>
                <div className="text-4xl font-black text-emerald-400">{averageScore}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">/ 100 pontos</div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={copyFullSessionReport}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  {copiedFullReport ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFullReport ? 'Relatório Copiado!' : 'Copiar Relatório Completo'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setViewState('practice');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar Treinamento
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Resumo das Perguntas */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Desempenho Pergunta a Pergunta:
            </h4>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const ev = evaluations[q.id];
                const ans = answers[q.id];

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {q.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {ev ? (
                          <>
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Nota: {ev.score}/100 ({ev.grade})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentIndex(idx);
                                setViewState('result');
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Ver Feedback &rarr;
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentIndex(idx);
                              setViewState('practice');
                            }}
                            className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-all"
                          >
                            Responder Agora &rarr;
                          </button>
                        )}
                      </div>
                    </div>

                    {ans && (
                      <p className="text-xs text-slate-500 italic pl-8 line-clamp-2">
                        Sua resposta: "{ans}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
