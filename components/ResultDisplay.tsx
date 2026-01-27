import React, { useState, useEffect } from 'react';
import { OptimizationResult } from '../types';

// Declare types for the global libraries added in index.html
declare global {
  interface Window {
    html2pdf: any;
    marked: {
      parse: (text: string) => string;
    };
  }
}

interface ResultDisplayProps {
  result: OptimizationResult | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // Estado local para permitir edição do conteúdo
  const [editableContent, setEditableContent] = useState('');

  // Atualiza o conteúdo editável quando o resultado da IA muda
  useEffect(() => {
    if (result?.content) {
      setEditableContent(result.content);
    }
  }, [result]);

  if (!result) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!window.html2pdf || !window.marked) {
      alert("Bibliotecas de PDF não carregadas. Tente recarregar a página.");
      return;
    }

    setIsDownloading(true);

    try {
      // 1. Convert Markdown to HTML using 'marked' from the EDITABLE content
      const htmlContent = window.marked.parse(editableContent);

      // 2. Create a temporary container for styling the PDF content
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      
      // 3. Apply styles specifically for the PDF output (clean, professional look)
      container.style.padding = '40px';
      container.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.color = '#1f2937'; // gray-800
      
      // Inject internal styles for headings and lists inside the PDF
      const style = document.createElement('style');
      style.innerHTML = `
        h1 { font-size: 24px; color: #111827; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h2 { font-size: 18px; color: #374151; margin-top: 20px; margin-bottom: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        h3 { font-size: 14px; color: #4b5563; margin-top: 16px; margin-bottom: 8px; font-weight: bold; }
        p { margin-bottom: 10px; text-align: justify; }
        ul { margin-left: 20px; margin-bottom: 10px; }
        li { margin-bottom: 4px; }
        strong { font-weight: 600; color: #111827; }
        hr { border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0; }
      `;
      container.appendChild(style);

      // 4. Configure html2pdf options
      const opt = {
        margin: 10, // mm
        filename: 'Meu_Curriculo_Elite.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 5. Generate PDF
      await window.html2pdf().set(opt).from(container).save();

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resultado Otimizado
        </h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white shadow-sm
              ${isDownloading 
                ? 'bg-indigo-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
              }`}
          >
            {isDownloading ? (
              <>
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar PDF
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar Texto
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-2 right-4 text-xs text-slate-400 pointer-events-none">
          Modo Editor: Você pode alterar o texto abaixo
        </div>
        <textarea
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          className="w-full h-[600px] p-6 bg-slate-50 rounded-lg border border-slate-200 font-mono text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto"
        />
      </div>

      {result.groundingMetadata && result.groundingMetadata.groundingChunks && result.groundingMetadata.groundingChunks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fontes da Pesquisa Corporativa</h3>
          <div className="flex flex-wrap gap-2">
            {result.groundingMetadata.groundingChunks.map((chunk, idx) => 
              chunk.web ? (
                <a 
                  key={idx} 
                  href={chunk.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors truncate max-w-xs"
                >
                  {chunk.web.title || chunk.web.uri}
                </a>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
};