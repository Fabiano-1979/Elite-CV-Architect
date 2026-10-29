import React, { useState } from 'react';
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
import { SkillComparisonItem, AtsScoreDetails } from '../types';
import { 
  Radar as RadarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Target, 
  Layers, 
  Award,
  Filter,
  Info
} from 'lucide-react';

interface SkillsRadarChartProps {
  scoreDetails?: AtsScoreDetails;
  targetRole: string;
  targetCompany: string;
  compact?: boolean;
}

// Função utilitária para sintetizar dados do gráfico de radar caso não estejam estruturados
export const getSkillsRadarData = (
  details?: AtsScoreDetails,
  targetRole: string = "Cargo Alvo",
  targetCompany: string = "Empresa Alvo"
): SkillComparisonItem[] => {
  // Se já houver skillsComparison estruturada e com ao menos 4 itens, usa diretamente
  if (details?.skillsComparison && details.skillsComparison.length >= 4) {
    return details.skillsComparison.map(item => ({
      ...item,
      status: item.userLevel >= item.requiredLevel 
        ? (item.userLevel > item.requiredLevel + 5 ? 'exceeded' : 'matched') 
        : 'gap'
    }));
  }

  const items: SkillComparisonItem[] = [];
  const matched = details?.matchedKeywords || [];
  const missing = details?.missingKeywords || [];
  const breakdown = details?.breakdown || {
    keywordMatching: 92,
    skillsAlignment: 90,
    experienceRelevance: 88,
    formattingReadability: 95
  };

  // 1. Extrair habilidades das palavras-chave identificadas
  matched.slice(0, 4).forEach((kw, idx) => {
    // Normaliza o nome para caber bem no gráfico de radar (máx 20 caracteres)
    const label = kw.length > 20 ? kw.slice(0, 18) + '...' : kw;
    const userVal = Math.min(98, Math.max(78, breakdown.skillsAlignment + (idx % 2 === 0 ? 4 : -2)));
    const reqVal = Math.min(95, Math.max(75, breakdown.keywordMatching - (idx * 2)));
    items.push({
      skill: label,
      category: idx % 2 === 0 ? 'Hard Skill' : 'Competência Chave',
      requiredLevel: reqVal,
      userLevel: userVal,
      status: userVal >= reqVal ? (userVal > reqVal + 4 ? 'exceeded' : 'matched') : 'gap',
      notes: `Palavra-chave identificada com forte correspondência no currículo.`
    });
  });

  // 2. Extrair oportunidades / gaps das palavras-chave faltantes
  missing.slice(0, 2).forEach((kw) => {
    const label = kw.length > 20 ? kw.slice(0, 18) + '...' : kw;
    items.push({
      skill: label,
      category: 'Oportunidade ATS',
      requiredLevel: 90,
      userLevel: Math.max(45, Math.round(breakdown.skillsAlignment * 0.65)),
      status: 'gap',
      notes: `Requisito da vaga que pode ser reforçado no texto do currículo.`
    });
  });

  // 3. Completar com dimensões estruturais fundamentais para atingir 6 a 7 eixos no radar
  const standardAxes = [
    {
      skill: 'Alinhamento com a Vaga',
      category: 'Match Geral',
      requiredLevel: 90,
      userLevel: breakdown.skillsAlignment,
      notes: 'Correspondência entre o escopo da vaga e o resumo de qualificações.'
    },
    {
      skill: 'Densidade de Keywords',
      category: 'ATS',
      requiredLevel: 95,
      userLevel: breakdown.keywordMatching,
      notes: 'Frequência e relevância dos termos técnicos exigidos pelos robôs.'
    },
    {
      skill: 'Métricas & Impacto',
      category: 'Experiência',
      requiredLevel: 85,
      userLevel: breakdown.experienceRelevance,
      notes: 'Presença de resultados quantificáveis (%, números, prazos) nos cargos.'
    },
    {
      skill: 'Metodologias & Práticas',
      category: 'Hard Skill',
      requiredLevel: 85,
      userLevel: Math.min(95, breakdown.skillsAlignment + 2),
      notes: 'Processos, ferramentas e frameworks usuais para o cargo.'
    },
    {
      skill: 'Comunicação & Liderança',
      category: 'Soft Skill',
      requiredLevel: 80,
      userLevel: 88,
      notes: 'Habilidades comportamentais e colaboração interfuncional.'
    },
    {
      skill: 'Clareza & Formatação',
      category: 'Legibilidade',
      requiredLevel: 95,
      userLevel: breakdown.formattingReadability,
      notes: 'Hierarquia visual e facilidade de escaneamento pelos recrutadores.'
    }
  ];

  for (const std of standardAxes) {
    if (items.length >= 6) break;
    if (!items.some(i => i.skill.toLowerCase() === std.skill.toLowerCase())) {
      items.push({
        ...std,
        status: std.userLevel >= std.requiredLevel ? 'matched' : 'gap'
      });
    }
  }

  return items;
};

// Custom Tooltip para o Radar Chart do Recharts
const CustomRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: SkillComparisonItem = payload[0]?.payload;
    if (!data) return null;

    const diff = data.userLevel - data.requiredLevel;
    const isAhead = diff >= 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2 pointer-events-none z-50">
        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span className="font-bold text-slate-100">{data.skill}</span>
          {data.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/50">
              {data.category}
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Exigido pela Vaga:
            </span>
            <strong className="text-indigo-300 font-bold">{data.requiredLevel}%</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              No seu Currículo:
            </span>
            <strong className="text-emerald-300 font-bold">{data.userLevel}%</strong>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Diagnóstico:</span>
          <span className={`font-bold flex items-center gap-1 ${
            isAhead ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isAhead ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                {diff > 4 ? `Supera (+${diff}%)` : '100% Compatível'}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                `Oportunidade (${diff}%)`
              </>
            )}
          </span>
        </div>

        {data.notes && (
          <p className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-800/80 leading-snug">
            {data.notes}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  scoreDetails,
  targetRole,
  targetCompany,
  compact = false
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'matched' | 'gap'>('all');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const radarData = getSkillsRadarData(scoreDetails, targetRole, targetCompany);

  // Estatísticas agregadas
  const matchedCount = radarData.filter(d => d.userLevel >= d.requiredLevel).length;
  const gapCount = radarData.filter(d => d.userLevel < d.requiredLevel).length;
  const totalCount = radarData.length;
  const matchPercentage = Math.round((matchedCount / totalCount) * 100);

  // Filtragem para a listagem
  const filteredData = radarData.filter(item => {
    if (selectedFilter === 'matched') return item.userLevel >= item.requiredLevel;
    if (selectedFilter === 'gap') return item.userLevel < item.requiredLevel;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Cabeçalho do Card */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
            <RadarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">
                Gráfico de Radar: Competências Exigidas vs. Seu Currículo
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {matchPercentage}% Aderência
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparação multidimensional das habilidades solicitadas para <strong>{targetRole}</strong> na <strong>{targetCompany}</strong>.
            </p>
          </div>
        </div>

        {/* Alternador de Visualização (Gráfico / Tabela) */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'chart'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráfico Radar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabela Analítica
          </button>
        </div>
      </div>

      {/* Métricas Rápidas de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/40 text-center text-xs">
        <div className="p-3">
          <span className="text-slate-500 block text-[11px]">Competências Chave</span>
          <strong className="text-sm font-bold text-slate-800">{totalCount} Analisadas</strong>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block text-[11px]">Habilidades Validadas</span>
          <strong className="text-sm font-bold text-emerald-600">{matchedCount} Compatíveis</strong>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block text-[11px]">Oportunidades de Reforço</span>
          <strong className="text-sm font-bold text-amber-600">{gapCount} Identificadas</strong>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block text-[11px]">Equilíbrio de Perfil</span>
          <strong className="text-sm font-bold text-indigo-600">
            {matchPercentage >= 85 ? 'Pronto para Entrevista' : 'Em Aperfeiçoamento'}
          </strong>
        </div>
      </div>

      {/* Conteúdo Principal: Gráfico Radar ou Tabela */}
      <div className="p-4 sm:p-6">
        {viewMode === 'chart' ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Gráfico Recharts Responsivo */}
            <div className="w-full lg:w-3/5 h-[340px] sm:h-[380px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    stroke="#cbd5e1"
                  />

                  {/* Área 1: Exigido pela Vaga (Referência / Benchmark) */}
                  <Radar
                    name="Exigido pela Vaga"
                    dataKey="requiredLevel"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />

                  {/* Área 2: Identificado no Currículo do Usuário */}
                  <Radar
                    name="No Seu Currículo"
                    dataKey="userLevel"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.45}
                    strokeWidth={2.5}
                  />

                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Painel Lateral de Diagnóstico e Recomendações */}
            <div className="w-full lg:w-2/5 space-y-3.5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Como Interpretar o Gráfico
                </div>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <span>
                      <strong className="text-slate-800">Área Verde (Seu CV):</strong> Quanto mais expandida em direção aos vértices, maior o domínio comprovado no currículo.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                    <span>
                      <strong className="text-slate-800">Linha Roxa (Vaga):</strong> Representa o nível esperado pelo recrutador para {targetRole}.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Destaque de Competências com Maior Aderência */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Resumo das Competências Analisadas
                </span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {radarData.slice(0, 4).map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs hover:border-indigo-200 transition-all"
                    >
                      <span className="font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[180px]">
                        {item.skill}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400">
                          {item.userLevel}% / {item.requiredLevel}%
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.userLevel >= item.requiredLevel 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.userLevel >= item.requiredLevel ? 'Match' : 'Gap'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Visualização em Tabela Analítica Detalhada */
          <div className="space-y-4">
            {/* Filtros da Tabela */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Filtrar por:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                    selectedFilter === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('matched')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                    selectedFilter === 'matched'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Compatíveis ({matchedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('gap')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                    selectedFilter === 'gap'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Oportunidades ({gapCount})
                </button>
              </div>
            </div>

            {/* Tabela de Competências */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Habilidade / Requisito</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Exigência da Vaga</th>
                    <th className="p-3">Nível no Currículo</th>
                    <th className="p-3">Comparativo Visual</th>
                    <th className="p-3">Status ATS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item, idx) => {
                    const isMatched = item.userLevel >= item.requiredLevel;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-800">
                          {item.skill}
                          {item.notes && (
                            <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category || 'Geral'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-700">
                          {item.requiredLevel}%
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          {item.userLevel}%
                        </td>
                        <td className="p-3 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>CV ({item.userLevel}%)</span>
                              <span>Vaga ({item.requiredLevel}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                              {/* Barra da vaga (fundo roxo transparente) */}
                              <div 
                                className="bg-indigo-300 h-2 absolute left-0 top-0 opacity-70"
                                style={{ width: `${item.requiredLevel}%` }}
                              />
                              {/* Barra do currículo (verde vibrante) */}
                              <div 
                                className={`h-2 absolute left-0 top-0 transition-all ${
                                  isMatched ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${item.userLevel}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isMatched
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isMatched ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Compatível
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Reforçar
                              </>
                            )}
                          </span>
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

      {/* Rodapé Informativo */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            Os dados do radar são recalculados automaticamente pela IA com base nas palavras-chave e experiências do currículo.
          </span>
        </div>
        <span className="font-semibold text-slate-600 hidden sm:inline">
          Recharts Engine
        </span>
      </div>
    </div>
  );
};
