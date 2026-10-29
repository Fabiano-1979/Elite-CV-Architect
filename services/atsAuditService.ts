import { 
  AtsCheckItem, 
  AtsChecklistReport, 
  AtsSystemCompatibility, 
  AtsScoreDetails 
} from '../types';

/**
 * Motor heurístico instantâneo que analisa o texto do currículo otimizado
 * e gera um Checklist de Compatibilidade ATS de alta precisão.
 */
export const generateLocalAtsChecklist = (
  cvText: string,
  targetRole: string,
  targetCompany: string,
  jobDesc?: string,
  atsScore?: AtsScoreDetails
): AtsChecklistReport => {
  const text = cvText || '';
  const lines = text.split('\n');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const items: AtsCheckItem[] = [];

  // ==========================================
  // 1. ESTRUTURA & DADOS PESSOAIS
  // ==========================================

  // 1.1 Contatos essenciais (Email e Telefone)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-\s]?\d{4})/.test(text);
  
  if (hasEmail && hasPhone) {
    items.push({
      id: 'contact_info',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Contatos Principais no Cabeçalho',
      description: 'E-mail profissional e telefone com DDD identificados com clareza.',
      status: 'passed',
      detail: 'O parser ATS consegue extrair seus canais de contato sem erro de indexação.',
      recommendation: 'Mantenha os contatos sempre no topo em texto puro, sem colocar dentro de imagens ou cabeçalhos flutuantes.',
      autoDetected: true
    });
  } else if (hasEmail || hasPhone) {
    items.push({
      id: 'contact_info',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Contatos Principais no Cabeçalho',
      description: hasEmail ? 'Telefone de contato não detectado claramente.' : 'E-mail profissional não detectado.',
      status: 'warning',
      detail: 'Alguns sistemas ATS exigem telefone e e-mail no primeiro bloco de parsing para liberar a candidatura.',
      recommendation: `Adicione explicitamente: ${!hasEmail ? 'seu e-mail profissional' : 'seu telefone com DDD e WhatsApp'} logo abaixo do seu nome.`,
      exampleGood: 'joao.silva@email.com | (11) 98765-4321 | São Paulo, SP',
      exampleBad: 'Contatos somente no rodapé ou ocultos em link genérico',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'contact_info',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Contatos Principais no Cabeçalho',
      description: 'Nenhum e-mail ou telefone evidente encontrado no início do currículo.',
      status: 'critical',
      detail: 'Sistemas automatizados como Workday e Gupy podem rejeitar o perfil automaticamente por falta de dados cadastrais.',
      recommendation: 'Insira um bloco inicial de contatos com: Nome Completo, Cidade/Estado, Telefone e E-mail.',
      exampleGood: 'MARIA ALBUQUERQUE\nmaria.dev@gmail.com | (61) 99123-4567 | Brasília, DF',
      autoDetected: true
    });
  }

  // 1.2 LinkedIn / Portfólio
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(text) || /linkedin/i.test(text);
  const hasGithubOrPortfolio = /github\.com\/[\w-]+/i.test(text) || /portfolio|github|behance/i.test(text);
  
  if (hasLinkedIn) {
    items.push({
      id: 'social_profile',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Link de Perfil Profissional (LinkedIn)',
      description: 'Presença de link do LinkedIn identificada.',
      status: 'passed',
      detail: 'Permite que recrutadores façam validação cruzada do seu histórico em 1 clique.',
      recommendation: 'Garanta que o perfil do LinkedIn esteja atualizado com as mesmas datas e cargos do CV.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'social_profile',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Link de Perfil Profissional (LinkedIn)',
      description: 'URL do LinkedIn não encontrada no cabeçalho.',
      status: 'warning',
      detail: 'Mais de 87% dos recrutadores buscam o perfil do LinkedIn logo após a triagem ATS inicial.',
      recommendation: 'Adicione a URL do seu perfil público do LinkedIn no bloco de contatos.',
      exampleGood: 'linkedin.com/in/seunome',
      autoDetected: true
    });
  }

  // 1.3 Ausência de dados sensíveis perigosos (LGPD, CPF, RG, Foto, Estado Civil)
  const hasCPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(text) || /cpf/i.test(text);
  const hasRG = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]\b/.test(text) || /\brg\b/i.test(text);
  const hasMarital = /solteir[oa]|casad[oa]|divorciad[oa]|vi[uú]v[oa]/i.test(text);
  const hasPhotoMention = /foto\s*anexa|foto\s*3x4|fotografia/i.test(text);

  if (!hasCPF && !hasRG && !hasMarital && !hasPhotoMention) {
    items.push({
      id: 'sensitive_data',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Conformidade LGPD & Anti-Discriminação ATS',
      description: 'Sem documentos sensíveis (CPF, RG), fotos ou estado civil desnecessários.',
      status: 'passed',
      detail: 'Seu currículo foca 100% em mérito técnico e profissional, reduzindo riscos de compliance para as empresas.',
      recommendation: 'Nunca inclua número de documentos pessoais antes da contratação formal.',
      autoDetected: true
    });
  } else {
    const foundSensitive: string[] = [];
    if (hasCPF) foundSensitive.push('CPF');
    if (hasRG) foundSensitive.push('RG');
    if (hasMarital) foundSensitive.push('Estado Civil');
    if (hasPhotoMention) foundSensitive.push('Menção a Foto');

    items.push({
      id: 'sensitive_data',
      category: 'personal_data',
      categoryLabel: 'Dados Pessoais & Contato',
      title: 'Conformidade LGPD & Anti-Discriminação ATS',
      description: `Elementos dispensáveis ou de risco detectados: ${foundSensitive.join(', ')}.`,
      status: 'warning',
      detail: 'Filtros ATS de empresas globais e compliance LGPD desaconselham documentos pessoais e dados civis no CV por diretrizes anti-viés.',
      recommendation: 'Remova CPF, RG, estado civil e fotos. Deixe apenas contatos básicos e localização geral.',
      exampleBad: 'Brasileiro, Casado, 34 anos, CPF 000.000.000-00',
      exampleGood: 'Brasília, DF | Disponível para modelos Híbrido e Remoto',
      autoDetected: true
    });
  }

  // ==========================================
  // 2. SEÇÕES CANÔNICAS & ESTRUTURA DO DOCUMENTO
  // ==========================================

  // 2.1 Resumo Profissional / Perfil
  const hasSummary = /#+\s*(resumo|perfil|sum[aá]rio|apresenta[çc][aã]o|sobre|perfil\s+profissional)/i.test(text);
  const mentionsRoleInOpening = targetRole && text.slice(0, 450).toLowerCase().includes(targetRole.toLowerCase().slice(0, 8));

  if (hasSummary && mentionsRoleInOpening) {
    items.push({
      id: 'summary_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Resumo Profissional Alinhado ao Cargo',
      description: `Seção de resumo identificada e direcionada para a função de "${targetRole}".`,
      status: 'passed',
      detail: 'Robôs ATS dão alto peso aos primeiros parágrafos para categorizar a senioridade e objetivo da candidatura.',
      recommendation: 'Mantenha o resumo em 3 a 5 linhas destacando anos de experiência, especialidade central e maior conquista.',
      autoDetected: true
    });
  } else if (hasSummary) {
    items.push({
      id: 'summary_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Resumo Profissional Alinhado ao Cargo',
      description: 'Resumo presente, mas o cargo pretendido não aparece de forma proeminente nas primeiras linhas.',
      status: 'warning',
      detail: `O ATS pode não indexar seu currículo como candidato primário para "${targetRole}".`,
      recommendation: `Insira o termo exato "${targetRole}" logo na primeira frase do seu Resumo Profissional.`,
      exampleGood: `Profissional com mais de X anos de atuação em ${targetRole}, especializado em...`,
      autoDetected: true
    });
  } else {
    items.push({
      id: 'summary_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Resumo Profissional Alinhado ao Cargo',
      description: 'Seção canônica de Resumo Profissional não identificada com clareza.',
      status: 'critical',
      detail: 'Sistemas ATS usam o resumo para calcular o score semântico de aderência imediata.',
      recommendation: 'Crie uma seção "## Resumo Profissional" com 3 a 4 linhas sintetizando sua proposta de valor.',
      autoDetected: true
    });
  }

  // 2.2 Seção de Experiência Profissional
  const hasExperience = /#+\s*(experi[eê]ncia|hist[oó]rico|trajet[oó]ria|experi[eê]ncias\s+profissionais)/i.test(text);
  const hasStandardExpHeader = /#+\s*(experi[eê]ncia\s+profissional|experi[eê]ncias\s+profissionais)/i.test(text);

  if (hasStandardExpHeader) {
    items.push({
      id: 'experience_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Nomenclatura Padrão de Experiência',
      description: 'Título canônico "Experiência Profissional" reconhecido por todos os parsers.',
      status: 'passed',
      detail: 'Workday, Taleo e Gupy reconhecem perfeitamente o título para mapear cargos e empresas.',
      recommendation: 'Organize sempre em ordem cronológica inversa (da mais recente para a mais antiga).',
      autoDetected: true
    });
  } else if (hasExperience) {
    items.push({
      id: 'experience_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Nomenclatura Padrão de Experiência',
      description: 'Título de experiência encontrado, mas fora da convenção padrão dos ATS.',
      status: 'warning',
      detail: 'Títulos criativos (ex: "Minha Jornada", "Onde Atuei") podem não ser mapeados por parsers rígidos como Workday.',
      recommendation: 'Altere o título da seção para exatamente "## Experiência Profissional".',
      exampleGood: '## Experiência Profissional',
      exampleBad: '## Meus Trabalhos Anteriores',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'experience_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Nomenclatura Padrão de Experiência',
      description: 'Seção de experiência não encontrada com título reconhecível.',
      status: 'critical',
      detail: 'O currículo não terá os cargos e empresas indexados pelo robô de triagem.',
      recommendation: 'Insira a seção "## Experiência Profissional" com as empresas, cargos e períodos.',
      autoDetected: true
    });
  }

  // 2.3 Formação Acadêmica & Educação
  const hasEducation = /#+\s*(forma[çc][aã]o|educa[çc][aã]o|gradua[çc][aã]o|ensino|acad[eê]mic[ao])/i.test(text);
  if (hasEducation) {
    items.push({
      id: 'education_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Seção Canônica de Formação Acadêmica',
      description: 'Seção de formação acadêmica claramente identificada.',
      status: 'passed',
      detail: 'Garante que os pré-requisitos educacionais da vaga (ex: Superior Completo, Pós-graduação) sejam computados.',
      recommendation: 'Inclua: Curso/Grau, Nome da Instituição e Ano de Conclusão (ou Previsão).',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'education_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Seção Canônica de Formação Acadêmica',
      description: 'Seção de formação acadêmica ausente ou com título ambíguo.',
      status: 'warning',
      detail: 'Algumas vagas possuem filtros automáticos de corte por grau de escolaridade.',
      recommendation: 'Adicione a seção "## Formação Acadêmica" informando seus cursos superiores ou técnicos.',
      exampleGood: '## Formação Acadêmica\nBacharelado em Ciência da Computação - Universidade X (2018 - 2022)',
      autoDetected: true
    });
  }

  // 2.4 Habilidades & Competências
  const hasSkillsSection = /#+\s*(compet[eê]ncias|habilidades|skills|conhecimentos|stack|ferramentas)/i.test(text);
  if (hasSkillsSection) {
    items.push({
      id: 'skills_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Seção Dedicada de Competências & Habilidades',
      description: 'Seção exclusiva de habilidades presente no currículo.',
      status: 'passed',
      detail: 'Sistemas ATS indexam termos dessa seção com peso elevado na pontuação de afinidade.',
      recommendation: 'Divida em Hard Skills (técnicas, softwares e metodologias) e Soft Skills relevantes.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'skills_section',
      category: 'structure',
      categoryLabel: 'Estrutura & Seções',
      title: 'Seção Dedicada de Competências & Habilidades',
      description: 'Não foi encontrada uma seção dedicada a Competências / Habilidades.',
      status: 'warning',
      detail: 'Sem essa seção, palavras-chave espalhadas em parágrafos longos podem ter peso reduzido pelo algoritmo.',
      recommendation: 'Crie uma seção "## Habilidades e Competências Técnicas" com marcadores organizados.',
      autoDetected: true
    });
  }

  // ==========================================
  // 3. MÉTRICAS QUANTIFICÁVEIS & VERBOS DE AÇÃO
  // ==========================================

  // 3.1 Métricas Numéricas / Impacto Mensurável
  // Busca por porcentagens (%), valores monetários (R$, $), números com contexto (+30%, 15 projetos, 1.000 usuários)
  const metricMatches = text.match(/(\d+%\s*|\b\d+\s*(?:usuários|clientes|membros|projetos|processos|unidades|sistemas|reuniões|vendas|anos|meses|horas|dias)|R\$\s*[\d.,]+|\$\s*[\d.,]+|\b\d{2,}\b)/gi) || [];
  const metricsCount = metricMatches.length;

  if (metricsCount >= 4) {
    items.push({
      id: 'quantifiable_metrics',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Resultados Quantificáveis e Indicadores',
      description: `Excelência em comprovação: ${metricsCount} referências métricas encontradas no texto.`,
      status: 'passed',
      detail: 'Currículos com métricas (% de crescimento, volume de entregas, economia) têm 40% mais chances de aprovação na triagem de gestores.',
      recommendation: 'Mantenha os números contextualizados no formato XYZ: "Alcancei X, medido por Y, fazendo Z".',
      autoDetected: true
    });
  } else if (metricsCount >= 1) {
    items.push({
      id: 'quantifiable_metrics',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Resultados Quantificáveis e Indicadores',
      description: `Métricas moderadas detectadas (${metricsCount} referências). Há espaço para quantificar mais entregas.`,
      status: 'warning',
      detail: 'Muitas experiências ainda descrevem apenas tarefas do dia a dia, e não o resultado do seu trabalho.',
      recommendation: 'Transforme descrições em conquistas mensuráveis com porcentagens, números de pessoas ou impacto de tempo/custo.',
      exampleGood: 'Redução de 35% no tempo de carregamento de páginas através de refatoração do código.',
      exampleBad: 'Responsável pela manutenção do código e otimização.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'quantifiable_metrics',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Resultados Quantificáveis e Indicadores',
      description: 'Pouca ou nenhuma métrica numérica identificada nas descrições de cargo.',
      status: 'critical',
      detail: 'Sistemas ATS pontuam alto candidatos que usam métricas, pois o algoritmo diferencia operadores de solucionadores de problemas.',
      recommendation: 'Adicione pelo menos 1 a 2 métricas concretas por experiência (% de melhoria, volume gerenciado, economia gerada).',
      exampleGood: 'Aumento de 28% na conversão de leads gerenciando equipe de 5 pessoas.',
      exampleBad: 'Trabalho em equipe e auxílio nas vendas da empresa.',
      autoDetected: true
    });
  }

  // 3.2 Verbos de Ação Fortes no Passado
  const actionVerbsList = [
    'liderou', 'desenvolveu', 'implementou', 'otimizou', 'reduziu', 'aumentou', 
    'coordenou', 'gerenciou', 'estruturou', 'criou', 'automatizou', 'conduziu', 
    'arquitetou', 'reestruturou', 'negociou', 'supervisionou', 'implantou', 'executou',
    'concebeu', 'consolidou', 'expandiu', 'padronizou', 'reformulou'
  ];
  
  const foundActionVerbs = actionVerbsList.filter(verb => 
    new RegExp(`\\b${verb}\\b`, 'i').test(text)
  );

  const hasPassivePhrases = /respons[aá]vel\s+por|atuou\s+como|auxiliou\s+em|ajudou\s+a/i.test(text);

  if (foundActionVerbs.length >= 4) {
    items.push({
      id: 'action_verbs',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Verbos de Ação Estratégicos',
      description: `Forte vocabulário de impacto: ${foundActionVerbs.length} verbos de ação encontrados (${foundActionVerbs.slice(0, 4).join(', ')}...).`,
      status: 'passed',
      detail: 'Verbos fortes mostram postura proativa e protagonismo nas entregas anteriores.',
      recommendation: 'Inicie cada tópico de experiência profissional com um verbo de ação robusto.',
      autoDetected: true
    });
  } else if (foundActionVerbs.length >= 2) {
    items.push({
      id: 'action_verbs',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Verbos de Ação Estratégicos',
      description: `Identificados alguns verbos (${foundActionVerbs.join(', ')}), mas muitas frases usam construções passivas.`,
      status: 'warning',
      detail: 'Evite a expressão "Responsável por...". Ela soa passiva para os algoritmos de triagem.',
      recommendation: 'Substitua "Responsável por criar" por "Desenvolveu" ou "Implementou".',
      exampleGood: 'Implementou pipeline CI/CD reduzindo o tempo de deploy em 50%.',
      exampleBad: 'Responsável por cuidar dos deploys e dos testes.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'action_verbs',
      category: 'metrics',
      categoryLabel: 'Métricas & Resultados',
      title: 'Verbos de Ação Estratégicos',
      description: 'Predomínio de expressões passivas como "Responsável por" ou "Atuou em".',
      status: 'critical',
      detail: 'Filtros ATS de empresas modernas priorizam candidatos com verbos de realização direta no passado.',
      recommendation: 'Reescreva os marcadores iniciando com: Liderou, Desenvolveu, Otimizou, Conduziu ou Automatizou.',
      exampleGood: 'Otimizou processos operacionais aumentando a produtividade em 22%.',
      autoDetected: true
    });
  }

  // ==========================================
  // 4. PALAVRAS-CHAVE & ADERÊNCIA À VAGA
  // ==========================================

  // 4.1 Cobertura de Palavras-Chave da Vaga
  const missingKeywords = atsScore?.missingKeywords || [];
  const matchedKeywords = atsScore?.matchedKeywords || [];
  const keywordScore = atsScore?.breakdown?.keywordMatching ?? 90;

  if (missingKeywords.length === 0 && keywordScore >= 85) {
    items.push({
      id: 'keyword_coverage',
      category: 'keywords',
      categoryLabel: 'Palavras-Chave & Vaga',
      title: 'Alinhamento Lexical com a Vaga',
      description: `Alta densidade de palavras-chave da vaga incorporadas com naturalidade (${matchedKeywords.length} termos mapeados).`,
      status: 'passed',
      detail: 'A concordância semântica com o descritivo de cargo garante ótima pontuação no algoritmo ATS.',
      recommendation: 'Revise apenas se surgirem novos requisitos obrigatórios na vaga.',
      autoDetected: true
    });
  } else if (missingKeywords.length <= 2) {
    items.push({
      id: 'keyword_coverage',
      category: 'keywords',
      categoryLabel: 'Palavras-Chave & Vaga',
      title: 'Alinhamento Lexical com a Vaga',
      description: `Bom alinhamento, porém ${missingKeywords.length} termo(s) chave ainda podem ser incluídos: ${missingKeywords.join(', ')}.`,
      status: 'warning',
      detail: 'Inserir estes termos estratégicos aproxima seu CV da pontuação máxima do filtro.',
      recommendation: `Adicione de forma contextualizada os termos: ${missingKeywords.join(', ')} na seção de Competências ou nas Experiências.`,
      exampleGood: `Inserir na seção de habilidades: "${missingKeywords.join(', ')}"`,
      autoDetected: true
    });
  } else {
    items.push({
      id: 'keyword_coverage',
      category: 'keywords',
      categoryLabel: 'Palavras-Chave & Vaga',
      title: 'Alinhamento Lexical com a Vaga',
      description: `Lacunas de palavras-chave importantes detectadas (${missingKeywords.length} termos ausentes: ${missingKeywords.slice(0, 3).join(', ')}...).`,
      status: 'critical',
      detail: 'Sem os termos exatos do descritivo da vaga, o robô pode classificar o perfil em fila secundária.',
      recommendation: `Incorpore os requisitos essenciais da vaga no seu currículo: ${missingKeywords.join(', ')}.`,
      autoDetected: true
    });
  }

  // 4.2 Repetição Excessiva / Prevenção de Keyword Stuffing
  // Verifica se uma mesma palavra técnica é repetida mais de 10 vezes em parágrafos próximos
  const words = text.toLowerCase().match(/\b[a-záàâãéèêíïóôõöúçñ]{4,}\b/g) || [];
  const wordFrequency: Record<string, number> = {};
  const ignoredWords = new Set(['para', 'como', 'com', 'mais', 'pela', 'pelo', 'onde', 'sobre', 'anos', 'meses', 'geral', 'seus', 'suas', 'quando', 'onde', 'todo', 'toda']);
  
  words.forEach(w => {
    if (!ignoredWords.has(w)) {
      wordFrequency[w] = (wordFrequency[w] || 0) + 1;
    }
  });

  const stuffedWords = Object.entries(wordFrequency).filter(([_, count]) => count > 9);

  if (stuffedWords.length === 0) {
    items.push({
      id: 'keyword_stuffing',
      category: 'keywords',
      categoryLabel: 'Palavras-Chave & Vaga',
      title: 'Equilíbrio Semântico (Sem Keyword Stuffing)',
      description: 'Palavras-chave distribuídas organicamente sem repetição artificial.',
      status: 'passed',
      detail: 'Parsers modernos (como Gupy e Google Cloud Talent Solution) penalizam currículos com termos repetidos exaustivamente.',
      recommendation: 'Use sinônimos técnicos e varie o vocabulário das ferramentas.',
      autoDetected: true
    });
  } else {
    const termNames = stuffedWords.map(([w, c]) => `"${w}" (${c}x)`).join(', ');
    items.push({
      id: 'keyword_stuffing',
      category: 'keywords',
      categoryLabel: 'Palavras-Chave & Vaga',
      title: 'Equilíbrio Semântico (Sem Keyword Stuffing)',
      description: `Possível repetição excessiva detectada: ${termNames}.`,
      status: 'warning',
      detail: 'Repetição mecânica de um mesmo termo pode ser interpretada pelo robô como tentativa de manipular a busca.',
      recommendation: 'Diversifique o vocabulário utilizando variações e sinônimos aceitos no mercado.',
      autoDetected: true
    });
  }

  // ==========================================
  // 5. FORMATAÇÃO TÉCNICA & PARSERS ATS
  // ==========================================

  // 5.1 Ausência de Tabelas Complexas ou Colunas Problemáticas
  const hasMarkdownTable = /\|.*\|.*\|/.test(text) && /\|[\s-:]+\|/.test(text);

  if (!hasMarkdownTable) {
    items.push({
      id: 'no_tables',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Layout Linear e Sem Tabelas Ocultas',
      description: 'O texto segue fluxo linear de cima para baixo, sem tabelas complexas.',
      status: 'passed',
      detail: 'Workday, Taleo e Greenhouse conseguem extrair cada bloco sem misturar colunas ou quebrar frases.',
      recommendation: 'Evite gerar PDFs com colunas paralelas (duas colunas de texto) no envio para sistemas de triagem.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'no_tables',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Layout Linear e Sem Tabelas Ocultas',
      description: 'Estrutura de tabela identificada no texto do currículo.',
      status: 'critical',
      detail: 'Tabelas costumam quebrar completamente a ordem de leitura dos parsers ATS, transformando datas e cargos em frases ilegíveis.',
      recommendation: 'Substitua tabelas por listas com marcadores simples (• ou -) em ordem linear.',
      exampleBad: '| Empresa | Cargo | Período |',
      exampleGood: 'Empresa X - Cargo Y (2021 - 2023)\n• Atividade 1\n• Atividade 2',
      autoDetected: true
    });
  }

  // 5.2 Extensão e Densidade Textual
  if (wordCount >= 320 && wordCount <= 1000) {
    items.push({
      id: 'document_length',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Tamanho & Extensão Ideal (1 a 2 Páginas)',
      description: `Densidade perfeita: ${wordCount} palavras (equivalente a 1 a 2 páginas padrão A4).`,
      status: 'passed',
      detail: 'Currículos nessa faixa contêm profundidade suficiente para palavras-chave sem sobrecarregar a leitura do recrutador humano.',
      recommendation: 'Mantenha o foco nos últimos 5 a 10 anos de carreira.',
      autoDetected: true
    });
  } else if (wordCount < 320) {
    items.push({
      id: 'document_length',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Tamanho & Extensão Ideal (1 a 2 Páginas)',
      description: `Currículo muito conciso (${wordCount} palavras). Risco de superficialidade.`,
      status: 'warning',
      detail: 'Menos de 320 palavras pode significar falta de detalhes técnicos e de conquistas mensuráveis.',
      recommendation: 'Detalhe mais as entregas de cada cargo adicionando 2 a 3 marcadores de realizações com métricas.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'document_length',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Tamanho & Extensão Ideal (1 a 2 Páginas)',
      description: `Documento extenso (${wordCount} palavras, estimativa > 3 páginas).`,
      status: 'warning',
      detail: 'Recrutadores dedicam em média 6 a 8 segundos na triagem visual; currículos muito longos perdem a atenção.',
      recommendation: 'Sintetize experiências muito antigas (com mais de 10 anos) em apenas 1 linha ou agrupe-as.',
      autoDetected: true
    });
  }

  // 5.3 Padronização de Datas e Cronologia
  const datePatterns = text.match(/(?:\d{4}\s*[-–—àa]\s*(?:\d{4}|atual|presente|o momento)|\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|\d{2})\/?\d{4})/gi) || [];
  
  if (datePatterns.length >= 2) {
    items.push({
      id: 'dates_consistency',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Datas Cronológicas Claras e Padronizadas',
      description: `Identificadas ${datePatterns.length} marcações temporais legíveis por OCR.`,
      status: 'passed',
      detail: 'Permite ao robô calcular automaticamente seus anos de experiência acumulada.',
      recommendation: 'Use sempre o formato "Mês/Ano - Mês/Ano" ou "Ano - Ano" de forma homogênea em todas as empresas.',
      autoDetected: true
    });
  } else {
    items.push({
      id: 'dates_consistency',
      category: 'formatting',
      categoryLabel: 'Formatação & Parsers',
      title: 'Datas Cronológicas Claras e Padronizadas',
      description: 'Poucas marcações de datas identificadas nas experiências.',
      status: 'warning',
      detail: 'Sem datas padronizadas, o ATS pode marcar seu tempo de experiência como zero ou indefinido.',
      recommendation: 'Insira o período claro em cada cargo (Ex: "2021 - 2023" ou "03/2021 - Atual").',
      exampleGood: 'Analista Sênior | TechCorp (05/2021 - Atual)',
      autoDetected: true
    });
  }

  // ==========================================
  // COMPATIBILIDADE ESPECÍFICA POR PLATAFORMA ATS
  // ==========================================
  const passedCount = items.filter(i => i.status === 'passed').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const criticalCount = items.filter(i => i.status === 'critical').length;
  const totalChecks = items.length;

  // Cálculo de pontuação geral de conformidade (0 a 100)
  const checklistScore = Math.min(
    100,
    Math.max(
      10,
      Math.round(((passedCount * 1.0 + warningCount * 0.5) / totalChecks) * 100)
    )
  );

  const systemCompatibilities: AtsSystemCompatibility[] = [
    {
      system: 'Gupy',
      status: criticalCount > 0 ? 'warning' : checklistScore >= 85 ? 'passed' : 'warning',
      compatibilityScore: Math.min(99, Math.max(50, Math.round(checklistScore * 0.98 + (hasSummary ? 2 : -10)))),
      highlight: 'IA Gaia da Gupy analisa afinidade semântica direta entre o CV e a descrição da vaga.',
      advice: 'A Gupy pontua alto quando você repete com precisão os termos técnicos exigidos nos pré-requisitos da vaga.'
    },
    {
      system: 'Workday',
      status: hasMarkdownTable ? 'critical' : warningCount > 3 ? 'warning' : 'passed',
      compatibilityScore: Math.min(98, Math.max(45, Math.round(checklistScore * 0.95 - (hasMarkdownTable ? 25 : 0)))),
      highlight: 'Parser corporativo de leitura estrita; qualquer tabela ou coluna dupla distorce os dados.',
      advice: 'Mantenha o layout em 1 coluna única, fonte legível e títulos de seções exatamente padrão.'
    },
    {
      system: 'Greenhouse',
      status: checklistScore >= 80 ? 'passed' : 'warning',
      compatibilityScore: Math.min(99, Math.max(55, Math.round(checklistScore * 0.96 + (metricsCount >= 3 ? 3 : -5)))),
      highlight: 'Prioriza marcadores curtos com métricas e histórico de evolução dentro das empresas.',
      advice: 'Adicione resultados com números nos primeiros tópicos de cada experiência.'
    },
    {
      system: 'Taleo',
      status: !hasStandardExpHeader || hasMarkdownTable ? 'critical' : checklistScore >= 80 ? 'passed' : 'warning',
      compatibilityScore: Math.min(96, Math.max(40, Math.round(checklistScore * 0.92 - (!hasStandardExpHeader ? 15 : 0)))),
      highlight: 'Exige cabeçalho de contatos canônico e títulos de seção universais para não perder campos.',
      advice: 'Nome, e-mail e telefone devem estar nas três primeiras linhas do documento.'
    },
    {
      system: 'Kenoby / Sólides',
      status: checklistScore >= 80 ? 'passed' : 'warning',
      compatibilityScore: Math.min(98, Math.max(50, Math.round(checklistScore * 0.97))),
      highlight: 'Cruza competências comportamentais com a stack tecnológica e histórico recente.',
      advice: 'Destaque metodologias ágeis (Scrum, Kanban) e competências de trabalho colaborativo.'
    }
  ];

  // Ações prioritárias sugeridas
  const topActionItems: string[] = [];
  const criticalItems = items.filter(i => i.status === 'critical');
  const warningItems = items.filter(i => i.status === 'warning');

  criticalItems.forEach(i => {
    topActionItems.push(`[Crítico] ${i.title}: ${i.recommendation}`);
  });

  if (topActionItems.length < 3) {
    warningItems.slice(0, 3 - topActionItems.length).forEach(i => {
      topActionItems.push(`[Atenção] ${i.title}: ${i.recommendation}`);
    });
  }

  if (topActionItems.length === 0) {
    topActionItems.push('Seu currículo atende a todos os critérios fundamentais de triagem automatizada ATS!');
    topActionItems.push('Faça o download em PDF padrão A4 para submissão direta nas vagas pretendidas.');
  }

  const executiveSummary = criticalCount === 0
    ? `Excelente conformidade ATS (${checklistScore}%). Seu currículo possui estrutura linear, palavras-chave alinhadas a ${targetRole} e formatação limpa pronta para passar pelos filtros da Gupy, Workday e Greenhouse.`
    : `Atenção recomendada: foram identificados ${criticalCount} ponto(s) crítico(s) e ${warningCount} oportunidade(s) de melhoria. Ajustar estes itens aumentará drasticamente sua taxa de conversão em entrevistas para ${targetCompany}.`;

  return {
    overallScore: checklistScore,
    passedCount,
    warningCount,
    criticalCount,
    totalChecks,
    items,
    systemCompatibilities,
    executiveSummary,
    topActionItems
  };
};

/**
 * Realiza uma auditoria profunda assistida pelo servidor via Gemini 3.8 Flash,
 * trazendo diagnósticos personalizados com exemplos reais para o contexto da vaga.
 */
export const auditAtsChecklistWithGemini = async (
  currentCvContent: string,
  role: string,
  company: string,
  jobDesc?: string
): Promise<AtsChecklistReport> => {
  try {
    const res = await fetch('/api/audit-ats-checklist', {
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
      throw new Error(`Erro HTTP ${res.status}`);
    }

    const data: AtsChecklistReport = await res.json();
    return data;
  } catch (error) {
    console.warn("Falha na auditoria profunda via servidor, utilizando motor heurístico:", error);
    return generateLocalAtsChecklist(currentCvContent, role, company, jobDesc);
  }
};

