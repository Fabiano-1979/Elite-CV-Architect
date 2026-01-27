import { GoogleGenAI } from "@google/genai";
import { OptimizationResult } from "../types";

const PROMPT_TEMPLATE = (cv: string, company: string, role: string, jobDesc: string, linkedin: string, github: string) => `
Atue como uma inteligência artificial de elite, especializada em Recrutamento e Seleção (RH) e Coaching de Alta Performance de Carreira. Sua missão é transformar um currículo comum em um documento de alto impacto, personalizado para a empresa ${company} e o cargo de ${role}.

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

SEU FLUXO DE TRABALHO (INTERNO):
Passo 1: Pesquisa de Campo & Análise de Vaga e Perfis:
- **Descrição da Vaga:** Se houver LINK, acesse. Se for TEXTO, analise. Extraia keywords críticas (hard/soft skills).
- **Perfis Sociais:** Se foram fornecidas URLs de LinkedIn ou GitHub:
    - OBRIGATÓRIO: Incluir estes links formatados profissionalmente no CABEÇALHO do currículo.
    - OBRIGATÓRIO: Use a ferramenta de busca (Google Search) para tentar encontrar informações públicas recentes nesses perfis (ex: stacks em repositórios recentes do GitHub, resumo atualizado no LinkedIn) que possam não estar no texto original do CV. Use isso para enriquecer a seção de Habilidades.
- **Empresa:** Pesquise cultura, valores e missão da ${company}.

Passo 2: Análise Comparativa (Gap Analysis):
- Cruze o currículo + dados dos perfis sociais (se houver) com os requisitos da vaga.
- Identifique lacunas e reformule experiências.

Passo 3: Redação Estratégica:
- Resumo Profissional focado em resolução de problemas da vaga.
- Seção de Habilidades robusta logo após o resumo.
- Verbos de ação e métricas.

DIRETRIZES DE SAÍDA:
- O currículo deve ser entregue em formato de texto Markdown perfeitamente editado.
- **A estrutura deve seguir a ordem: Cabeçalho (com Links de LinkedIn/Github se existirem) > Resumo Profissional > Habilidades > Experiência Profissional > Formação Acadêmica > Idiomas/Outros.**
- Use um layout limpo, moderno e profissional.
- Otimize para ATS.

**IMPORTANTE - DICAS DE OURO (Sessão Final):**
Após concluir o currículo, pule duas linhas, insira um separador (---) e crie uma seção exclusiva intitulada "**🏆 DICAS DE OURO & ANÁLISE ESTRATÉGICA**".
Nesta seção, forneça ao candidato:
1. **Otimização ATS:** Liste 3-5 palavras-chave críticas que foram inseridas e por quê.
2. **Cultura Fit:** Uma dica específica de como se comportar na entrevista considerando a cultura da ${company}.
3. **Análise de Presença Online:** Se LinkedIn ou GitHub foram fornecidos, dê uma dica rápida de como melhorá-los para essa vaga específica (ex: "Fixe o repositório X no seu GitHub" ou "Atualize seu título no LinkedIn para Y").
4. **Ponto de Melhoria:** Se houver qualificação faltante, sugira como abordar.

TOM DE VOZ: Profissional, confiante, estratégico e alinhado com a cultura da ${company}.
`;

export const optimizeCV = async (
  cvText: string,
  company: string,
  role: string,
  jobDesc: string,
  linkedinUrl?: string,
  githubUrl?: string
): Promise<OptimizationResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash which works well with tools like Google Search
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

    const text = response.text || "Não foi possível gerar o currículo. Tente novamente.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    return {
      content: text,
      groundingMetadata,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao comunicar com a IA de Recrutamento.");
  }
};