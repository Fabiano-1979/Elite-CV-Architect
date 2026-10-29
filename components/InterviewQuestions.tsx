import React, { useState } from 'react';
import { InterviewQuestion, QuestionCategory, InterviewAnswerEvaluation } from '../types';
import { generateMoreInterviewQuestions, evaluateInterviewAnswer } from '../services/geminiService';
import { 
  Briefcase, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  BookOpen, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Search,
  MessageSquare,
  Award,
  TrendingUp,
  AlertCircle,
  Mic,
  Play,
  Zap,
  Target
} from 'lucide-react';

interface InterviewQuestionsProps {
  questions: InterviewQuestion[];
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  onUpdateQuestions?: (questions: InterviewQuestion[]) => void;
  onStartSimulation?: () => void;
}

export const InterviewQuestions: React.FC<InterviewQuestionsProps> = ({
  questions: initialQuestions,
  targetRole,
  targetCompany,
  jobDescription,
  onUpdateQuestions,
  onStartSimulation
}) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(initialQuestions);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(initialQuestions[0]?.id || null);
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState<boolean>(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);

  // Estados para simulação de resposta
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [isEvaluating, setIsEvaluating] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, InterviewAnswerEvaluation>>({});
  const [activeSimulatorId, setActiveSimulatorId] = useState<string | null>(null);
  const [showStarGuide, setShowStarGuide] = useState<boolean>(false);

  // Atualizar quando props mudarem
  React.useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      if (!expandedId) setExpandedId(initialQuestions[0].id);
    }
  }, [initialQuestions]);

  const categories = ['Todas', ...Array.from(new Set(questions.map(q => q.category)))];

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === 'Todas' || q.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.tips && q.tips.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.whyTheyAsk && q.whyTheyAsk.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const togglePracticed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPracticedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyQuestion = (question: InterviewQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `Pergunta: ${question.question}\nCategoria: ${question.category}\nPor que perguntam: ${question.whyTheyAsk || ''}\nDica de resposta: ${question.tips || ''}\nEstrutura sugerida: ${question.idealAnswerFramework || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(question.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = questions.map((q, idx) => 
      `${idx + 1}. [${q.category}] (${q.difficulty || 'Geral'})\nPergunta: ${q.question}\nPor que perguntam: ${q.whyTheyAsk || ''}\nDica: ${q.tips || ''}\n`
    ).join('\n---\n\n');

    navigator.clipboard.writeText(`Roteiro de Perguntas de Entrevista - ${targetRole} @ ${targetCompany}\n\n${allText}`);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const handleGenerateMore = async () => {
    setIsGeneratingMore(true);
    try {
      const newQuestions = await generateMoreInterviewQuestions(
        targetRole,
        targetCompany,
        jobDescription,
        selectedCategory !== 'Todas' ? selectedCategory : undefined
      );

      const merged = [...questions, ...newQuestions];
      // Remover duplicatas de pergunta
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.question === v.question) === i);
      setQuestions(unique);
      if (onUpdateQuestions) {
        onUpdateQuestions(unique);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleEvaluateAnswer = async (question: InterviewQuestion) => {
    const answerText = practiceAnswers[question.id];
    if (!answerText || answerText.trim().length < 15) {
      alert("Por favor, elabore um pouco mais sua resposta (pelo menos 2 frases) antes de pedir a avaliação da IA.");
      return;
    }

    setIsEvaluating(prev => ({ ...prev, [question.id]: true }));
    try {
      const result = await evaluateInterviewAnswer(
        question.question,
        answerText,
        targetRole,
        targetCompany
      );
      setEvaluations(prev => ({ ...prev, [question.id]: result }));
      // Marca automaticamente como praticada se nota >= 70
      if (result.score >= 70) {
        setPracticedIds(prev => new Set(prev).add(question.id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'técnica':
      case 'tecnica':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'comportamental':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'situacional':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'cultura & fit':
      case 'cultura':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'para o entrevistador':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'básico':
      case 'basico':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Básico</span>;
      case 'intermediário':
      case 'intermediario':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Intermediário</span>;
      case 'avançado':
      case 'avancado':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">Avançado</span>;
      case 'estratégico':
      case 'estrategico':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium font-semibold">Estratégico</span>;
      default:
        return null;
    }
  };

  const progressPercent = questions.length > 0 
    ? Math.round((practicedIds.size / questions.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header com contexto do Cargo e Métricas */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Guia Tático de Entrevista
              </span>
              <span className="text-xs text-slate-400">
                {questions.length} perguntas mapeadas
              </span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Perguntas Prováveis para {targetRole}
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Questões personalizadas para o cargo de <strong className="text-white font-semibold">{targetRole}</strong> na <strong className="text-white font-semibold">{targetCompany}</strong>. Treine suas respostas, entenda a expectativa do recrutador e destaque-se.
            </p>
          </div>

          {/* Card de Progresso do Candidato */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[220px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-300">Progresso do Treino</span>
              <span className="text-xs font-bold text-indigo-300">{practicedIds.size} de {questions.length}</span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden mb-3">
              <div 
                className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{progressPercent}% Preparado</span>
              {progressPercent === 100 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Pronto!
                </span>
              ) : (
                <span className="text-slate-400">Marque ao praticar</span>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Dica do Método STAR */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => setShowStarGuide(!showStarGuide)}
            className="flex items-center gap-1.5 text-indigo-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showStarGuide ? 'Ocultar Guia do Método STAR' : 'Como responder no Método STAR (S-T-A-R)?'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
              title="Copiar todas as perguntas para suas anotações"
            >
              {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {allCopied ? 'Perguntas Copiadas!' : 'Copiar Todas'}
            </button>

            <button
              onClick={handleGenerateMore}
              disabled={isGeneratingMore}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingMore ? 'animate-spin' : ''}`} />
              {isGeneratingMore ? 'Gerando Perguntas...' : 'Gerar Mais com IA'}
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Chamada para Simulação Interativa com Voz e Cronômetro */}
      {onStartSimulation && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-5 text-white shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-indigo-300 shrink-0">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-base">Modo Simulação Completa com IA</h4>
                <span className="text-[10px] font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Interativo
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                Pratique respondendo por voz ou texto, com cronômetro real, auditoria STAR detalhada e nota instantânea de 0 a 100.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartSimulation}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-indigo-950 font-bold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-indigo-950" />
            Iniciar Simulação de Entrevista
          </button>
        </div>
      )}

      {/* Guia Rápido STAR (Colapsável) */}
      {showStarGuide && (
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 text-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm">Estrutura de Resposta de Alto Impacto: Método STAR</h4>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">Recomendado por Recrutadores Globais</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Utilize este roteiro mental de 4 passos para estruturar qualquer resposta comportamental ou de resolução de problemas:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="font-bold text-indigo-700 mb-1">S - Situação</div>
                  <p className="text-slate-600">Contexto claro e objetivo. Qual era o cenário, empresa, desafio ou problema inicial?</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="font-bold text-indigo-700 mb-1">T - Tarefa</div>
                  <p className="text-slate-600">Qual era a sua meta e responsabilidade individual direta naquela ocasião?</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="font-bold text-indigo-700 mb-1">A - Ação</div>
                  <p className="text-slate-600">O que você fez passo a passo? Quais ferramentas, decisões ou técnicas você utilizou?</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="font-bold text-indigo-700 mb-1">R - Resultado</div>
                  <p className="text-slate-600">O desfecho mensurável: métricas (ex: +30% eficiência), aprendizados e impacto no negócio.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Categorias Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const count = cat === 'Todas' 
              ? questions.length 
              : questions.filter(q => q.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5
                  ${isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                {cat}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas perguntas..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Lista de Perguntas */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Nenhuma pergunta encontrada com este filtro</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tente selecionar outra categoria ou limpe o termo de busca para visualizar as sugestões.
            </p>
            <button
              onClick={() => { setSelectedCategory('Todas'); setSearchQuery(''); }}
              className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Mostrar todas as perguntas
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isExpanded = expandedId === q.id;
            const isPracticed = practicedIds.has(q.id);
            const isSimulating = activeSimulatorId === q.id;
            const evaluation = evaluations[q.id];
            const isEvaluatingThis = isEvaluating[q.id];

            return (
              <div 
                key={q.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden
                  ${isPracticed 
                    ? 'border-emerald-200 shadow-sm bg-emerald-50/10' 
                    : isExpanded 
                      ? 'border-indigo-300 shadow-md ring-1 ring-indigo-50' 
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
              >
                {/* Header do Card */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer select-none"
                >
                  {/* Botão de Checkbox Praticado */}
                  <button
                    type="button"
                    onClick={(e) => togglePracticed(q.id, e)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                    title={isPracticed ? "Marcar como não praticada" : "Marcar como praticada"}
                  >
                    {isPracticed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 hover:stroke-indigo-600" />
                    )}
                  </button>

                  {/* Conteúdo Principal da Pergunta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(q.category)}`}>
                        {q.category}
                      </span>
                      {getDifficultyBadge(q.difficulty)}
                      {isPracticed && (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Praticada
                        </span>
                      )}
                      {evaluation && (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Award className="w-3 h-3" /> Nota IA: {evaluation.score}/100
                        </span>
                      )}
                    </div>

                    <h3 className={`text-base font-semibold leading-snug transition-colors ${isPracticed ? 'text-slate-700 line-through decoration-slate-300' : 'text-slate-900'}`}>
                      {q.question}
                    </h3>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyQuestion(q, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Copiar Pergunta e Dicas"
                    >
                      {copiedId === q.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Conteúdo Expandido (Dicas, Objetivo, Estrutura e Treinador) */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      {/* Por que perguntam */}
                      {q.whyTheyAsk && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            <HelpCircle className="w-4 h-4 text-indigo-600" />
                            Objetivo do Recrutador
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {q.whyTheyAsk}
                          </p>
                        </div>
                      )}

                      {/* Dica de Resposta */}
                      {q.tips && (
                        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            Dica de Ouro de Resposta
                          </div>
                          <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                            {q.tips}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Estrutura / Roteiro Sugerido */}
                    {q.idealAnswerFramework && (
                      <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Roteiro / Estrutura Recomendada
                        </div>
                        <p className="text-xs text-indigo-950 leading-relaxed font-mono">
                          {q.idealAnswerFramework}
                        </p>
                      </div>
                    )}

                    {/* Simulador Interativo de Resposta do Candidato */}
                    <div className="pt-2">
                      {!isSimulating ? (
                        <button
                          type="button"
                          onClick={() => setActiveSimulatorId(q.id)}
                          className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-2 rounded-lg border border-indigo-200 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {practiceAnswers[q.id] ? 'Editar meu rascunho de resposta' : 'Praticar e Simular Resposta para esta pergunta'}
                        </button>
                      ) : (
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              Simulador de Resposta: Escreva como você responderia
                            </label>
                            <button
                              onClick={() => setActiveSimulatorId(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Fechar simulador
                            </button>
                          </div>

                          <textarea
                            value={practiceAnswers[q.id] || ''}
                            onChange={(e) => setPracticeAnswers({ ...practiceAnswers, [q.id]: e.target.value })}
                            placeholder="Exemplo: Na minha experiência recente como [cargo], enfrentei uma situação onde... (Aplique o método STAR)"
                            rows={3}
                            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-slate-400">
                              {(practiceAnswers[q.id] || '').length} caracteres
                            </span>

                            <button
                              type="button"
                              onClick={() => handleEvaluateAnswer(q)}
                              disabled={isEvaluatingThis}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
                            >
                              {isEvaluatingThis ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Avaliando com IA...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Avaliar com IA Coach
                                </>
                              )}
                            </button>
                          </div>

                          {/* Resultado da Avaliação da IA */}
                          {evaluation && (
                            <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-800/90 p-4 rounded-xl space-y-3 text-xs border border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                  <Award className="w-4 h-4 text-indigo-400" />
                                  Diagnóstico do Coach IA
                                </span>
                                <span className={`font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${
                                  evaluation.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' :
                                  evaluation.score >= 60 ? 'bg-amber-950 text-amber-300 border border-amber-700/50' :
                                  'bg-rose-950 text-rose-300 border border-rose-700/50'
                                }`}>
                                  Nota: {evaluation.score}/100
                                </span>
                              </div>

                              <p className="text-slate-300 leading-relaxed font-medium">
                                {evaluation.feedback}
                              </p>

                              {/* Checklist do Método STAR */}
                              {evaluation.starFeedback && (
                                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
                                  <span className="text-indigo-300 font-bold uppercase tracking-wider text-[10px] block mb-1">
                                    Auditoria do Método STAR
                                  </span>
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className={`p-1.5 rounded flex items-center gap-1.5 ${evaluation.starFeedback.situation.present ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-400 bg-slate-800/40'}`}>
                                      {evaluation.starFeedback.situation.present ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                      <span><strong>S:</strong> {evaluation.starFeedback.situation.comment || 'Situação'}</span>
                                    </div>
                                    <div className={`p-1.5 rounded flex items-center gap-1.5 ${evaluation.starFeedback.task.present ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-400 bg-slate-800/40'}`}>
                                      {evaluation.starFeedback.task.present ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                      <span><strong>T:</strong> {evaluation.starFeedback.task.comment || 'Tarefa'}</span>
                                    </div>
                                    <div className={`p-1.5 rounded flex items-center gap-1.5 ${evaluation.starFeedback.action.present ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-400 bg-slate-800/40'}`}>
                                      {evaluation.starFeedback.action.present ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                      <span><strong>A:</strong> {evaluation.starFeedback.action.comment || 'Ação'}</span>
                                    </div>
                                    <div className={`p-1.5 rounded flex items-center gap-1.5 ${evaluation.starFeedback.result.present ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-400 bg-slate-800/40'}`}>
                                      {evaluation.starFeedback.result.present ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                      <span><strong>R:</strong> {evaluation.starFeedback.result.comment || 'Resultado'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {evaluation.strengths && evaluation.strengths.length > 0 && (
                                  <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/30">
                                    <span className="text-emerald-400 font-bold block mb-1">Pontos Fortes:</span>
                                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                      {evaluation.strengths.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {evaluation.improvements && evaluation.improvements.length > 0 && (
                                  <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/30">
                                    <span className="text-amber-400 font-bold block mb-1">Como Elevar a Resposta:</span>
                                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                      {evaluation.improvements.map((imp, idx) => (
                                        <li key={idx}>{imp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {evaluation.suggestedAnswer && (
                                <div className="bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/40 mt-2">
                                  <span className="text-indigo-300 font-bold block mb-1">Exemplo de Resposta Modelo (Benchmark):</span>
                                  <p className="text-slate-300 italic leading-relaxed">
                                    "{evaluation.suggestedAnswer}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
