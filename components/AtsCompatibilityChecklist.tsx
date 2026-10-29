import React, { useState, useMemo, useEffect } from 'react';
import { 
  AtsCheckItem, 
  AtsChecklistReport, 
  AtsCheckStatus, 
  AtsCheckCategory,
  AtsScoreDetails 
} from '../types';
import { 
  generateLocalAtsChecklist, 
  auditAtsChecklistWithGemini 
} from '../services/atsAuditService';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  Info, 
  FileText, 
  Cpu, 
  Target, 
  Zap, 
  Layers, 
  LayoutList,
  AlertCircle
} from 'lucide-react';

interface AtsCompatibilityChecklistProps {
  currentCvText: string;
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  atsScore?: AtsScoreDetails;
  onGoToEditor?: () => void;
}

export const AtsCompatibilityChecklist: React.FC<AtsCompatibilityChecklistProps> = ({
  currentCvText,
  targetRole,
  targetCompany,
  jobDescription,
  atsScore,
  onGoToEditor
}) => {
  // Estado do relatório de auditoria
  const [report, setReport] = useState<AtsChecklistReport>(() => 
    generateLocalAtsChecklist(currentCvText, targetRole, targetCompany, jobDescription, atsScore)
  );
  const [isAuditingWithAI, setIsAuditingWithAI] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('Gupy');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues' | 'passed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Atualiza automaticamente a auditoria local quando o texto do currículo ou score mudar
  useEffect(() => {
    const updated = generateLocalAtsChecklist(
      currentCvText,
      targetRole,
      targetCompany,
      jobDescription,
      atsScore
    );
    setReport(updated);
  }, [currentCvText, targetRole, targetCompany, jobDescription, atsScore]);

  // Auditoria profunda com Gemini 3.8 Flash
  const handleRunAiAudit = async () => {
    setIsAuditingWithAI(true);
    try {
      const aiReport = await auditAtsChecklistWithGemini(
        currentCvText,
        targetRole,
        targetCompany,
        jobDescription
      );
      setReport(aiReport);
    } catch (err) {
      console.error("Erro na auditoria profunda ATS:", err);
    } finally {
      setIsAuditingWithAI(false);
    }
  };

  const handleCopyExample = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedItemId(prev => (prev === id ? null : id));
  };

  // Filtragem dos itens do checklist
  const filteredItems = useMemo(() => {
    return report.items.filter(item => {
      // Filtro de status
      if (statusFilter === 'issues') {
        if (item.status === 'passed') return false;
      } else if (statusFilter === 'passed') {
        if (item.status !== 'passed') return false;
      }

      // Filtro de categoria
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesDetail = item.detail.toLowerCase().includes(query);
        const matchesRec = item.recommendation.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesDetail && !matchesRec) {
          return false;
        }
      }

      return true;
    });
  }, [report.items, statusFilter, categoryFilter, searchQuery]);

  // Cores dinâmicas para o score geral de conformidade
  const getScoreTheme = (score: number) => {
    if (score >= 90) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        progressBar: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        headline: 'Altíssima Prontidão ATS',
        summary: 'Seu currículo tem conformidade técnica excepcional para passar nos filtros da Gupy, Workday e Greenhouse sem retenção.'
      };
    }
    if (score >= 75) {
      return {
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        progressBar: 'bg-indigo-600',
        textColor: 'text-indigo-700',
        headline: 'Boa Conformidade com Oportunidades',
        summary: 'O currículo possui boa estrutura, mas alguns ajustes de palavras-chave e métricas podem elevar significativamente sua nota de triagem.'
      };
    }
    return {
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      progressBar: 'bg-amber-500',
      textColor: 'text-amber-800',
      headline: 'Atenção aos Filtros de Descarte',
      summary: 'Existem pontos críticos identificados que podem provocar descarte automático em plataformas como Workday e Gupy. Recomendamos aplicar as correções abaixo.'
    };
  };

  const theme = getScoreTheme(report.overallScore);
  const activeSystemData = report.systemCompatibilities.find(s => s.system === selectedSystem) || report.systemCompatibilities[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in-up space-y-6">
      
      {/* 1. Header Hero com Métricas Gerais de Auditoria */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Auditoria de Triagem Automatizada
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300">
                Alvo: <strong className="text-white ml-1">{targetRole}</strong> na {targetCompany}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Checklist de Compatibilidade ATS</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* Medidor de Conformidade do Checklist e Ações */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-end justify-between w-full lg:w-auto gap-4 shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-center sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Conformidade com Filtros ATS
              </span>
              <div className="flex items-baseline justify-center sm:justify-end gap-1.5">
                <span className="text-4xl font-black text-white tracking-tight">
                  {report.overallScore}%
                </span>
                <span className="text-xs text-indigo-300 font-semibold">
                  ({report.passedCount}/{report.totalChecks} aprovados)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={isAuditingWithAI}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 transition-all shadow-md disabled:opacity-60"
              title="Executar auditoria detalhada via IA contextual com Gemini"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAuditingWithAI ? 'animate-spin' : ''}`} />
              <span>{isAuditingWithAI ? 'Auditando com IA...' : 'Auditoria Profunda com IA'}</span>
            </button>
          </div>

        </div>

        {/* Resumo Rápido dos Indicadores (Passou, Alerta, Crítico) */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'passed' ? 'all' : 'passed')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'passed'
                ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aprovados
              </span>
              <span className="text-lg font-black text-emerald-400">{report.passedCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Critérios 100% conformes</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'issues' ? 'all' : 'issues')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'issues'
                ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Atenção / Alertas
              </span>
              <span className="text-lg font-black text-amber-400">{report.warningCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Oportunidades de ganho</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'issues' ? 'all' : 'issues')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'issues' && report.criticalCount > 0
                ? 'bg-rose-500/20 border-rose-400 text-white ring-2 ring-rose-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400" /> Pontos Críticos
              </span>
              <span className="text-lg font-black text-rose-400">{report.criticalCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Risco de descarte</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* 2. Compatibilidade Específica por Plataforma ATS (Gupy, Workday, Greenhouse, Taleo, Kenoby) */}
        <section className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Compatibilidade com Principais Plataformas ATS do Mercado
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada sistema possui regras próprias de ranqueamento e parsing de currículos.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
              Selecione para ver a análise
            </span>
          </div>

          {/* Abas das plataformas */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {report.systemCompatibilities.map((sys) => {
              const isSelected = selectedSystem === sys.system;
              const isPassed = sys.status === 'passed';
              return (
                <button
                  key={sys.system}
                  type="button"
                  onClick={() => setSelectedSystem(sys.system)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{sys.system}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                      sys.compatibilityScore >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sys.compatibilityScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${sys.compatibilityScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${sys.compatibilityScore}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalhe da Plataforma Selecionada */}
          {activeSystemData && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-indigo-950">
                    Comportamento do Robô no {activeSystemData.system}
                  </strong>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    activeSystemData.status === 'passed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {activeSystemData.status === 'passed' ? 'Aderência Alta' : 'Requer Cuidado'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Índice de sucesso estimado: <strong className="text-indigo-600 font-bold">{activeSystemData.compatibilityScore}%</strong>
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Como o parser lê:</strong> {activeSystemData.highlight}
              </p>
              
              <div className="flex items-start gap-2 bg-indigo-50/60 p-2.5 rounded-lg text-xs text-indigo-950 border border-indigo-100">
                <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Dica de Ouro para {activeSystemData.system}: </span>
                  <span>{activeSystemData.advice}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. Ações Imediatas Prioritárias (Top Action Items) */}
        {report.topActionItems && report.topActionItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 p-4 md:p-5 rounded-2xl border border-amber-200/80 space-y-2.5">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-600" />
              Prioridades para Garantir Aprovação
            </h3>
            <div className="space-y-1.5">
              {report.topActionItems.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Barra de Ferramentas: Filtros por Categoria, Status e Busca */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-indigo-600" />
                Auditoria Completa de Critérios ({filteredItems.length} de {report.totalChecks})
              </h3>
              <p className="text-xs text-slate-500">
                Clique em qualquer critério para expandir o diagnóstico, recomendações e exemplos práticos.
              </p>
            </div>

            {onGoToEditor && (
              <button
                type="button"
                onClick={onGoToEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 active:scale-95 self-start md:self-auto"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Editar Currículo no Editor</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar no checklist (ex: métricas, email, tabelas)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Filtro de Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="structure">Estrutura & Seções</option>
              <option value="keywords">Palavras-Chave & Vaga</option>
              <option value="metrics">Métricas & Verbos de Ação</option>
              <option value="formatting">Formatação & Parsers</option>
              <option value="personal_data">Dados Pessoais & Contato</option>
            </select>

            {/* Filtros de Status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({report.totalChecks})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('issues')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === 'issues' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Atenção ({report.warningCount + report.criticalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('passed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === 'passed' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aprovados ({report.passedCount})
              </button>
            </div>
          </div>
        </div>

        {/* 5. Lista de Itens do Checklist */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">Nenhum critério com esse filtro.</p>
              <p className="text-xs text-slate-500 mt-1">Limpe os filtros de busca para ver todos os itens.</p>
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
              >
                Redefinir filtros
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              
              // Ícone e cores do status
              const isPassed = item.status === 'passed';
              const isWarning = item.status === 'warning';
              const isCritical = item.status === 'critical';

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'shadow-md border-indigo-200 ring-1 ring-indigo-500/20' 
                      : 'hover:border-slate-300 hover:shadow-xs'
                  } ${
                    isCritical 
                      ? 'bg-rose-50/30 border-rose-200' 
                      : isWarning 
                        ? 'bg-amber-50/20 border-amber-200/80' 
                        : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Linha Principal do Item */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Ícone de status */}
                      <div className="shrink-0 mt-0.5 sm:mt-0">
                        {isPassed && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isWarning && (
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isCritical && (
                          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Título e Categoria */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {item.categoryLabel}
                          </span>
                          {isCritical && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              Crítico
                            </span>
                          )}
                          {isWarning && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              Requer Ajuste
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Conforme
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label={isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Painel Expandido com Diagnóstico e Exemplos */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-3.5 animate-in fade-in duration-150">
                      
                      {/* Diagnóstico */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Diagnóstico do Algoritmo ATS:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {item.detail}
                        </p>
                      </div>

                      {/* Recomendação de Ação */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-indigo-600" />
                          Como Corrigir / Melhorar:
                        </span>
                        <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-950 leading-relaxed font-medium">
                          {item.recommendation}
                        </div>
                      </div>

                      {/* Exemplos Práticos: Certo vs Errado (se disponível) */}
                      {(item.exampleGood || item.exampleBad) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {item.exampleBad && (
                            <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> Exemplo a Evitar (Descarte ATS)
                              </span>
                              <p className="text-xs text-rose-950 font-mono bg-white/70 p-2 rounded-lg border border-rose-100">
                                {item.exampleBad}
                              </p>
                            </div>
                          )}

                          {item.exampleGood && (
                            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Exemplo Recomendado (Aprovado)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyExample(item.id, item.exampleGood!)}
                                  className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-emerald-200 active:scale-95"
                                  title="Copiar exemplo recomendado"
                                >
                                  {copiedId === item.id ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-600" /> Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-2.5 h-2.5" /> Copiar
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-emerald-950 font-mono bg-white/70 p-2 rounded-lg border border-emerald-100">
                                {item.exampleGood}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Atalho para aplicar no editor */}
                      {onGoToEditor && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={onGoToEditor}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <span>Ir para o editor de currículo</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
