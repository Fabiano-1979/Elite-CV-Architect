import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Lightbulb, 
  Sparkles, 
  Compass, 
  TrendingUp, 
  Zap, 
  HelpCircle, 
  AlertOctagon, 
  DollarSign, 
  Copy, 
  Check, 
  RefreshCw, 
  Target, 
  ArrowRight, 
  CheckCircle2,
  Award,
  ChevronRight,
  Share2,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { ExpertCareerAdvice, ExpertCareerTipCategory } from '../types';
import { getExpertCareerAdvice } from '../services/geminiService';

interface ExpertCareerTipsProps {
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  currentCvText?: string;
  initialAdvice?: ExpertCareerAdvice;
}

export const ExpertCareerTips: React.FC<ExpertCareerTipsProps> = ({
  targetRole,
  targetCompany,
  jobDescription,
  currentCvText,
  initialAdvice
}) => {
  const [advice, setAdvice] = useState<ExpertCareerAdvice | null>(initialAdvice || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('positioning');
  const [isLoading, setIsLoading] = useState<boolean>(!initialAdvice);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Carrega orientações se não fornecidas inicialmente ou quando o cargo muda
  useEffect(() => {
    if (!initialAdvice && targetRole) {
      loadAdvice();
    }
  }, [targetRole, targetCompany]);

  const loadAdvice = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await getExpertCareerAdvice(
        targetRole || "Profissional",
        targetCompany || "Empresa Alvo",
        jobDescription,
        currentCvText
      );
      setAdvice(data);
      if (data.categories && data.categories.length > 0) {
        setSelectedCategoryId(data.categories[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar Dica do Especialista:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'positioning':
        return <Compass className="w-4 h-4" />;
      case 'skills_trends':
        return <TrendingUp className="w-4 h-4" />;
      case 'power_words':
        return <Zap className="w-4 h-4" />;
      case 'interview_questions':
        return <HelpCircle className="w-4 h-4" />;
      case 'pitfalls':
        return <AlertOctagon className="w-4 h-4" />;
      case 'salary_negotiation':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (isLoading && !advice) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Consultando Especialista em Carreira...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Mapeando tendências, vocabulário estratégico e recomendações de posicionamento para <strong>{targetRole}</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (!advice) return null;

  const currentCategory = advice.categories.find(c => c.id === selectedCategoryId) || advice.categories[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Top Banner de Apresentação com Identidade de Especialista */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 relative overflow-hidden">
        {/* Efeito decorativo de fundo */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                Dica do Especialista
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {advice.targetRole}
              </span>
              {advice.targetCompany && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  @{advice.targetCompany}
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Guia Estratégico de Posicionamento para {advice.targetRole}
            </h2>
            
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {advice.executiveSummary}
            </p>
          </div>

          {/* Botão de Regenerar / Atualizar Análise */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAdvice(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/15 shadow-sm disabled:opacity-50"
              title="Solicitar nova análise contextualizada ao Gemini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analisando...' : 'Atualizar com IA'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const text = `DICAS DE CARREIRA - ${advice.targetRole} na ${advice.targetCompany}\n\n` +
                  `REGRA DE OURO:\n${advice.goldenRule}\n\n` +
                  `PALAVRAS DE PODER:\n${advice.powerKeywords.join(', ')}\n\n` +
                  `PERGUNTAS RECOMENDADAS PARA FAZER AO ENTREVISTADOR:\n${advice.mustAskInterviewQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}`;
                copyToClipboard(text, 'all');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
              title="Copiar todas as orientações"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Guia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card Destaque: Regra de Ouro do Headhunter */}
        <div className="mt-5 p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-400/30 flex items-start gap-3 text-xs md:text-sm">
          <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-300 block mb-0.5">
              Regra de Ouro do Especialista para este Cargo
            </span>
            <p className="text-slate-100 font-medium leading-relaxed">
              "{advice.goldenRule}"
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Categorias de Orientações */}
      <div className="p-3 md:p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0 hidden md:inline">
            Tópicos:
          </span>
          {advice.categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80 hover:text-slate-900'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.tips.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Categoria Selecionada */}
      <div className="p-5 md:p-6 space-y-6">
        {/* Cabeçalho da Categoria com Resumo */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                {getCategoryIcon(currentCategory.id)}
              </span>
              {currentCategory.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {currentCategory.summary}
            </p>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
            {currentCategory.tips.length} orientações práticas
          </span>
        </div>

        {/* Grid de Dicas Práticas da Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCategory.tips.map((tip, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{tip.title}</span>
                  </h4>
                  {tip.tag && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                      {tip.tag}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {tip.description}
                </p>
              </div>

              {tip.actionableStep && (
                <div className="pt-2.5 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 p-3 rounded-b-xl flex items-start gap-2 text-[11px]">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-slate-700">
                    <strong className="text-indigo-900 font-semibold">Como aplicar: </strong>
                    <span>{tip.actionableStep}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Módulo Especial: Palavras de Poder & Vocabulário Magnético */}
        {advice.powerKeywords && advice.powerKeywords.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100 rounded-2xl p-4 md:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Termos de Alto Impacto para {advice.targetRole}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Clique em qualquer palavra para copiar e usar no seu currículo ou na entrevista:
                  </p>
                </div>
              </div>

              {copiedKeyword && (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto animate-fade-in">
                  "{copiedKeyword}" copiado!
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {advice.powerKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyKeyword(kw)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
                  title="Clique para copiar"
                >
                  <span>{kw}</span>
                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Módulo Especial: Perguntas Estratégicas para o Candidato Fazer ao Entrevistador */}
        {advice.mustAskInterviewQuestions && advice.mustAskInterviewQuestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Perguntas de Alto Calibre para Fazer no Final da Entrevista
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Demonstre maturidade sênior e visão de dono quando perguntarem: <em>"Você tem alguma dúvida para nós?"</em>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {advice.mustAskInterviewQuestions.map((question, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-200 hover:bg-white transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="font-semibold text-slate-800 leading-snug">
                      "{question}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(question, `q-${idx}`)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Copiar pergunta"
                  >
                    {copiedSection === `q-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Informativo */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            Orientações calibradas pelo especialista com foco nas melhores práticas de contratação para <strong>{advice.targetRole}</strong>.
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">
          IA Gemini 2.5 Coaching
        </span>
      </div>
    </div>
  );
};
