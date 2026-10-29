import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Check, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Palette, 
  Briefcase, 
  Building2,
  AlertCircle
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editableContent: string;
  targetRole: string;
  targetCompany: string;
  atsScore?: number;
}

export type PdfTheme = 'executive' | 'minimalist' | 'tech';
export type PdfExportType = 'recruiter' | 'full';

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  editableContent,
  targetRole,
  targetCompany,
  atsScore = 92
}) => {
  const [theme, setTheme] = useState<PdfTheme>('executive');
  const [exportType, setExportType] = useState<PdfExportType>('recruiter');
  const [includeAtsBadge, setIncludeAtsBadge] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const defaultFileName = `Curriculo_${(targetRole || "Profissional").replace(/[^a-zA-Z0-9]/g, '_')}_${(targetCompany || "Alvo").replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const [fileName, setFileName] = useState<string>(defaultFileName);

  if (!isOpen) return null;

  // Separa o corpo do currículo da seção de Dicas de Ouro
  const splitCvContent = (rawText: string) => {
    const separatorRegex = /(?:---+|\*\*\*+)?\s*(?:#{1,6}\s*)?(?:\*\*)?(?:🏆\s*)?(?:DICAS DE OURO|Dicas de Ouro|ANÁLISE ESTRATÉGICA|Análise Estratégica)/i;
    const match = rawText.search(separatorRegex);

    if (match !== -1) {
      return {
        cvText: rawText.substring(0, match).trim(),
        tipsText: rawText.substring(match).trim()
      };
    }

    return {
      cvText: rawText.trim(),
      tipsText: ''
    };
  };

  const getThemeColors = (t: PdfTheme) => {
    switch (t) {
      case 'minimalist':
        return {
          primary: '#0f172a',
          secondary: '#475569',
          border: '#94a3b8',
          accentBg: '#f8fafc',
          badgeText: '#0f172a',
          badgeBg: '#e2e8f0'
        };
      case 'tech':
        return {
          primary: '#047857',
          secondary: '#059669',
          border: '#10b981',
          accentBg: '#ecfdf5',
          badgeText: '#065f46',
          badgeBg: '#d1fae5'
        };
      case 'executive':
      default:
        return {
          primary: '#1e3a8a',
          secondary: '#2563eb',
          border: '#3b82f6',
          accentBg: '#eff6ff',
          badgeText: '#1e40af',
          badgeBg: '#dbeafe'
        };
    }
  };

  const handleGeneratePdf = async () => {
    if (!window.html2pdf || !window.marked) {
      setNotification({
        type: 'error',
        message: 'Bibliotecas de geração de PDF ainda não foram carregadas. Atualize a página e tente novamente.'
      });
      return;
    }

    setIsGenerating(true);
    setNotification(null);

    try {
      const colors = getThemeColors(theme);
      const { cvText, tipsText } = splitCvContent(editableContent);

      const targetCvMarkdown = exportType === 'recruiter' ? cvText : cvText;
      const cvHtml = window.marked.parse(targetCvMarkdown);
      const tipsHtml = (exportType === 'full' && tipsText) ? window.marked.parse(tipsText) : '';

      // Cria container invisível temporário anexado ao body para renderização fiel de estilos
      const container = document.createElement('div');
      container.id = 'temp-pdf-render-box';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // 210mm a 96DPI (A4)
      container.style.backgroundColor = '#ffffff';
      container.style.boxSizing = 'border-box';
      container.style.padding = '38px 44px';
      container.style.color = '#1e293b';

      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .pdf-wrapper {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #1e293b;
        }

        /* Títulos */
        .pdf-wrapper h1 {
          font-size: 21pt;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 4px;
          line-height: 1.15;
          letter-spacing: -0.5px;
          page-break-after: avoid;
        }

        .pdf-wrapper h2 {
          font-size: 11.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: ${colors.primary};
          border-bottom: 2px solid ${colors.border};
          padding-bottom: 3.5px;
          margin-top: 15px;
          margin-bottom: 7px;
          page-break-after: avoid;
        }

        .pdf-wrapper h3 {
          font-size: 10.5pt;
          font-weight: 600;
          color: #0f172a;
          margin-top: 9px;
          margin-bottom: 3px;
          page-break-after: avoid;
        }

        .pdf-wrapper p {
          margin-top: 0;
          margin-bottom: 6px;
          font-size: 9.5pt;
          color: #334155;
          line-height: 1.48;
          text-align: justify;
        }

        .pdf-wrapper ul, .pdf-wrapper ol {
          margin-top: 2px;
          margin-bottom: 7px;
          padding-left: 17px;
        }

        .pdf-wrapper li {
          font-size: 9.5pt;
          color: #334155;
          margin-bottom: 3.5px;
          line-height: 1.45;
          page-break-inside: avoid;
        }

        .pdf-wrapper strong, .pdf-wrapper b {
          font-weight: 600;
          color: #0f172a;
        }

        .pdf-wrapper a {
          color: ${colors.secondary};
          text-decoration: none;
          font-weight: 500;
        }

        .pdf-wrapper hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 14px 0;
        }

        /* Rodapé de autenticação ATS */
        .pdf-ats-footer {
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

        .pdf-ats-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          background-color: ${colors.badgeBg};
          color: ${colors.badgeText};
          font-weight: 700;
          font-size: 7.5pt;
        }

        /* Seção de Coaching / Dicas de Ouro */
        .pdf-tips-container {
          page-break-before: always;
          margin-top: 20px;
          padding: 16px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .pdf-tips-banner {
          background-color: ${colors.primary};
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 14px;
        }

        .pdf-tips-banner-title {
          font-size: 11pt;
          font-weight: 700;
          margin: 0;
        }

        .pdf-tips-banner-sub {
          font-size: 8pt;
          margin: 2px 0 0 0;
          opacity: 0.9;
        }
      `;

      let footerHtml = '';
      if (includeAtsBadge) {
        footerHtml = `
          <div class="pdf-ats-footer">
            <span>Currículo Otimizado para <strong>${targetRole}</strong> • <strong>${targetCompany}</strong></span>
            <div>
              <span class="pdf-ats-badge">ATS Score: ${atsScore}/100</span>
              <span style="margin-left: 6px;">Elite CV Architect</span>
            </div>
          </div>
        `;
      }

      let coachingHtml = '';
      if (exportType === 'full' && tipsHtml) {
        coachingHtml = `
          <div class="pdf-tips-container">
            <div class="pdf-tips-banner">
              <p class="pdf-tips-banner-title">🏆 ANÁLISE ESTRATÉGICA & DICAS DE OURO (USO PESSOAL)</p>
              <p class="pdf-tips-banner-sub">Orientações de posicionamento, cultura e entrevista para o cargo de ${targetRole} na ${targetCompany}</p>
            </div>
            ${tipsHtml}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="pdf-wrapper">
          <div class="pdf-cv-content">
            ${cvHtml}
          </div>
          ${footerHtml}
          ${coachingHtml}
        </div>
      `;

      container.appendChild(styleElement);
      document.body.appendChild(container);

      // Configurações do html2pdf
      const safeFilename = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const opt = {
        margin: [10, 10, 10, 10], // mm
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

      setNotification({
        type: 'success',
        message: 'PDF gerado e baixado com sucesso! Arquivo pronto para candidatura.'
      });

      setTimeout(() => {
        setIsGenerating(false);
      }, 500);

    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      setNotification({
        type: 'error',
        message: 'Houve uma falha ao gerar o documento PDF. Tente novamente.'
      });
      setIsGenerating(false);
    } finally {
      // Remove o container temporário
      const tempBox = document.getElementById('temp-pdf-render-box');
      if (tempBox && tempBox.parentNode) {
        tempBox.parentNode.removeChild(tempBox);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Baixar Currículo em PDF Profissional
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Documento A4 diagramado com precisão e compatibilidade ATS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Opções */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {notification && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Opção 1: Formato de Conteúdo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Finalidade do Documento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('recruiter')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'recruiter'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Versão para RH / ATS</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Currículo limpo pronto para candidatura. Remove anotações e dicas de entrevista da IA.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('full')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'full'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Completo + Dicas de Ouro</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    Estudo
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Inclui o currículo e anexa a seção de Dicas de Ouro & Cultura ao final para sua consulta.
                </p>
              </button>
            </div>
          </div>

          {/* Opção 2: Tema Visual */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" />
              Estilo Visual do PDF
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('executive')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  theme === 'executive'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-800 mx-auto mb-1.5 border border-white shadow-xs" />
                <span className="font-bold text-xs text-slate-800 block">Executivo</span>
                <span className="text-[10px] text-slate-500 block">Navy & Azul</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('minimalist')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  theme === 'minimalist'
                    ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-800/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-900 mx-auto mb-1.5 border border-white shadow-xs" />
                <span className="font-bold text-xs text-slate-800 block">Minimalista</span>
                <span className="text-[10px] text-slate-500 block">Grafite ATS</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('tech')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  theme === 'tech'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-emerald-700 mx-auto mb-1.5 border border-white shadow-xs" />
                <span className="font-bold text-xs text-slate-800 block">Tech</span>
                <span className="text-[10px] text-slate-500 block">Esmeralda</span>
              </button>
            </div>
          </div>

          {/* Opção 3: Nome do Arquivo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nome do Arquivo Salvo
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              placeholder="Nome_Do_Arquivo.pdf"
            />
          </div>

          {/* Opção 4: Carimbo ATS */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={includeAtsBadge}
              onChange={(e) => setIncludeAtsBadge(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <div className="text-xs text-slate-700 leading-tight">
              <span className="font-bold">Incluir rodapé de auditoria ATS</span>
              <span className="text-slate-500 block text-[11px]">
                Exibe sutilmente no rodapé a compatibilidade com a vaga e o score ({atsScore}/100).
              </span>
            </div>
          </label>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all ${
              isGenerating
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Gerando PDF Formatado...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Documento PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
