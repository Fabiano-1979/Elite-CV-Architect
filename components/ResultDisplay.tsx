import React, { useState, useEffect } from 'react';
import { OptimizationResult, InterviewQuestion, AtsScoreDetails } from '../types';
import { InterviewQuestions } from './InterviewQuestions';
import { InterviewSimulator } from './InterviewSimulator';
import { AtsScoreMeter } from './AtsScoreMeter';
import { AtsComplianceRadarPanel } from './AtsComplianceRadarPanel';
import { SkillsRadarChart } from './SkillsRadarChart';
import { ExpertCareerTips } from './ExpertCareerTips';
import { PdfExportModal } from './PdfExportModal';
import { AtsCompatibilityChecklist } from './AtsCompatibilityChecklist';
import { 
  FileText, 
  HelpCircle, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Sparkles,
  CheckCircle2,
  Target,
  FileCheck,
  Mic,
  Zap,
  Play,
  Radar,
  FileCode,
  FileType,
  Share2,
  Lightbulb,
  Compass,
  Award,
  ArrowRight,
  ClipboardCheck,
  ShieldCheck,
  Loader2,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';


interface ResultDisplayProps {
  result: OptimizationResult | null;
  jobDescription?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, jobDescription }) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'checklist' | 'interview' | 'simulator' | 'tips'>('cv');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedPlainText, setCopiedPlainText] = useState(false);
  const [downloadedMd, setDownloadedMd] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Estado local para permitir edição do conteúdo do currículo
  const [editableContent, setEditableContent] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [atsScore, setAtsScore] = useState<AtsScoreDetails | undefined>(result?.atsScore);
  const [radarView, setRadarView] = useState<'compliance' | 'skills'>('compliance');

  // Atualiza o conteúdo editável quando o resultado da IA muda
  useEffect(() => {
    if (result?.content) {
      setEditableContent(result.content);
    }
    if (result?.interviewQuestions) {
      setInterviewQuestions(result.interviewQuestions);
    }
    if (result?.atsScore) {
      setAtsScore(result.atsScore);
    }
  }, [result]);

  if (!result) return null;

  // Função para converter Markdown para Texto Puro limpo (sem #, **, etc.)
  const stripMarkdown = (mdText: string): string => {
    return mdText
      .replace(/^#{1,6}\s+/gm, '') // Remove cabeçalhos #, ##, etc.
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove negrito **texto**
      .replace(/\*(.*?)\*/g, '$1') // Remove itálico *texto*
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove blocos de código inline
      .replace(/^\s*[-*+]\s+/gm, '• ') // Converte bullets para bullet limpo •
      .replace(/^\s*\d+\.\s+/gm, (match) => match) // Mantém números
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Formata links
      .replace(/---+/g, '-----------------------------') // Limpa divisores
      .trim();
  };

  // Copia o formato Markdown (.md) na íntegra com formatações
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(editableContent);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  // Copia como Texto Puro Limpo (Plain Text)
  const handleCopyPlainText = () => {
    const plain = stripMarkdown(editableContent);
    navigator.clipboard.writeText(plain);
    setCopiedPlainText(true);
    setTimeout(() => setCopiedPlainText(false), 2500);
  };

  // Permite baixar o arquivo .md diretamente para uso local
  const handleDownloadMarkdown = () => {
    const roleSlug = (result.targetRole || "Curriculo")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);
    const fileName = `${roleSlug}_otimizado.md`;
    const blob = new Blob([editableContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    setDownloadedMd(true);
    setTimeout(() => setDownloadedMd(false), 2000);
  };

  // Exportação direta em PDF profissional utilizando a biblioteca html2pdf.js já incluída
  const handleDownloadPDF = async () => {
    if (!window.html2pdf || !window.marked) {
      alert("A biblioteca de geração de PDF ainda está sendo carregada. Por favor, aguarde alguns instantes e tente novamente.");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      // Separa o conteúdo do currículo de possíveis notas/dicas estratégicas para manter o PDF limpo
      const separatorRegex = /(?:---+|\*\*\*+)?\s*(?:#{1,6}\s*)?(?:\*\*)?(?:🏆\s*)?(?:DICAS DE OURO|Dicas de Ouro|ANÁLISE ESTRATÉGICA|Análise Estratégica)/i;
      const matchIndex = editableContent.search(separatorRegex);
      const cvMarkdown = matchIndex !== -1 ? editableContent.substring(0, matchIndex).trim() : editableContent.trim();

      const parsedHtml = window.marked.parse(cvMarkdown);

      // Elemento temporário anexado ao body para renderização fiel dos estilos e medições do html2canvas
      const container = document.createElement('div');
      container.id = 'direct-pdf-render-box';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // 210mm a 96DPI (padrão A4)
      container.style.backgroundColor = '#ffffff';
      container.style.boxSizing = 'border-box';
      container.style.padding = '38px 44px';
      container.style.color = '#1e293b';

      const role = result.targetRole || 'Profissional';
      const company = result.targetCompany || 'Empresa';
      const currentScore = atsScore?.overallScore ?? 92;

      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-cv-box {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #1e293b;
        }
        .pdf-cv-box h1 {
          font-size: 21pt;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 4px;
          line-height: 1.15;
          letter-spacing: -0.5px;
          page-break-after: avoid;
        }
        .pdf-cv-box h2 {
          font-size: 11.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #1e3a8a;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 3.5px;
          margin-top: 15px;
          margin-bottom: 7px;
          page-break-after: avoid;
        }
        .pdf-cv-box h3 {
          font-size: 10.5pt;
          font-weight: 600;
          color: #0f172a;
          margin-top: 9px;
          margin-bottom: 3px;
          page-break-after: avoid;
        }
        .pdf-cv-box p {
          margin-top: 0;
          margin-bottom: 6px;
          font-size: 9.5pt;
          color: #334155;
          line-height: 1.48;
          text-align: justify;
        }
        .pdf-cv-box ul, .pdf-cv-box ol {
          margin-top: 2px;
          margin-bottom: 7px;
          padding-left: 17px;
        }
        .pdf-cv-box li {
          font-size: 9.5pt;
          color: #334155;
          margin-bottom: 3.5px;
          line-height: 1.45;
          page-break-inside: avoid;
        }
        .pdf-cv-box strong, .pdf-cv-box b {
          font-weight: 600;
          color: #0f172a;
        }
        .pdf-cv-box a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .pdf-cv-box hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 14px 0;
        }
        .pdf-footer {
          margin-top: 22px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7.5pt;
          color: #64748b;
          page-break-inside: avoid;
        }
        .pdf-score-tag {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          background-color: #dbeafe;
          color: #1e40af;
          font-weight: 700;
          font-size: 7.5pt;
        }
      `;

      container.innerHTML = `
        <div class="pdf-cv-box">
          <div class="pdf-body">
            ${parsedHtml}
          </div>
          <div class="pdf-footer">
            <span>Currículo Otimizado para <strong>${role}</strong> • <strong>${company}</strong></span>
            <div>
              <span class="pdf-score-tag">ATS Score: ${currentScore}/100</span>
              <span style="margin-left: 6px;">Elite CV Architect</span>
            </div>
          </div>
        </div>
      `;

      container.appendChild(styleElement);
      document.body.appendChild(container);

      const safeRole = role.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const safeFilename = `Curriculo_${safeRole}_otimizado.pdf`;

      const opt = {
        margin: [10, 10, 10, 10], // 10mm de margens A4
        filename: safeFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      await window.html2pdf().set(opt).from(container).save();

      // Limpeza do elemento temporário
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err: any) {
      console.error("Erro na exportação do PDF com html2pdf.js:", err);
      setPdfError("Ocorreu um erro ao gerar o PDF. Você também pode abrir o assistente de exportação.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const questionCount = interviewQuestions.length;
  const currentOverallScore = atsScore?.overallScore ?? 92;

  return (
    <div className="space-y-6">
      {/* Aviso informativo elegante se o modo resiliente foi ativado */}
      {result.isQuotaLimited && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-amber-900 shadow-xs flex items-start gap-3 animate-fade-in-up">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Zap className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-amber-950">
                Motor Resiliente ATS Ativo
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-200/70 text-amber-900 rounded-full">
                Conformidade Total
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {result.notice || "Otimização estruturada com base no motor de alta precisão ATS devido a limites temporários de cota da API externa. Todos os recursos, incluindo o Gráfico de Radar de Conformidade ATS, Editor, Simulação de Entrevista e Download em PDF, estão 100% disponíveis."}
            </p>
          </div>
        </div>
      )}

      {/* Painel Analítico ATS e Gráfico de Radar de Competências */}
      <section className="animate-fade-in-up space-y-6">
        <AtsScoreMeter
          scoreDetails={atsScore}
          currentCvText={editableContent}
          targetRole={result.targetRole || "Cargo Alvo"}
          targetCompany={result.targetCompany || "Empresa Alvo"}
          jobDescription={jobDescription}
          onScoreUpdated={(newScore) => setAtsScore(newScore)}
          onOpenChecklist={() => setActiveTab('checklist')}
        />

        {/* Seletor do Painel de Visualização com Gráfico de Radar (Recharts) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 px-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Radar className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Painel Analítico de Radar • Conformidade ATS & Habilidades
              </span>
              <span className="text-[11px] text-slate-500">
                Visualize os eixos de triagem de robôs ATS ou o alinhamento de competências da vaga
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-stretch sm:self-auto border border-slate-200/60">
            <button
              type="button"
              onClick={() => setRadarView('compliance')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                radarView === 'compliance'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Conformidade ATS (7 Eixos)
            </button>
            <button
              type="button"
              onClick={() => setRadarView('skills')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                radarView === 'skills'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Competências do Cargo
            </button>
          </div>
        </div>

        {/* Renderização do Painel de Gráfico de Radar via Recharts */}
        {radarView === 'compliance' ? (
          <AtsComplianceRadarPanel
            scoreDetails={atsScore}
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
            jobDescription={jobDescription}
          />
        ) : (
          <SkillsRadarChart
            scoreDetails={atsScore}
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
          />
        )}
      </section>

      {/* Abas de Navegação Principal */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/80 shadow-sm max-w-4xl mx-auto">
        <button
          onClick={() => setActiveTab('cv')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all
            ${activeTab === 'cv'
              ? 'bg-white text-indigo-700 shadow-md ring-1 ring-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Currículo</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 min-w-[145px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative
            ${activeTab === 'checklist'
              ? 'bg-white text-emerald-800 shadow-md ring-1 ring-emerald-400/80'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
        >
          <ClipboardCheck className={`w-4 h-4 shrink-0 ${activeTab === 'checklist' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span>Checklist ATS</span>
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-md ${
            activeTab === 'checklist' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            Auditoria
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative
            ${activeTab === 'tips'
              ? 'bg-white text-amber-900 shadow-md ring-1 ring-amber-300/80'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
        >
          <Lightbulb className={`w-4 h-4 shrink-0 ${activeTab === 'tips' ? 'text-amber-500 fill-amber-400' : 'text-amber-600'}`} />
          <span>Dica do Especialista</span>
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-md ${
            activeTab === 'tips' ? 'bg-amber-100 text-amber-800' : 'bg-amber-100/80 text-amber-700'
          }`}>
            Guia
          </span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex-1 min-w-[125px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative
            ${activeTab === 'interview'
              ? 'bg-white text-indigo-700 shadow-md ring-1 ring-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Perguntas ({questionCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 min-w-[135px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative
            ${activeTab === 'simulator'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md ring-1 ring-indigo-500'
              : 'text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 hover:text-indigo-950 font-bold border border-indigo-200/60'
            }`}
        >
          <Mic className="w-4 h-4 shrink-0" />
          <span>Simulação</span>
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-md ${
            activeTab === 'simulator' ? 'bg-white/20 text-emerald-200' : 'bg-indigo-600 text-white'
          }`}>
            STAR
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba: Checklist de Compatibilidade ATS */}
      {activeTab === 'checklist' && (
        <section className="animate-fade-in-up">
          <AtsCompatibilityChecklist
            currentCvText={editableContent}
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
            jobDescription={jobDescription}
            atsScore={atsScore}
            onGoToEditor={() => setActiveTab('cv')}
          />
        </section>
      )}

      {/* Conteúdo da Aba: Dica do Especialista de Carreira */}
      {activeTab === 'tips' && (
        <section className="animate-fade-in-up">
          <ExpertCareerTips
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
            jobDescription={jobDescription}
            currentCvText={editableContent}
            initialAdvice={result.careerAdvice}
          />
        </section>
      )}

      {/* Conteúdo da Aba: Simulação Interativa de Entrevista */}
      {activeTab === 'simulator' && (
        <section className="animate-fade-in-up">
          <InterviewSimulator
            questions={interviewQuestions}
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
            jobDescription={jobDescription}
          />
        </section>
      )}

      {/* Conteúdo da Aba: Perguntas de Entrevista */}
      {activeTab === 'interview' && (
        <section className="animate-fade-in-up">
          <InterviewQuestions
            questions={interviewQuestions}
            targetRole={result.targetRole || "Cargo Alvo"}
            targetCompany={result.targetCompany || "Empresa Alvo"}
            jobDescription={jobDescription}
            onStartSimulation={() => setActiveTab('simulator')}
            onUpdateQuestions={(newQuestions) => setInterviewQuestions(newQuestions)}
          />
        </section>
      )}

      {/* Conteúdo da Aba: Currículo Otimizado */}
      {activeTab === 'cv' && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 animate-fade-in-up space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                Currículo Estratégico Otimizado
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Personalizado para {result.targetRole || "seu cargo"} na {result.targetCompany || "empresa pretendida"} • Score ATS: <strong className="text-emerald-600 font-bold">{currentOverallScore}/100</strong>
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Botão 'Download em PDF' utilizando html2pdf.js */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 group ${
                  pdfDownloaded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-75 disabled:cursor-not-allowed'
                }`}
                title="Exportar currículo otimizado formatado em PDF via html2pdf.js"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                    <span>Gerando PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <Check className="h-4 w-4 text-white shrink-0" />
                    <span>PDF Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    <span>Download em PDF</span>
                    <span className="text-[10px] bg-white/20 text-indigo-50 font-bold px-1.5 py-0.2 rounded-md">
                      A4
                    </span>
                  </>
                )}
              </button>

              {/* Botão Auxiliar para Personalizar Temas do PDF */}
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 shadow-xs"
                title="Personalizar temas (Executivo, Minimalista, Tech) e opções do PDF"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Opções PDF</span>
              </button>

              {/* Botão: Copiar Markdown (.md) */}
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm ${
                  copiedMarkdown 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/30' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900 active:scale-95'
                }`}
                title="Copiar em formato Markdown (.md) com negritos, títulos e marcadores preservados"
              >
                {copiedMarkdown ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Markdown Copiado!</span>
                  </>
                ) : (
                  <>
                    <FileCode className="h-4 w-4 text-indigo-300 shrink-0" />
                    <span>Copiar Markdown</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1 py-0.2 rounded font-mono">
                      .md
                    </span>
                  </>
                )}
              </button>

              {/* Botão: Copiar Texto Limpo (Sem sintaxe Markdown) */}
              <button
                type="button"
                onClick={handleCopyPlainText}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  copiedPlainText 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/30' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 active:scale-95'
                }`}
                title="Copiar como texto limpo desprovido de símbolos markdown (ideal para formulários simples)"
              >
                {copiedPlainText ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span>Texto Simples</span>
                  </>
                )}
              </button>

              {/* Botão: Baixar arquivo .md */}
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className={`hidden lg:flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  downloadedMd
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300 active:scale-95'
                }`}
                title="Salvar arquivo .md no seu computador para Notion, Obsidian ou VS Code"
              >
                {downloadedMd ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Salvo .md</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>.md</span>
                  </>
                )}
              </button>

              {/* Botão de Atalho para Perguntas */}
              {questionCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('interview')}
                  className="hidden xl:flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Perguntas ({questionCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Destaque: Checklist de Compatibilidade ATS */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-indigo-50/50 border border-emerald-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shrink-0 shadow-sm">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-900">
                    Checklist de Compatibilidade ATS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Gupy, Workday & Greenhouse
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Valide 14 critérios essenciais de triagem (contatos sem dados sensíveis, métricas quantitativas, verbos de ação e layout linear).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
            >
              <span>Abrir Checklist ATS</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
            </button>
          </div>

          {/* Card Destaque: Dica do Especialista para o Cargo */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-50/50 border border-amber-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shrink-0 shadow-sm">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-900">
                    Dica do Especialista de Carreira
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {result.targetRole || "Cargo Alvo"}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Consulte orientações exclusivas de posicionamento, vocabulário magnético e perguntas estratégicas para este cargo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('tips')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
            >
              <span>Ver Orientações Completas</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Barra de Informação de Formatação Markdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px] border border-indigo-200">
                Markdown (.md)
              </span>
              <span>
                Formato padrão com títulos (<code>#</code>), negrito (<code>**</code>) e tópicos estruturados.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Compatível com: <strong>Notion</strong>, <strong>Obsidian</strong>, <strong>GitHub</strong>, <strong>Gupy</strong> e <strong>Word</strong></span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-2 right-4 text-xs text-slate-400 pointer-events-none bg-slate-100/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200/80 shadow-xs">
              Modo Editor: Você pode alterar e ajustar o texto abaixo
            </div>
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-[600px] p-6 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto"
            />
          </div>

          {/* Barra de Ações Rápidas no Rodapé do Editor */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Layout limpo em padrão A4, sem tabelas complexas para máxima leitura por robôs de triagem (ATS).</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  pdfDownloaded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-75 disabled:cursor-not-allowed'
                }`}
                title="Download em PDF formatado com html2pdf.js"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Gerando PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>PDF Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span>Download em PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all"
              >
                {copiedMarkdown ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copiar Markdown</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {pdfError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{pdfError}</span>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="font-bold underline hover:text-red-900"
              >
                Abrir Assistente de PDF
              </button>
            </div>
          )}

          {result.groundingMetadata && result.groundingMetadata.groundingChunks && result.groundingMetadata.groundingChunks.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                Fontes da Pesquisa Corporativa & Web
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.groundingMetadata.groundingChunks.map((chunk, idx) => 
                  chunk.web ? (
                    <a 
                      key={idx} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors truncate max-w-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Portais de Vagas Recomendados */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-500" />
              Portais de Vagas Recomendados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a 
                href="https://portal.gupy.io/job-search?state=Distrito%20Federal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 group"
              >
                <span className="font-bold text-sm group-hover:underline">Portal Gupy (DF)</span>
                <span className="text-xs text-blue-500 mt-1">portal.gupy.io</span>
              </a>
              
              <a 
                href="https://www.horadoempregodf.com.br/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-all border border-orange-200 group"
              >
                <span className="font-bold text-sm group-hover:underline">Hora do Emprego DF</span>
                <span className="text-xs text-orange-500 mt-1">horadoempregodf.com.br</span>
              </a>

              <a 
                href="https://vagas.solides.com.br/vagas/brasilia-df" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all border border-purple-200 group"
              >
                <span className="font-bold text-sm group-hover:underline">Vagas Sólides (DF)</span>
                <span className="text-xs text-purple-500 mt-1">vagas.solides.com.br</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração e Download do PDF Profissional */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        editableContent={editableContent}
        targetRole={result.targetRole || "Cargo Alvo"}
        targetCompany={result.targetCompany || "Empresa Alvo"}
        atsScore={atsScore?.overallScore}
      />
    </div>
  );
};

