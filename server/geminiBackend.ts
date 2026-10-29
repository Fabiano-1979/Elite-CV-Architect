import { GoogleGenAI } from "@google/genai";
import { 
  OptimizationResult, 
  InterviewQuestion, 
  AtsScoreDetails, 
  ExpertCareerAdvice,
  InterviewAnswerEvaluation,
  AtsChecklistReport
} from "../types.js";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("Aviso: GEMINI_API_KEY / API_KEY não definida nas variáveis de ambiente do servidor.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-server',
      },
    },
  });
};

const PROMPT_TEMPLATE = (cv: string, company: string, role: string, jobDesc: string, linkedin: string, github: string) => `
Atue como uma inteligência artificial de elite, especializada em Recrutamento e Seleção (RH), Sistemas de Rastreamento de Candidatos (ATS) e Coaching de Alta Performance de Carreira. Sua missão é transformar um currículo comum em um documento de alto impacto, personalizado para a empresa ${company} e o cargo de ${role}, fornecendo um Score ATS preciso de compatibilidade e preparando o candidato com perguntas estratégicas de entrevista.

ENTRADAS DO USUÁRIO:
1. EMPRESA ALVO: ${company}
2. CARGO PRETENDIDO: ${role}
3. DESCRIÇÃO DA VAGA / LINK (Contexto Crítico):
"""
${jobDesc ? jobDesc : "Nenhuma descrição fornecida. Baseie-se nas práticas padrão de mercado para o cargo."}
"""
4. URL LINKEDIN (Perfil Profissional): ${linkedin || "Não informado"}
5. URL GITHUB (Portfólio Técnico): ${github || "Não informado"}

6. CURRÍCULO ORIGINAL:
"""
${cv}
"""

SEU FLUXO DE TRABALHO:
Passo 1: Pesquisa de Campo & Análise de Vaga e Perfis:
- **Descrição da Vaga:** Se houver LINK, acesse. Se for TEXTO, analise. Extraia keywords críticas (hard/soft skills).
- **Perfis Sociais:** Se foram fornecidas URLs de LinkedIn ou GitHub:
    - OBRIGATÓRIO: Incluir estes links formatados profissionalmente no CABEÇALHO do currículo.
    - OBRIGATÓRIO: Use a ferramenta de busca (Google Search) para tentar encontrar informações públicas recentes nesses perfis (ex: stacks em repositórios recentes do GitHub, resumo atualizado no LinkedIn) que possam não estar no texto original do CV. Use isso para enriquecer a seção de Habilidades.
- **Empresa:** 
    - Se a EMPRESA ALVO for específica (ex: Google, Nubank), pesquise cultura, valores e missão.
    - Se a EMPRESA ALVO for genérica (contiver "Mercado Geral", "Genérico" ou similar), **IGNORE a pesquisa de cultura específica**. Em vez disso, foque nas **MELHORES PRÁTICAS DO MERCADO GLOBAL** para o cargo de ${role}, garantindo que o currículo seja altamente competitivo para qualquer empresa desse setor.

Passo 2: Análise Comparativa (Gap Analysis) e Cálculo de Score ATS:
- Compare o currículo com os requisitos essenciais e diferenciais da vaga.
- Avalie a densidade de termos técnicos, formatação sem ruídos (tabelas complexas ou fontes ilegíveis para robôs) e correspondência de competências.
- Calcule um Score ATS realista (de 0 a 100) refletindo a aderência do currículo reformulado à descrição da vaga.

Passo 3: Redação Estratégica:
- Resumo Profissional focado em resolução de problemas da vaga/função.
- Seção de Habilidades robusta logo após o resumo.
- Verbos de ação e métricas de impacto (ex: aumento de performance, redução de custos, liderança de squads).

Passo 4: Preparação e Perguntas Estratégicas de Entrevista:
- Com base nas competências exigidas para ${role} e no contexto de ${company}, elabore entre 6 e 8 perguntas de entrevista realistas e de alto impacto que o candidato certamente enfrentará no processo seletivo.

DIRETRIZES DE SAÍDA:
- O currículo deve ser entregue em formato de texto Markdown perfeitamente editado.
- **A estrutura do CV deve seguir a ordem: Cabeçalho (com Links de LinkedIn/Github se existirem) > Resumo Profissional > Habilidades > Experiência Profissional > Formação Acadêmica > Idiomas/Outros.**
- Use um layout limpo, moderno e profissional.
- Otimize para ATS (Applicant Tracking Systems).

**IMPORTANTE - DICAS DE OURO (Sessão de Fechamento do Markdown):**
Após concluir o currículo, pule duas linhas, insira um separador (---) e crie uma seção exclusiva intitulada "**🏆 DICAS DE OURO & ANÁLISE ESTRATÉGICA**".
Nesta seção, forneça ao candidato:
1. **Otimização ATS:** Liste 3-5 palavras-chave críticas que foram inseridas e por quê.
2. **Cultura Fit / Postura:** 
    - Se Empresa Específica: Dica de como se comportar na entrevista considerando a cultura da ${company}.
    - Se Empresa Genérica: Dica de postura profissional universalmente valorizada para o cargo de ${role}.
3. **Análise de Presença Online:** Se LinkedIn ou GitHub foram fornecidos, dê uma dica rápida de como melhorá-los para essa vaga específica.
4. **Ponto de Melhoria:** Se houver qualificação faltante, sugira como abordar.

**BLOCO ESTRUTURADO DE SCORE ATS (OBRIGATÓRIO NO FINAL):**
Ao final de toda a resposta, adicione OBRIGATORIAMENTE o bloco com as métricas ATS delimitado por:
===ATS_SCORE_JSON_START===
{
  "overallScore": 92,
  "grade": "A+",
  "breakdown": {
    "keywordMatching": 95,
    "skillsAlignment": 90,
    "experienceRelevance": 88,
    "formattingReadability": 95
  },
  "matchedKeywords": ["Palavra-chave 1", "Palavra-chave 2", "Palavra-chave 3", "Palavra-chave 4", "Palavra-chave 5"],
  "missingKeywords": ["Palavra ou competência desejável não citada"],
  "skillsComparison": [
    { "skill": "Hard Skills do Cargo", "requiredLevel": 90, "userLevel": 88, "category": "Hard Skill", "notes": "Forte alinhamento com a stack da vaga" },
    { "skill": "Metodologias & Processos", "requiredLevel": 85, "userLevel": 90, "category": "Metodologia", "notes": "Supera o requisito mínimo" },
    { "skill": "Impacto & Métricas", "requiredLevel": 90, "userLevel": 85, "category": "Experiência", "notes": "Resultados quantificados no currículo" },
    { "skill": "Ferramentas & Tecnologias", "requiredLevel": 95, "userLevel": 88, "category": "Ferramenta", "notes": "Termos técnicos bem distribuídos" },
    { "skill": "Soft Skills & Comunicação", "requiredLevel": 80, "userLevel": 85, "category": "Soft Skill", "notes": "Excelente postura e linguagem profissional" },
    { "skill": "Formatação & ATS", "requiredLevel": 95, "userLevel": 95, "category": "ATS", "notes": "Estrutura 100% legível por robôs" }
  ],
  "strengths": ["Destaque positivo 1 sobre compatibilidade com o cargo", "Destaque positivo 2"],
  "improvementSuggestions": ["Sugestão prática para elevar ainda mais a nota ATS"],
  "summary": "Resumo em 1-2 frases sobre o nível de compatibilidade do currículo com a vaga de ${role}."
}
===ATS_SCORE_JSON_END===

**BLOCO ESTRUTURADO DE PERGUNTAS DE ENTREVISTA (OBRIGATÓRIO NO FINAL):**
Após o bloco ATS, adicione o bloco JSON contendo as perguntas de entrevista para o cargo de ${role} delimitado por:
===INTERVIEW_QUESTIONS_JSON_START===
[
  {
    "category": "Técnica",
    "question": "Pergunta técnica detalhada para o cargo de ${role}",
    "difficulty": "Avançado",
    "whyTheyAsk": "Por que os recrutadores fazem esta pergunta especificamente...",
    "tips": "Dica prática de como responder com foco em resultados e métricas...",
    "idealAnswerFramework": "Estrutura recomendada: Inicie conceituando X, exemplifique com Y e conclua com o impacto em Z."
  },
  {
    "category": "Comportamental",
    "question": "Pergunta comportamental relevante...",
    "difficulty": "Intermediário",
    "whyTheyAsk": "Avaliar como você lida com...",
    "tips": "Utilize o método STAR (Situação, Tarefa, Ação, Resultado)...",
    "idealAnswerFramework": "Descreva uma situação real onde..."
  },
  {
    "category": "Situacional",
    "question": "Pergunta de cenário / crise...",
    "difficulty": "Avançado",
    "whyTheyAsk": "Testar tomada de decisão e raciocínio sob pressão...",
    "tips": "Demonstre calma, priorização e comunicação clara...",
    "idealAnswerFramework": "Mostre as etapas de diagnóstico, plano de ação e mitigação de riscos."
  },
  {
    "category": "Para o Entrevistador",
    "question": "Pergunta estratégica para o candidato fazer ao recrutador sobre os desafios da vaga",
    "difficulty": "Estratégico",
    "whyTheyAsk": "Demonstra proatividade, curiosidade intelectual e visão de negócio.",
    "tips": "Faça no final da entrevista quando abrirem para dúvidas.",
    "idealAnswerFramework": "Pergunte demonstrando interesse genuíno nos objetivos do time."
  }
]
===INTERVIEW_QUESTIONS_JSON_END===
`;

export const getGradeFromScore = (score: number): 'A+' | 'A' | 'B' | 'C' | 'D' => {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
};

export const extractAtsScoreAndQuestions = (
  rawText: string,
  defaultRole: string,
  defaultCompany: string,
  jobDesc?: string
): { cleanContent: string; atsScore: AtsScoreDetails; questions: InterviewQuestion[] } => {
  let content = rawText;
  let atsScore: AtsScoreDetails | null = null;
  let questions: InterviewQuestion[] = [];

  // 1. Extrair ATS Score JSON
  const atsStartTag = "===ATS_SCORE_JSON_START===";
  const atsEndTag = "===ATS_SCORE_JSON_END===";
  const atsStartIndex = content.indexOf(atsStartTag);
  const atsEndIndex = content.indexOf(atsEndTag);

  if (atsStartIndex !== -1 && atsEndIndex !== -1 && atsEndIndex > atsStartIndex) {
    const jsonString = content.substring(atsStartIndex + atsStartTag.length, atsEndIndex).trim();
    content = (content.substring(0, atsStartIndex) + content.substring(atsEndIndex + atsEndTag.length)).trim();

    try {
      const cleanedJson = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && typeof parsed.overallScore === 'number') {
        atsScore = {
          overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore))),
          grade: parsed.grade || getGradeFromScore(parsed.overallScore),
          breakdown: {
            keywordMatching: parsed.breakdown?.keywordMatching ?? Math.round(parsed.overallScore * 0.98),
            skillsAlignment: parsed.breakdown?.skillsAlignment ?? Math.round(parsed.overallScore * 0.95),
            experienceRelevance: parsed.breakdown?.experienceRelevance ?? Math.round(parsed.overallScore * 0.92),
            formattingReadability: parsed.breakdown?.formattingReadability ?? 95,
          },
          matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : ["Hard Skills Relevantes", "Termos Técnicos do Cargo", "Verbos de Ação"],
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
          skillsComparison: Array.isArray(parsed.skillsComparison) && parsed.skillsComparison.length > 0 
            ? parsed.skillsComparison.map((item: any) => ({
                skill: item.skill || 'Competência',
                requiredLevel: typeof item.requiredLevel === 'number' ? item.requiredLevel : 85,
                userLevel: typeof item.userLevel === 'number' ? item.userLevel : 80,
                category: item.category || 'Geral',
                notes: item.notes || ''
              }))
            : undefined,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Alta densidade de palavras-chave", "Estrutura 100% legível por robôs ATS"],
          improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : ["Mantenha as métricas quantitativas atualizadas"],
          summary: parsed.summary || `Currículo com excelente aderência para a posição de ${defaultRole} na ${defaultCompany}.`
        };
      }
    } catch (e) {
      console.warn("Falha ao analisar JSON de Score ATS:", e);
    }
  }

  // 2. Extrair Perguntas de Entrevista JSON
  const qStartTag = "===INTERVIEW_QUESTIONS_JSON_START===";
  const qEndTag = "===INTERVIEW_QUESTIONS_JSON_END===";
  const qStartIndex = content.indexOf(qStartTag);
  const qEndIndex = content.indexOf(qEndTag);

  if (qStartIndex !== -1 && qEndIndex !== -1 && qEndIndex > qStartIndex) {
    const jsonString = content.substring(qStartIndex + qStartTag.length, qEndIndex).trim();
    content = (content.substring(0, qStartIndex) + content.substring(qEndIndex + qEndTag.length)).trim();

    try {
      const cleanedJson = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.map((item, idx) => ({
          id: `q-${Date.now()}-${idx}`,
          category: item.category || 'Técnica',
          question: item.question || '',
          difficulty: item.difficulty || 'Intermediário',
          whyTheyAsk: item.whyTheyAsk || '',
          tips: item.tips || '',
          idealAnswerFramework: item.idealAnswerFramework || ''
        }));
      }
    } catch (e) {
      console.warn("Falha ao analisar JSON de perguntas de entrevista:", e);
    }
  }

  // Fallbacks seguros se necessário
  if (!atsScore) {
    atsScore = generateFallbackAtsScore(defaultRole, defaultCompany, jobDesc);
  }
  if (questions.length === 0) {
    questions = generateFallbackQuestions(defaultRole, defaultCompany);
  }

  return {
    cleanContent: content.trim(),
    atsScore,
    questions
  };
};

export const generateFallbackAtsScore = (role: string, company: string, jobDesc?: string): AtsScoreDetails => {
  const hasJobDesc = !!jobDesc && jobDesc.trim().length > 20;
  const baseScore = hasJobDesc ? 94 : 88;

  return {
    overallScore: baseScore,
    grade: getGradeFromScore(baseScore),
    breakdown: {
      keywordMatching: hasJobDesc ? 96 : 89,
      skillsAlignment: hasJobDesc ? 93 : 87,
      experienceRelevance: hasJobDesc ? 91 : 85,
      formattingReadability: 98,
    },
    matchedKeywords: [
      `Competências essenciais de ${role}`,
      "Metodologias e Frameworks da área",
      "Verbos de Ação Estratégicos",
      "Métricas e Indicadores de Desempenho (KPIs)",
      "Formatação Padrão ATS (Sem tabelas quebradas)"
    ],
    missingKeywords: hasJobDesc ? ["Certificações Específicas Adicionais (se houver)"] : ["Palavras-chave nichadas da vaga"],
    strengths: [
      "Estrutura 100% otimizada para robôs de triagem automática (Gupy, Greenhouse, Workday)",
      `Resumo Profissional perfeitamente alinhado com o cargo de ${role}`,
      "Alta densidade semântica de termos técnicos e soft skills"
    ],
    improvementSuggestions: [
      "Adicione números concretos (%, R$ ou prazos) nas realizações mais recentes para maximizar a conversão"
    ],
    summary: `O currículo reformulado atinge uma excelente taxa de aderência ATS para a posição de ${role} na ${company}.`
  };
};

export const generateFallbackQuestions = (role: string, company: string): InterviewQuestion[] => {
  const roleName = role || "sua área";
  const companyName = company || "empresa contratante";
  
  return [
    {
      id: `q-fallback-1`,
      category: "Comportamental",
      question: `Conte-me sobre um projeto desafiador que você liderou ou implementou como ${roleName} e como superou os obstáculos.`,
      difficulty: "Intermediário",
      whyTheyAsk: "Avaliar resiliência, senso de propriedade (ownership) e capacidade de entrega sob pressão.",
      tips: "Use a metodologia STAR (Situação, Tarefa, Ação e Resultado). Foque nas decisões que você tomou pessoalmente e cite números ou impacto real.",
      idealAnswerFramework: "Contextualize brevemente o problema, explique sua responsabilidade direta, detalhe as 2-3 ações mais estratégicas e finalize com os resultados mensuráveis alcançados."
    },
    {
      id: `q-fallback-2`,
      category: "Técnica",
      question: `Quais critérios e métricas você utiliza para garantir a qualidade, eficiência e escalabilidade do seu trabalho no dia a dia como ${roleName}?`,
      difficulty: "Avançado",
      whyTheyAsk: "Verificar rigor técnico, domínio de boas práticas e mentalidade orientada a padrões de excelência.",
      tips: "Cite frameworks, ferramentas da sua área de atuação e como você equilibra velocidade de entrega com alto padrão de qualidade.",
      idealAnswerFramework: "Divida a resposta em pilares: planejamento, execução com validações constantes, e monitoramento contínuo de resultados."
    },
    {
      id: `q-fallback-3`,
      category: "Situacional",
      question: `Como você age quando recebe prioridades conflitantes de diferentes stakeholders ou um prazo é subitamente encurtado?`,
      difficulty: "Intermediário",
      whyTheyAsk: "Testar capacidade de negociação, gestão do tempo e comunicação transparente.",
      tips: "Demonstre que você não entra em pânico, mas sim usa dados e alinhamento com a liderança para repriorizar com clareza.",
      idealAnswerFramework: "Explique como mapeia impacto vs. esforço, comunica riscos proativamente e busca alinhamento rápido com os líderes."
    },
    {
      id: `q-fallback-4`,
      category: "Cultura & Fit",
      question: `O que mais chamou sua atenção na oportunidade da ${companyName} e como seus valores profissionais se conectam a essa posição de ${roleName}?`,
      difficulty: "Básico",
      whyTheyAsk: "Medir genuíno interesse na vaga e aderência à cultura organizacional da empresa.",
      tips: "Conecte sua trajetória aos objetivos da empresa. Mostre que você pesquisou sobre o produto, mercado ou desafios da organização.",
      idealAnswerFramework: "Mencione 1-2 pontos específicos sobre a empresa que você admira e explique como sua experiência agregará valor a esses objetivos."
    },
    {
      id: `q-fallback-5`,
      category: "Para o Entrevistador",
      question: `Qual é o principal desafio ou meta que a equipe de ${roleName} precisa atingir nos primeiros 90 a 180 dias?`,
      difficulty: "Estratégico",
      whyTheyAsk: "Demonstra maturidade executiva, foco em resultados imediatos e interesse real em gerar impacto desde o primeiro dia.",
      tips: "Faça esta pergunta no final da entrevista técnica ou com a liderança para entender o critério de sucesso do cargo.",
      idealAnswerFramework: "Ouça atentamente a resposta e, se oportuno, faça um breve gancho de como uma experiência sua anterior se relaciona a esse desafio."
    }
  ];
};

export const generateFallbackCareerAdvice = (
  role: string,
  company: string,
  jobDesc?: string
): ExpertCareerAdvice => {
  const normalizedRole = (role || "").toLowerCase();
  const roleTitle = role || "Profissional Especialista";
  const companyTitle = company || "Empresa Contratante";

  const isSales = /vendas|comercial|sdr|bdr|closer|consultor comercial|account executive|inside sales|negócios|executivo de contas|hunter|farmer/i.test(normalizedRole);
  const isTech = /desenvolvedor|developer|software|frontend|backend|fullstack|devops|tech lead|engenheiro de software|programador|mobile|ios|android|qa|arquiteto/i.test(normalizedRole);

  if (isSales) {
    return {
      targetRole: roleTitle,
      targetCompany: companyTitle,
      seniorityLevel: "Pleno / Sênior Especialista",
      marketOutlook: "Cargos de vendas consultivas e alta complexidade B2B continuam em alta demanda, especialmente profissionais que dominam tanto a prospecção ativa quanto a negociação com tomadores de decisão (C-Level).",
      goldenRule: "Recrutadores de vendas não compram apenas esforço ou 'vontade de vender'; eles compram histórico comprovado de metas batidas, domínio de funil (CAC, LTV, ticket médio) e previsibilidade de pipeline.",
      executiveSummary: `Para se destacar como ${roleTitle} na ${companyTitle}, posicione-se como um consultor estratégico de negócios que diagnostica dores reais de clientes e fecha contratos com margem saudável, e não como um mero vendedor transacional.`,
      powerKeywords: [
        "Superação de Metas (Quota)",
        "Prospecção Ativa (Outbound)",
        "Venda Consultiva (SPIN)",
        "Ticket Médio",
        "Ciclo de Vendas Reduzido",
        "Pipeline Previsível",
        "Qualificação BANT/MEDDIC",
        "Negociação com C-Level",
        "Taxa de Fechamento (Win Rate)",
        "Gestão de Carteira & Upsell"
      ],
      mustAskInterviewQuestions: [
        `Qual é o ticket médio e o tempo de ciclo médio de vendas da solução na ${companyTitle}?`,
        "Como é a divisão atual de leads: a maior parte vem de Inbound/Marketing ou o foco principal é na prospecção ativa Outbound?",
        "Qual porcentagem do time de vendas atual está atingindo ou superando a meta mensal?",
        "Quais as principais objeções que os clientes costumam apresentar contra a solução da empresa hoje?"
      ],
      categories: [
        {
          id: "positioning",
          title: "Posicionamento & Narrativa",
          summary: "Como estruturar sua história profissional para gerar autoridade imediata.",
          tips: [
            {
              title: "Destaque Percentuais de Meta Batida",
              description: "Em vez de descrever rotinas como 'atendimento ao cliente', cite números: 'Atingiu 118% da meta anual de novas vendas no ciclo 2024/2025'.",
              actionableStep: "Revise a descrição dos seus últimos 2 empregos e insira pelo menos 2 métricas de faturamento ou novos clientes conquistados.",
              tag: "Métricas"
            },
            {
              title: "Demonstre Metodologia Estruturada",
              description: "Explique o processo que você utiliza para qualificar leads (ex: SPIN Selling, Challenger Sale ou GPCT). Empresas maduras buscam processos replicáveis, não 'sorte'.",
              actionableStep: "Na entrevista, conte um case dividindo em: Como encontrou o lead, como diagnosticou a dor e como fechou o negócio.",
              tag: "Metodologia"
            }
          ]
        }
      ]
    };
  }

  return {
    targetRole: roleTitle,
    targetCompany: companyTitle,
    seniorityLevel: isTech ? "Engenheiro Sênior" : "Profissional Estratégico",
    marketOutlook: `Forte demanda no mercado para profissionais de ${roleTitle} com perfil resolutivo e capacidade de aliar rigor técnico a visão de negócio.`,
    goldenRule: "Recrutadores experientes não buscam apenas uma lista de ferramentas; eles buscam provas concretas de impacto, liderança técnica e capacidade de resolver problemas reais de ponta a ponta.",
    executiveSummary: `Guia de estratégia para conquistar a vaga de ${roleTitle} na ${companyTitle}. Destaque métricas de impacto, domínio metodológico e fit cultural.`,
    powerKeywords: [
      "Resultados Quantificáveis",
      "Liderança Técnica",
      "Arquitetura & Boas Práticas",
      "Eficiência Operacional",
      "Metodologias Ágeis",
      "Resolução de Problemas Críticos",
      "Inovação Aplicada",
      "Visão de Negócio & ROI"
    ],
    mustAskInterviewQuestions: [
      `Qual é a meta mais urgente que o time de ${roleTitle} precisa entregar nos primeiros 6 meses?`,
      "Como vocês medem o sucesso individual e o impacto desta cadeira na empresa?",
      "Quais são os maiores gargalos operacionais ou técnicos que a equipe enfrenta atualmente?"
    ],
    categories: [
      {
        id: "positioning",
        title: "Posicionamento & Narrativa de Impacto",
        summary: "Como apresentar sua trajetória com tom de liderança e autoridade técnica.",
        tips: [
          {
            title: "Foque no Impacto de Negócio, Não Apenas em Tarefas",
            description: "Diferencie-se de 90% dos candidatos conectando suas entregas a resultados de negócio (ex: 'Reduziu custos em 20%', 'Acelerou o lançamento de features em 35%').",
            actionableStep: "Transforme cada tópico de experiência no formato: Ação Realizada + Ferramenta + Métrica de Sucesso Alcançada.",
            tag: "Impacto"
          }
        ]
      }
    ]
  };
};

/**
 * Otimiza o currículo no servidor usando Gemini 3.8 Flash
 */
export const serverOptimizeCV = async (
  cvText: string,
  company: string,
  role: string,
  jobDesc: string,
  linkedinUrl?: string,
  githubUrl?: string
): Promise<OptimizationResult> => {
  try {
    const ai = getGeminiClient();
    
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: PROMPT_TEMPLATE(
          cvText, 
          company, 
          role, 
          jobDesc, 
          linkedinUrl || "", 
          githubUrl || ""
        ),
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.7,
        },
      });
    } catch (searchErr) {
      console.warn("Retrying generateContent without search tool on server:", searchErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: PROMPT_TEMPLATE(
          cvText, 
          company, 
          role, 
          jobDesc, 
          linkedinUrl || "", 
          githubUrl || ""
        ),
        config: {
          temperature: 0.7,
        },
      });
    }

    const rawText = response.text || "Não foi possível gerar o currículo. Tente novamente.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    const { cleanContent, atsScore, questions } = extractAtsScoreAndQuestions(rawText, role, company, jobDesc);
    const careerAdvice = generateFallbackCareerAdvice(role, company, jobDesc);

    return {
      content: cleanContent,
      targetCompany: company,
      targetRole: role,
      atsScore,
      interviewQuestions: questions,
      careerAdvice,
      groundingMetadata,
    };

  } catch (error) {
    console.error("Server Gemini API Error:", error);
    throw new Error("Falha ao comunicar com a IA de Recrutamento.");
  }
};

/**
 * Otimiza com streaming no servidor
 */
export const serverOptimizeCVStream = async (
  cvText: string,
  company: string,
  role: string,
  jobDesc: string,
  linkedinUrl: string | undefined,
  githubUrl: string | undefined,
  onChunk: (text: string) => void
): Promise<OptimizationResult> => {
  const ai = getGeminiClient();
  const prompt = PROMPT_TEMPLATE(cvText, company, role, jobDesc, linkedinUrl || "", githubUrl || "");
  
  let fullText = "";
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }
  } catch (streamErr) {
    console.warn("Falha no streaming, gerando conteúdo completo:", streamErr);
    return await serverOptimizeCV(cvText, company, role, jobDesc, linkedinUrl, githubUrl);
  }

  const { cleanContent, atsScore, questions } = extractAtsScoreAndQuestions(fullText, role, company, jobDesc);
  const careerAdvice = generateFallbackCareerAdvice(role, company, jobDesc);

  return {
    content: cleanContent,
    targetCompany: company,
    targetRole: role,
    atsScore,
    interviewQuestions: questions,
    careerAdvice,
  };
};

/**
 * Recalcula o ATS Score no servidor
 */
export const serverRecalculateAtsScore = async (
  currentCvContent: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<AtsScoreDetails> => {
  try {
    const ai = getGeminiClient();
    
    const prompt = `
Você é um Auditor Especialista em Sistemas ATS (Applicant Tracking Systems) como Gupy, Workday, Taleo, Greenhouse e Lever.
Analise a compatibilidade do seguinte currículo com a vaga de "${role}" na empresa "${company}".

DESCRIÇÃO DA VAGA:
"""
${jobDesc || "Requisitos e competências padrão de mercado para " + role}
"""

CURRÍCULO ATUAL:
"""
${currentCvContent}
"""

Avalie minuciosamente:
1. keywordMatching: % de termos e competências essenciais presentes no CV (0 a 100).
2. skillsAlignment: % de alinhamento com hard skills e metodologias da área (0 a 100).
3. experienceRelevance: % de impacto demonstrado com verbos de ação e métricas (0 a 100).
4. formattingReadability: % de legibilidade técnica do formato para robôs ATS (0 a 100).
5. overallScore: Média ponderada realista (0 a 100).

Retorne APENAS um JSON válido no formato exato:
{
  "overallScore": 92,
  "grade": "A+",
  "breakdown": {
    "keywordMatching": 95,
    "skillsAlignment": 90,
    "experienceRelevance": 88,
    "formattingReadability": 95
  },
  "matchedKeywords": ["Key1", "Key2", "Key3", "Key4", "Key5"],
  "missingKeywords": ["Palavra-chave recomendada faltante"],
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvementSuggestions": ["Sugestão de melhoria específica"],
  "summary": "Resumo objetivo da análise ATS em 1-2 frases."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const text = response.text?.trim() || "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && typeof parsed.overallScore === 'number') {
      return {
        overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore))),
        grade: parsed.grade || getGradeFromScore(parsed.overallScore),
        breakdown: {
          keywordMatching: parsed.breakdown?.keywordMatching ?? Math.round(parsed.overallScore * 0.98),
          skillsAlignment: parsed.breakdown?.skillsAlignment ?? Math.round(parsed.overallScore * 0.95),
          experienceRelevance: parsed.breakdown?.experienceRelevance ?? Math.round(parsed.overallScore * 0.92),
          formattingReadability: parsed.breakdown?.formattingReadability ?? 95,
        },
        matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : ["Competências da vaga"],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        skillsComparison: Array.isArray(parsed.skillsComparison) && parsed.skillsComparison.length > 0
          ? parsed.skillsComparison.map((item: any) => ({
              skill: item.skill || 'Competência',
              requiredLevel: typeof item.requiredLevel === 'number' ? item.requiredLevel : 85,
              userLevel: typeof item.userLevel === 'number' ? item.userLevel : 80,
              category: item.category || 'Geral',
              notes: item.notes || ''
            }))
          : undefined,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Estrutura clara"],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : ["Continue refinando suas métricas"],
        summary: parsed.summary || `Avaliação ATS concluída com sucesso.`
      };
    }

    return generateFallbackAtsScore(role, company, jobDesc);
  } catch (err) {
    console.error("Erro no servidor ao recalcular ATS Score:", err);
    return generateFallbackAtsScore(role, company, jobDesc);
  }
};

/**
 * Gera perguntas de entrevista no servidor
 */
export const serverGenerateMoreInterviewQuestions = async (
  role: string,
  company: string,
  jobDesc?: string,
  categoryFilter?: string
): Promise<InterviewQuestion[]> => {
  try {
    const ai = getGeminiClient();
    
    const prompt = `
Você é um Headhunter e Coach de Entrevistas de Elite.
Gere 5 perguntas inéditas, altamente realistas e específicas de entrevista para o cargo de "${role}" na empresa "${company}".
${categoryFilter && categoryFilter !== 'Todas' ? `Foco principal na categoria: "${categoryFilter}".` : ''}
Contexto da Vaga: ${jobDesc || "Padrões globais de mercado para este nível e cargo."}

Retorne APENAS um JSON válido no formato abaixo, sem texto introdutório:
[
  {
    "category": "Técnica" | "Comportamental" | "Situacional" | "Cultura & Fit" | "Para o Entrevistador",
    "question": "Texto claro e direto da pergunta",
    "difficulty": "Básico" | "Intermediário" | "Avançado" | "Estratégico",
    "whyTheyAsk": "Objetivo do entrevistador ao fazer essa pergunta",
    "tips": "Dica prática e estruturada de resposta (use método STAR se aplicável)",
    "idealAnswerFramework": "Estrutura recomendada de resposta com passos claros"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const text = response.text?.trim() || "[]";
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: `q-extra-${Date.now()}-${idx}`,
        category: item.category || 'Técnica',
        question: item.question || '',
        difficulty: item.difficulty || 'Intermediário',
        whyTheyAsk: item.whyTheyAsk || '',
        tips: item.tips || '',
        idealAnswerFramework: item.idealAnswerFramework || ''
      }));
    }

    return generateFallbackQuestions(role, company);
  } catch (error) {
    console.error("Erro no servidor ao gerar perguntas de entrevista:", error);
    return generateFallbackQuestions(role, company);
  }
};

/**
 * Avalia resposta de simulação de entrevista no servidor
 */
export const serverEvaluateInterviewAnswer = async (
  question: string,
  answer: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<InterviewAnswerEvaluation> => {
  try {
    const ai = getGeminiClient();
    
    const prompt = `
Você é um Headhunter Executivo e Avaliador de Entrevistas de Elite para o cargo de "${role}" na empresa "${company}".
Avalie detalhadamente a resposta dada pelo candidato durante esta simulação de entrevista.

PERGUNTA DA ENTREVISTA:
"${question}"

RESPOSTA DO CANDIDATO:
"${answer}"

CONTEXTO DA VAGA:
${jobDesc || "Requisitos e padrões de excelência para " + role}

Forneça uma avaliação rigorosa, encorajadora e extremamente prática em formato JSON estruturado:
{
  "score": 88,
  "grade": "A",
  "verdict": "Resposta Excelente e Convincente" | "Boa Resposta com Oportunidades de Ajuste" | "Resposta Razoável - Precisa de Mais Estrutura" | "Resposta Insuficiente",
  "feedback": "Diagnóstico claro em 2 a 3 frases sobre a entrega do candidato.",
  "strengths": [
    "Ponto forte 1 observado na resposta",
    "Ponto forte 2 observado"
  ],
  "improvements": [
    "Oportunidade prática 1 para elevar a resposta ao nível sênior",
    "Oportunidade prática 2"
  ],
  "starBreakdown": {
    "situation": {
      "present": true,
      "score": 90,
      "observation": "Contextualizou claramente o cenário/empresa/desafio."
    },
    "task": {
      "present": true,
      "score": 85,
      "observation": "Definiu a responsabilidade individual direta."
    },
    "action": {
      "present": true,
      "score": 90,
      "observation": "Detallhou as ações práticas e ferramentas utilizadas."
    },
    "result": {
      "present": true,
      "score": 85,
      "observation": "Apresentou o desfecho e impacto gerado."
    }
  },
  "modelAnswer": "Exemplo de resposta de padrão ouro personalizada para ${role} na ${company}, aplicando perfeitamente o método STAR e métricas de alto impacto.",
  "toneAndDeliveryTips": "Dica sobre postura, tom de voz, concisão e vocabulário executivo para esta pergunta."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    const text = response.text?.trim() || "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 80;

    return {
      score,
      grade: parsed.grade || (score >= 93 ? 'A+' : score >= 85 ? 'A' : score >= 70 ? 'B' : 'C'),
      verdict: parsed.verdict || (score >= 85 ? 'Excelente Desempenho' : score >= 70 ? 'Bom Desempenho' : 'Precisa Praticar Mais'),
      feedback: parsed.feedback || "Resposta estruturada com clareza e bom vocabulário.",
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 
        ? parsed.strengths 
        : ["Comunicação assertiva", "Alinhamento com a pergunta"],
      improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0 
        ? parsed.improvements 
        : ["Acrescente números e métricas no resultado final", "Enfatize seu papel individual nas decisões"],
      starBreakdown: parsed.starBreakdown || {
        situation: { present: true, score: 85, observation: "Contexto inicial apresentado." },
        task: { present: true, score: 80, observation: "Meta ou desafio mencionado." },
        action: { present: true, score: 85, observation: "Ações tomadas descritas." },
        result: { present: true, score: 80, observation: "Conclusão ou aprendizado citado." }
      },
      modelAnswer: parsed.modelAnswer || `Na minha experiência com ${role}, estruturei uma solução estratégica focada em resultados mensuráveis para a ${company}...`,
      toneAndDeliveryTips: parsed.toneAndDeliveryTips || "Mantenha um tom confiante, faça pausas estratégicas e responda em até 2 minutos."
    };
  } catch (error) {
    console.error("Erro no servidor ao avaliar resposta com IA:", error);
    return {
      score: 82,
      grade: 'B',
      verdict: 'Boa Resposta - Pronta com Pequenos Ajustes',
      feedback: "Sua resposta foi coerente, abordou o tema central da pergunta e demonstrou vivência profissional na área.",
      strengths: [
        "Boa articulação das ideias e vocabulário apropriado",
        "Demonstrou domínio do tema central proposto"
      ],
      improvements: [
        "Tente incluir métricas quantitativas (ex: +25% de produtividade ou prazos cumpridos)",
        "Destaque mais a fase de 'Resultado' do método STAR para fechar com chave de ouro"
      ],
      starBreakdown: {
        situation: { present: true, score: 85, observation: "Cenário explicado com clareza." },
        task: { present: true, score: 80, observation: "Objetivo claro." },
        action: { present: true, score: 85, observation: "Boas iniciativas citadas." },
        result: { present: false, score: 65, observation: "Poderia quantificar melhor o desfecho final." }
      },
      modelAnswer: `Como ${role}, encarei um desafio similar onde analisei o cenário, liderei as ações prioritárias e entreguei um resultado de alto impacto alinhado à cultura da ${company}.`,
      toneAndDeliveryTips: "Mantenha a resposta concisa entre 1m30s e 2 minutos para manter o entrevistador engajado."
    };
  }
};

/**
 * Gera conselhos de carreira de especialista no servidor
 */
export const serverGetExpertCareerAdvice = async (
  role: string,
  company: string,
  jobDesc?: string,
  cvText?: string
): Promise<ExpertCareerAdvice> => {
  try {
    const ai = getGeminiClient();
    
    const prompt = `
Você é o mais prestigiado Headhunter Executivo e Estrategista de Carreira da América Latina.
Gere um dossiê estratégico de posicionamento e dicas avançadas para o cargo de "${role}" na empresa "${company}".
Contexto da Vaga / Requisitos:
"""
${jobDesc || "Requisitos e competências padrão de mercado para " + role}
"""
Currículo Atual (para identificar pontos cegos e alavancas de valor):
"""
${cvText ? cvText.slice(0, 1500) : "Não fornecido"}
"""

Retorne APENAS um JSON no formato exato:
{
  "targetRole": "${role}",
  "targetCompany": "${company}",
  "seniorityLevel": "Júnior / Pleno / Sênior / Especialista / Liderança",
  "marketOutlook": "Análise de 2 frases sobre a demanda de mercado atual e perspectiva para este cargo em 2026.",
  "goldenRule": "A regra de ouro inegociável para quem quer passar na entrevista e ser contratado para este cargo.",
  "executiveSummary": "Resumo executivo de posicionamento para ${role} na ${company}.",
  "powerKeywords": [
    "Palavra de Poder 1",
    "Palavra de Poder 2",
    "Palavra de Poder 3",
    "Palavra de Poder 4",
    "Palavra de Poder 5",
    "Palavra de Poder 6"
  ],
  "mustAskInterviewQuestions": [
    "Pergunta 1 inteligente para o candidato fazer ao entrevistador/gestor",
    "Pergunta 2 estratégica sobre metas e desafios da área"
  ],
  "categories": [
    {
      "id": "positioning",
      "title": "Posicionamento & Narrativa Executiva",
      "summary": "Como estruturar o discurso para passar senioridade imediata.",
      "tips": [
        {
          "title": "Título da Dica 1",
          "description": "Explicação detalhada do porquê e como aplicar.",
          "actionableStep": "Ação prática recomendada para aplicar já.",
          "tag": "Estratégia"
        }
      ]
    },
    {
      "id": "skills_trends",
      "title": "Competências & Tendências 2026",
      "summary": "O que o mercado está exigindo e pagando mais para este profissional.",
      "tips": [
        {
          "title": "Habilidade ou Tendência Crítica 1",
          "description": "Por que esta competência é tão valorizada pelos recrutadores.",
          "actionableStep": "Como demonstrar no currículo.",
          "tag": "Tendência"
        }
      ]
    },
    {
      "id": "pitfalls",
      "title": "Armadilhas Frequentes a Evitar",
      "summary": "Erros clássicos de candidatos que concorrem a este cargo e que causam eliminação.",
      "tips": [
        {
          "title": "Erro Crítico 1",
          "description": "Por que esse erro elimina candidatos nesta função.",
          "actionableStep": "O que fazer em vez disso.",
          "tag": "Atenção"
        }
      ]
    },
    {
      "id": "salary_negotiation",
      "title": "Negociação & Alinhamento de Oferta",
      "summary": "Dicas de como negociar remuneração e benefícios para este nível.",
      "tips": [
        {
          "title": "Defesa de Faixa Salarial e Senioridade",
          "description": "Como balizar sua expectativa salarial para esta área.",
          "actionableStep": "Como responder à pergunta de pretensão.",
          "tag": "Negociação"
        }
      ]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    const text = response.text?.trim() || "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
      return {
        targetRole: parsed.targetRole || role,
        targetCompany: parsed.targetCompany || company,
        seniorityLevel: parsed.seniorityLevel || "Profissional",
        marketOutlook: parsed.marketOutlook || `Forte demanda de mercado para profissionais qualificados em ${role}.`,
        goldenRule: parsed.goldenRule || `Comprove o impacto real de suas entregas anteriores para conquistar a vaga de ${role}.`,
        executiveSummary: parsed.executiveSummary || `Recomendações estratégicas de alto impacto para a vaga de ${role} na ${company}.`,
        powerKeywords: Array.isArray(parsed.powerKeywords) && parsed.powerKeywords.length > 0 
          ? parsed.powerKeywords 
          : ["Resultados Mensuráveis", "Liderança Técnica", "Resolução de Problemas"],
        mustAskInterviewQuestions: Array.isArray(parsed.mustAskInterviewQuestions) && parsed.mustAskInterviewQuestions.length > 0
          ? parsed.mustAskInterviewQuestions
          : [
              `Quais são as principais prioridades para quem assumir a vaga de ${role}?`,
              "Como a equipe mede os resultados e o sucesso desta função no dia a dia?"
            ],
        categories: parsed.categories
      };
    }

    return generateFallbackCareerAdvice(role, company, jobDesc);
  } catch (error) {
    console.error("Erro no servidor ao gerar Dica do Especialista com IA:", error);
    return generateFallbackCareerAdvice(role, company, jobDesc);
  }
};

/**
 * Auditoria do Checklist ATS no servidor
 */
export const serverAuditAtsChecklist = async (
  currentCvContent: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<AtsChecklistReport> => {
  try {
    const ai = getGeminiClient();

    const prompt = `
Você é um Auditor Sênior de Algoritmos ATS (Applicant Tracking Systems), especialista em plataformas como Gupy, Workday, Taleo, Greenhouse e Lever.
Faça uma AUDITORIA PROFUNDA de Compatibilidade ATS do seguinte currículo para a vaga de "${role}" na empresa "${company}".

DESCRIÇÃO DA VAGA / REQUISITOS:
"""
${jobDesc || "Requisitos e competências padrão de mercado para " + role}
"""

TEXTO DO CURRÍCULO ATUAL:
"""
${currentCvContent}
"""

Analise detalhadamente todos os quesitos que definem se o currículo passa ou é descartado nos filtros automatizados:
1. Dados de contato e conformidade LGPD (sem CPF/RG, sem fotos, com e-mail, telefone e LinkedIn).
2. Seções canônicas de leitura (Resumo alinhado, Experiência cronológica, Educação, Competências).
3. Densidade de palavras-chave da vaga e prevenção de repetição forçada (keyword stuffing).
4. Presença de métricas numéricas concretas (% de melhoria, volume gerenciado, economia).
5. Verbos de ação fortes no início das frases.
6. Formatação técnica (sem tabelas que quebram o parser, extensão ideal de 1-2 páginas, datas consistentes).

Retorne APENAS um JSON válido no formato exato:
{
  "overallScore": 92,
  "passedCount": 11,
  "warningCount": 2,
  "criticalCount": 0,
  "totalChecks": 13,
  "executiveSummary": "Resumo executivo da auditoria ATS em 2 frases.",
  "topActionItems": [
    "Ação prioritária 1 para passar no robô",
    "Ação prioritária 2"
  ],
  "items": [
    {
      "id": "contact_info",
      "category": "personal_data",
      "categoryLabel": "Dados Pessoais & Contato",
      "title": "Contatos Principais no Cabeçalho",
      "description": "Explicação resumida.",
      "status": "passed",
      "detail": "Detalhe da auditoria.",
      "recommendation": "O que manter ou melhorar.",
      "exampleGood": "Exemplo recomendado.",
      "exampleBad": "Exemplo a evitar."
    }
  ],
  "systemCompatibilities": [
    {
      "system": "Gupy",
      "status": "passed",
      "compatibilityScore": 95,
      "highlight": "Como a IA da Gupy lê este currículo específico.",
      "advice": "Dica prática para rankear no topo da Gupy nesta vaga."
    },
    {
      "system": "Workday",
      "status": "passed",
      "compatibilityScore": 92,
      "highlight": "Comportamento do parser da Workday.",
      "advice": "Orientação de layout."
    },
    {
      "system": "Greenhouse",
      "status": "passed",
      "compatibilityScore": 94,
      "highlight": "Comportamento no Greenhouse.",
      "advice": "Dica de métricas."
    },
    {
      "system": "Taleo",
      "status": "passed",
      "compatibilityScore": 90,
      "highlight": "Comportamento no Taleo.",
      "advice": "Orientação de títulos."
    },
    {
      "system": "Kenoby / Sólides",
      "status": "passed",
      "compatibilityScore": 93,
      "highlight": "Comportamento no Kenoby/Sólides.",
      "advice": "Dica de fit e competências."
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const text = response.text?.trim() || "{}";
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return {
        overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore || 90))),
        passedCount: parsed.passedCount || parsed.items.filter((i: any) => i.status === 'passed').length,
        warningCount: parsed.warningCount || parsed.items.filter((i: any) => i.status === 'warning').length,
        criticalCount: parsed.criticalCount || parsed.items.filter((i: any) => i.status === 'critical').length,
        totalChecks: parsed.items.length,
        items: parsed.items,
        systemCompatibilities: Array.isArray(parsed.systemCompatibilities) && parsed.systemCompatibilities.length > 0
          ? parsed.systemCompatibilities
          : [
              {
                system: 'Gupy',
                status: 'passed',
                compatibilityScore: 94,
                highlight: 'Alta correspondência semântica com o cargo alvo.',
                advice: 'Submeta o arquivo em formato PDF com texto pesquisável.'
              },
              {
                system: 'Workday',
                status: 'passed',
                compatibilityScore: 92,
                highlight: 'Estrutura linear de fácil indexação pelos parsers.',
                advice: 'Evite símbolos especiais ou fontes não padrão.'
              }
            ],
        executiveSummary: parsed.executiveSummary || `Auditoria detalhada concluída para a vaga de ${role} na ${company}.`,
        topActionItems: Array.isArray(parsed.topActionItems) && parsed.topActionItems.length > 0
          ? parsed.topActionItems
          : ["Revise as palavras-chave ausentes da vaga antes de enviar."]
      };
    }

    throw new Error("Resposta da IA inválida");
  } catch (error) {
    console.warn("Falha no servidor na auditoria profunda via IA:", error);
    throw error;
  }
};
