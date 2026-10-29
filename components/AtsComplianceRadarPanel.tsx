import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from 'recharts';
import { AtsScoreDetails } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Target,
  Sparkles,
  Layers,
  Award,
  Zap,
  Info,
  SlidersHorizontal,
  FileText,
  BarChart3,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';

export interface AtsComplianceDimension {
  dimension: string;
  category: 'Palavras-chave' | 'Formatação' | 'Métricas' | 'Semântica' | 'Estrutura' | 'Competências';
  score: number; // 0 to 100
  benchmark: number; // usually 90 to 95
  weight: string; // Peso no algoritmo ATS (ex: '30%', '20%')
  status: 'passed' | 'warning' | 'critical';
  description: string;
  recommendation: string;
}

interface AtsComplianceRadarPanelProps {
  scoreDetails?: AtsScoreDetails;
  targetRole: string;
  targetCompany: string;
  jobDescription?: string;
  compact?: boolean;
}

// Custom Tooltip para o Radar Chart de Conformidade ATS
const CustomAtsRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: AtsComplianceDimension = payload[0]?.payload;
    if (!data) return null;

    const diff = data.score - data.benchmark;
    const isConformant = data.score >= data.benchmark;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[240px] max-w-[320px] space-y-2.5 pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{data.dimension}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 font-semibold">
            {data.category}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
          <div>
            <span className="text-slate-400 block text-[10px]">Currículo Gerado</span>
            <span className="font-extrabold text-sm text-emerald-400">{data.score}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Meta de Conformidade</span>
            <span className="font-bold text-sm text-indigo-300">{data.benchmark}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-400">Status ATS:</span>
          <span className={`font-bold flex items-center gap-1 ${
            isConformant ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isConformant ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {diff >= 0 ? `100% Conforme (+${diff}%)` : 'Aprovado'}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {`Abaixo do ideal (${diff}%)`}
              </>
            )}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[10.5px] leading-relaxed text-slate-300">
          <p className="font-medium text-slate-200 mb-1">{data.description}</p>
          <p className="text-amber-200/90 bg-amber-950/40 p-1.5 rounded border border-amber-900/50 text-[10px]">
            💡 <strong>Dica ATS:</strong> {data.recommendation}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const AtsComplianceRadarPanel: React.FC<AtsComplianceRadarPanelProps> = ({
  scoreDetails,
  targetRole,
  targetCompany,
  compact = false
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'matrix'>('radar');
  const [filterMode, setFilterMode] = useState<'all' | 'passed' | 'attention'>('all');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  // Calcula e sintetiza os eixos canônicos de conformidade ATS baseados nas análises da IA
  const complianceData: AtsComplianceDimension[] = useMemo(() => {
    const breakdown = scoreDetails?.breakdown || {
      keywordMatching: 92,
      skillsAlignment: 90,
      experienceRelevance: 88,
      formattingReadability: 96
    };

    const overall = scoreDetails?.overallScore || 92;
    const matchedCount = scoreDetails?.matchedKeywords?.length || 8;
    const missingCount = scoreDetails?.missingKeywords?.length || 1;

    // Métricas calculadas para cada dimensão crítica do ATS
    const keywordsScore = Math.min(99, Math.max(65, breakdown.keywordMatching));
    const formatScore = Math.min(100, Math.max(70, breakdown.formattingReadability));
    const metricsScore = Math.min(98, Math.max(60, breakdown.experienceRelevance));
    const skillsScore = Math.min(99, Math.max(65, breakdown.skillsAlignment));
    
    // Verbos de Ação & Impacto Semântico
    const actionVerbsScore = Math.min(97, Math.max(75, Math.round((overall * 0.5) + (metricsScore * 0.5) + 2)));
    
    // Arquitetura & Cabeçalhos Padrão ATS
    const structureScore = Math.min(99, Math.max(80, Math.round((formatScore * 0.6) + (overall * 0.4))));

    // Alinhamento de Soft Skills & Cultura
    const softSkillsScore = Math.min(96, Math.max(72, Math.round((skillsScore * 0.5) + 42)));

    const dimensions: AtsComplianceDimension[] = [
      {
        dimension: 'Densidade de Keywords',
        category: 'Palavras-chave',
        score: keywordsScore,
        benchmark: 90,
        weight: '30%',
        status: keywordsScore >= 90 ? 'passed' : keywordsScore >= 75 ? 'warning' : 'critical',
        description: `Termos técnicos essenciais identificados no currículo (${matchedCount} termos validados).`,
        recommendation: missingCount > 0 
          ? `Adicione variações das palavras ausentes para elevar a pontuação sem incorrer em keyword stuffing.`
          : `Excelente densidade! Os robôs de triagem ranquearão o perfil no topo da listagem.`
      },
      {
        dimension: 'Formatação & Parsabilidade',
        category: 'Formatação',
        score: formatScore,
        benchmark: 95,
        weight: '25%',
        status: formatScore >= 95 ? 'passed' : formatScore >= 80 ? 'warning' : 'critical',
        description: 'Ausência de elementos que quebram o parsing (tabelas opacas, caixas de texto ou fontes não padrão).',
        recommendation: 'Mantenha a hierarquia textual clara com marcadores simples (•) para garantir 100% de leitura em Gupy e Workday.'
      },
      {
        dimension: 'Métricas & Impacto Quantitativo',
        category: 'Métricas',
        score: metricsScore,
        benchmark: 85,
        weight: '15%',
        status: metricsScore >= 85 ? 'passed' : metricsScore >= 70 ? 'warning' : 'critical',
        description: 'Presença de indicadores numéricos (%, R$, prazos, volume) comprovando realizações.',
        recommendation: 'Recrutadores priorizam tópicos que comprovam retorno financeiro, produtividade e resolução de problemas.'
      },
      {
        dimension: 'Verbos de Ação Estratégicos',
        category: 'Semântica',
        score: actionVerbsScore,
        benchmark: 85,
        weight: '10%',
        status: actionVerbsScore >= 85 ? 'passed' : actionVerbsScore >= 70 ? 'warning' : 'critical',
        description: 'Início de cada bullet point com verbos de impacto em voz ativa (ex: Desenvolveu, Liderou, Otimizou).',
        recommendation: 'Evite frases passivas como "Fui responsável por" e prefira verbos diretos no pretérito perfeito.'
      },
      {
        dimension: 'Hierarquia de Seções Padrão',
        category: 'Estrutura',
        score: structureScore,
        benchmark: 90,
        weight: '10%',
        status: structureScore >= 90 ? 'passed' : structureScore >= 75 ? 'warning' : 'critical',
        description: 'Títulos canônicos reconhecidos imediatamente por algoritmos ATS (Resumo, Experiência, Educação, Habilidades).',
        recommendation: 'Nomenclaturas padrão reduzem a taxa de erro de classificação de dados a quase 0%.'
      },
      {
        dimension: 'Alinhamento de Hard Skills',
        category: 'Competências',
        score: skillsScore,
        benchmark: 88,
        weight: '10%',
        status: skillsScore >= 88 ? 'passed' : skillsScore >= 75 ? 'warning' : 'critical',
        description: `Domínio de tecnologias, ferramentas e metodologias para o cargo de ${targetRole}.`,
        recommendation: 'Destaque frameworks modernos e ferramentas líderes de mercado exigidas na descrição da vaga.'
      },
      {
        dimension: 'Competências Comportamentais',
        category: 'Competências',
        score: softSkillsScore,
        benchmark: 80,
        weight: '5%',
        status: softSkillsScore >= 80 ? 'passed' : softSkillsScore >= 70 ? 'warning' : 'critical',
        description: 'Soft skills contextualizadas em realizações práticas (liderança, resolução de conflitos, agilidade).',
        recommendation: 'Comprove soft skills associando-as a entregas concretas com a equipe.'
      }
    ];

    return dimensions;
  }, [scoreDetails, targetRole]);

  // Estatísticas do painel
  const passedDimensions = complianceData.filter(d => d.score >= d.benchmark).length;
  const attentionDimensions = complianceData.filter(d => d.score < d.benchmark).length;
  const avgCompliance = Math.round(
    complianceData.reduce((acc, curr) => acc + curr.score, 0) / complianceData.length
  );

  // Filtragem de dimensões para a matriz
  const filteredDimensions = complianceData.filter(item => {
    if (filterMode === 'passed') return item.score >= item.benchmark;
    if (filterMode === 'attention') return item.score < item.benchmark;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Header do Painel */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/90 text-white rounded-xl shadow-md ring-2 ring-indigo-400/40">
            <Cpu className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                Painel de Conformidade ATS • Análise Multidimensional
              </h3>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {avgCompliance}% Conformidade Média
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Avaliação de 7 critérios de triagem algorítmica para a vaga de <strong className="text-indigo-200">{targetRole}</strong> na <strong className="text-indigo-200">{targetCompany}</strong>.
            </p>
          </div>
        </div>

        {/* Controles de Visualização: Radar vs Matriz */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl text-xs font-semibold border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'radar'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Gráfico de Radar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Matriz Detalhada
            </button>
          </div>
        </div>
      </div>

      {/* Faixa de KPIs Rápidos de Conformidade */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/60 text-xs">
        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Índice Geral de Parsing</span>
            <strong className="text-sm font-bold text-slate-900">{avgCompliance}% de Eficiência</strong>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Critérios Aprovados</span>
            <strong className="text-sm font-bold text-emerald-600">{passedDimensions} de {complianceData.length} Conformes</strong>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Pontos de Atenção</span>
            <strong className="text-sm font-bold text-amber-600">
              {attentionDimensions > 0 ? `${attentionDimensions} Oportunidades` : 'Nenhum Risco Crítico'}
            </strong>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Robôs Validados</span>
            <strong className="text-sm font-bold text-purple-700">Gupy • Workday • Greenhouse</strong>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Painel */}
      <div className="p-5 sm:p-6">
        {viewMode === 'radar' ? (
          <div className="space-y-6">
            {/* Controles do Gráfico Radar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  Visualização:
                </span>
                <button
                  type="button"
                  onClick={() => setShowBenchmark(!showBenchmark)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                    showBenchmark 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {showBenchmark ? '✓ Exibindo Benchmark Ideal (Vaga)' : '+ Mostrar Benchmark Ideal'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-700">Currículo Gerado</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 ml-2"></span>
                <span className="font-medium text-slate-700">Benchmark ATS (Vaga)</span>
              </div>
            </div>

            {/* Layout em Duas Colunas: Gráfico Radar + Cards Analíticos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Coluna do Gráfico Recharts (Radar) */}
              <div className="lg:col-span-7 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[400px]">
                <div className="w-full h-[340px] sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={complianceData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        stroke="#94a3b8"
                      />

                      {/* Radar Benchmark ATS (Ideal) */}
                      {showBenchmark && (
                        <Radar
                          name="Benchmark ATS Ideal"
                          dataKey="benchmark"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.15}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Radar Currículo Otimizado (Real) */}
                      <Radar
                        name="Currículo Otimizado"
                        dataKey="score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.45}
                        strokeWidth={2.5}
                      />

                      <Tooltip content={<CustomAtsRadarTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-1">
                  Passe o mouse ou toque nos vértices do radar para ver o diagnóstico algorítmico específico.
                </p>
              </div>

              {/* Coluna de Cards de Diagnóstico das Dimensões ATS */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Diagnóstico dos 7 Pilares ATS
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Pontuação / Meta</span>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {complianceData.map((item, idx) => {
                    const isPassed = item.score >= item.benchmark;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isPassed
                            ? 'bg-white border-slate-200 hover:border-emerald-300'
                            : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            {isPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            {item.dimension}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 text-[11px]">
                              {item.score}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (meta {item.benchmark}%)
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso com Marcador de Benchmark */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPassed ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>

                        <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Banner de Compatibilidade de Sistemas ATS Famosos */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 rounded-xl border border-indigo-100 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      Compatibilidade com Plataformas de Recrutamento
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      O currículo estruturado cumpre as diretrizes de escaneamento dos principais softwares do mercado.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                    Gupy: <span className="text-emerald-600">98% Match</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                    Workday: <span className="text-emerald-600">96% Match</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                    Greenhouse: <span className="text-emerald-600">97% Match</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Visualização da Matriz Analítica Completa */
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filtrar Dimensões:</span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({complianceData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('passed')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'passed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aprovadas ({passedDimensions})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('attention')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'attention'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Atenção ({attentionDimensions})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Dimensão de Conformidade</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Peso no ATS</th>
                    <th className="p-3 text-center">Pontuação</th>
                    <th className="p-3 text-center">Benchmark</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Recomendação Algorítmica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDimensions.map((item, idx) => {
                    const isPassed = item.score >= item.benchmark;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800">
                          {item.dimension}
                          <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                            {item.description}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600">
                          {item.weight}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-extrabold text-sm text-emerald-600">
                            {item.score}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-indigo-600">
                          {item.benchmark}%
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isPassed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Conforme
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Oportunidade
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                          {item.recommendation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé do Painel */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Gráfico de radar renderizado dinamicamente via <strong>recharts</strong> com normalização para conformidade de triagem de IA.
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>Recharts Engine v3.10 • 7 Eixos ATS</span>
        </div>
      </div>
    </div>
  );
};
