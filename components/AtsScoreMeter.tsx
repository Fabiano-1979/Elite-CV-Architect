import React, { useState } from 'react';
import { AtsScoreDetails } from '../types';
import { recalculateAtsScore } from '../services/geminiService';
import { 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  FileCheck, 
  RefreshCw, 
  TrendingUp, 
  HelpCircle, 
  Award,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  ClipboardCheck
} from 'lucide-react';

interface AtsScoreMeterProps {
  scoreDetails?: AtsScoreDetails;
  currentCvText?: string;
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  onScoreUpdated?: (updatedScore: AtsScoreDetails) => void;
  onOpenChecklist?: () => void;
  compact?: boolean;
}

export const AtsScoreMeter: React.FC<AtsScoreMeterProps> = ({
  scoreDetails: initialScoreDetails,
  currentCvText,
  targetRole,
  targetCompany,
  jobDescription,
  onScoreUpdated,
  onOpenChecklist,
  compact = false
}) => {
  const [details, setDetails] = useState<AtsScoreDetails | undefined>(initialScoreDetails);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(!compact);

  React.useEffect(() => {
    if (initialScoreDetails) {
      setDetails(initialScoreDetails);
    }
  }, [initialScoreDetails]);

  const score = details?.overallScore ?? 90;
  const grade = details?.grade ?? (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C');

  // Determinar cores dinâmicas baseadas no score
  const getScoreTheme = (val: number) => {
    if (val >= 90) {
      return {
        stroke: '#10b981', // emerald-500
        text: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        statusLabel: 'Altíssima Compatibilidade ATS',
        statusDesc: 'Seu currículo tem mais de 90% de aderência e excelente chance de avançar para a entrevista.'
      };
    }
    if (val >= 80) {
      return {
        stroke: '#4f46e5', // indigo-600
        text: 'text-indigo-600',
        bgLight: 'bg-indigo-50',
        border: 'border-indigo-200',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        statusLabel: 'Alta Compatibilidade ATS',
        statusDesc: 'Forte alinhamento com os requisitos essenciais do cargo e da empresa.'
      };
    }
    if (val >= 70) {
      return {
        stroke: '#f59e0b', // amber-500
        text: 'text-amber-600',
        bgLight: 'bg-amber-50',
        border: 'border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        statusLabel: 'Compatibilidade Média',
        statusDesc: 'Bom perfil, mas pode ser fortalecido incluindo mais palavras-chave da vaga.'
      };
    }
    return {
      stroke: '#ef4444', // red-500
      text: 'text-rose-600',
      bgLight: 'bg-rose-50',
      border: 'border-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      statusLabel: 'Atenção aos Requisitos',
      statusDesc: 'Revise as palavras-chave ausentes e alinhe a experiência às exigências da vaga.'
    };
  };

  const theme = getScoreTheme(score);

  // SVG Gauge calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleRecalculate = async () => {
    if (!currentCvText) return;
    setIsRecalculating(true);
    try {
      const updated = await recalculateAtsScore(
        currentCvText,
        targetRole,
        targetCompany,
        jobDescription
      );
      setDetails(updated);
      if (onScoreUpdated) {
        onScoreUpdated(updated);
      }
    } catch (err) {
      console.error("Erro ao recalcular ATS:", err);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${theme.border}`}>
      {/* Top Banner / Card Principal */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Lado Esquerdo: Gauge Circular com animação */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                {/* Círculo de fundo */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#334155"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Círculo de progresso */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={theme.stroke}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Conteúdo central do medidor */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-white">{score}</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>

            {/* Informações da Nota e Classificação */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Score ATS
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 border border-emerald-400/30">
                  Nota {grade}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {theme.statusLabel}
              </h3>
              
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                {details?.summary || theme.statusDesc}
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações e Botão de Recálculo */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenChecklist && (
                <button
                  type="button"
                  onClick={onOpenChecklist}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                  title="Abrir o Checklist Completo de Compatibilidade ATS com 14 critérios de triagem"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Checklist ATS</span>
                </button>
              )}

              {currentCvText && (
                <button
                  type="button"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
                  title="Recalcula a nota com base nas edições feitas no texto do currículo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                  {isRecalculating ? 'Recalculando...' : 'Recalcular'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/10"
            >
              <span>{showDetailedBreakdown ? 'Ocultar Detalhes' : 'Ver Detalhes do Score'}</span>
              {showDetailedBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Detalhes Expandidos: Sub-métricas, Keywords e Dicas */}
      {showDetailedBreakdown && details && (
        <div className="p-5 md:p-6 space-y-6 bg-slate-50/50 animate-in fade-in duration-200">
          
          {/* Grid de 4 Sub-Métricas com Barras de Progresso */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Critérios de Avaliação do Sistema ATS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Métrica 1 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Palavras-Chave</span>
                  <span className="font-bold text-indigo-600">{details.breakdown.keywordMatching}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${details.breakdown.keywordMatching}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Termos da vaga inseridos estrategicamente</p>
              </div>

              {/* Métrica 2 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Habilidades & Stack</span>
                  <span className="font-bold text-emerald-600">{details.breakdown.skillsAlignment}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${details.breakdown.skillsAlignment}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Alinhamento de Hard & Soft Skills</p>
              </div>

              {/* Métrica 3 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Relevância de Experiência</span>
                  <span className="font-bold text-blue-600">{details.breakdown.experienceRelevance}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${details.breakdown.experienceRelevance}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Verbos de ação e métricas mensuráveis</p>
              </div>

              {/* Métrica 4 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Formatação & Leitura ATS</span>
                  <span className="font-bold text-purple-600">{details.breakdown.formattingReadability}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${details.breakdown.formattingReadability}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Sem tabelas complexas ou fontes ilegíveis</p>
              </div>
            </div>
          </div>

          {/* Seção de Palavras-chave Detectadas e Sugeridas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Palavras-chave Detectadas */}
            {details.matchedKeywords && details.matchedKeywords.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Palavras-chave Otimizadas no CV ({details.matchedKeywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {details.matchedKeywords.map((kw, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Palavras-chave Sugeridas / Faltantes */}
            {details.missingKeywords && details.missingKeywords.length > 0 ? (
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Oportunidades de Palavras-chave ({details.missingKeywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {details.missingKeywords.map((kw, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1"
                    >
                      <Info className="w-3 h-3 text-amber-500" />
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Se você possui essas habilidades, certifique-se de adicioná-las no texto antes de enviar.
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Dica de Triagem ATS
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Os sistemas ATS priorizam currículos com estrutura hierárquica clara (Resumo &gt; Habilidades &gt; Experiências com métricas).
                </p>
              </div>
            )}
          </div>

          {/* Dicas Rápidas de Melhoria */}
          {details.improvementSuggestions && details.improvementSuggestions.length > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-900 block font-semibold mb-0.5">Sugestão de Aperfeiçoamento do Especialista:</strong>
                <p className="text-slate-600 leading-relaxed">
                  {details.improvementSuggestions[0]}
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
