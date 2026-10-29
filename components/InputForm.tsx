import React, { useState, useRef } from 'react';
import { CVFormData } from '../types';


interface InputFormProps {
  onSubmit: (data: CVFormData) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CVFormData>({
    originalCV: '',
    targetCompany: '',
    targetRole: '',
    jobDescription: '',
    linkedinUrl: '',
    githubUrl: ''
  });
  
  // Estado para controlar tentativas de envio (para mostrar erros apenas após tentar enviar)
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  const [errors, setErrors] = useState<{ linkedinUrl?: string; githubUrl?: string }>({});
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    const pattern = new RegExp('^(https?:\\/\\/)?' + 
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + 
      '((\\d{1,3}\\.){3}\\d{1,3}))' + 
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
      '(\\?[;&a-z\\d%_.~+=-]*)?' + 
      '(\\#[-a-z\\d_]*)?$', 'i'); 
    return !!pattern.test(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpeza de erros de URL em tempo real
    if (name === 'linkedinUrl' || name === 'githubUrl') {
      if (errors[name as keyof typeof errors]) {
        const newErrors = { ...errors };
        delete newErrors[name as keyof typeof errors];
        setErrors(newErrors);
      }
    }
  };

  const handleGenericCompany = () => {
    setFormData(prev => ({
      ...prev,
      targetCompany: "Mercado Geral (Foco na Função)"
    }));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error("Erro interno: Biblioteca de leitura de PDF não iniciada.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        
        if (!text || text.trim().length < 50) {
          alert("AVISO: O PDF parece ser uma imagem ou está vazio. Por favor, copie e cole o texto manualmente.");
          setFormData(prev => ({ ...prev, originalCV: "" }));
        } else {
          setFormData(prev => ({ ...prev, originalCV: text }));
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setFormData(prev => ({ ...prev, originalCV: text }));
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Não foi possível ler o arquivo. Verifique se não está corrompido.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // 1. Validação de Campos Obrigatórios com Feedback Explícito
    const missingFields = [];
    if (!formData.targetCompany.trim()) missingFields.push("Empresa Alvo");
    if (!formData.targetRole.trim()) missingFields.push("Cargo Pretendido");
    if (!formData.originalCV.trim()) missingFields.push("Currículo (Texto ou PDF)");

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os campos obrigatórios:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // 2. Validação de URLs
    let urlError = false;
    const newErrors: typeof errors = {};

    if (formData.linkedinUrl && !validateUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'URL inválida';
      urlError = true;
    }
    if (formData.githubUrl && !validateUrl(formData.githubUrl)) {
      newErrors.githubUrl = 'URL inválida';
      urlError = true;
    }

    if (urlError) {
      setErrors(newErrors);
      alert("Por favor, corrija os erros nos links (URLs) antes de continuar.");
      return;
    }

    // Sucesso
    onSubmit(formData);
  };

  // Ícone de check para campos válidos
  const ValidIcon = () => (
    <div className="absolute right-3 top-3 text-green-500 animate-in fade-in zoom-in duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Dados da Vaga e Candidato
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Empresa Alvo <span className="text-red-500">*</span></label>
              <button 
                type="button" 
                onClick={handleGenericCompany}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-indigo-600 font-medium px-2 py-1 rounded transition-colors border border-slate-200"
                title="Preencher com 'Mercado Geral' para focar apenas no cargo"
              >
                Usar Genérico
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                name="targetCompany"
                value={formData.targetCompany}
                onChange={handleChange}
                placeholder="Ex: Google, Nubank, Tesla"
                className={`w-full px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border outline-none transition-all pr-10
                  ${submitAttempted && !formData.targetCompany ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'}`}
              />
              {formData.targetCompany.length > 1 && <ValidIcon />}
            </div>
          </div>
          
          <div className="space-y-2 relative">
            <label className="text-sm font-semibold text-slate-700">Cargo Pretendido <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                placeholder="Ex: Senior Product Manager"
                className={`w-full px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border outline-none transition-all pr-10
                  ${submitAttempted && !formData.targetRole ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'}`}
              />
              {formData.targetRole.length > 2 && <ValidIcon />}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            Descrição da Vaga ou Link
            <span className="text-xs font-normal text-slate-400">(Opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </div>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Cole a descrição completa da vaga ou insira o link (URL) do anúncio..."
              rows={3}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              LinkedIn <span className="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <div className="relative">
              <div className={`absolute top-3 left-3 ${errors.linkedinUrl ? 'text-red-400' : 'text-slate-400'}`}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/seu-perfil"
                className={`w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border outline-none transition-all
                  ${errors.linkedinUrl 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'}`}
              />
              {!errors.linkedinUrl && formData.linkedinUrl && <ValidIcon />}
            </div>
            {errors.linkedinUrl && <p className="text-xs text-red-500 mt-1">{errors.linkedinUrl}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              GitHub <span className="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <div className="relative">
              <div className={`absolute top-3 left-3 ${errors.githubUrl ? 'text-red-400' : 'text-slate-400'}`}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/seu-usuario"
                className={`w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border outline-none transition-all
                  ${errors.githubUrl 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'}`}
              />
              {!errors.githubUrl && formData.githubUrl && <ValidIcon />}
            </div>
            {errors.githubUrl && <p className="text-xs text-red-500 mt-1">{errors.githubUrl}</p>}
          </div>
        </div>

        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Currículo Atual (Texto) <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className={`text-sm font-medium flex items-center gap-1 transition-colors px-3 py-1 rounded-md border border-indigo-100
                ${isProcessingFile 
                  ? 'text-slate-400 cursor-wait bg-slate-50' 
                  : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 bg-white'
                }`}
            >
              {isProcessingFile ? "Lendo PDF..." : "Carregar PDF ou Texto"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".txt,.md,.pdf" 
              onChange={handleFileUpload} 
            />
          </div>
          <div className="relative">
             <textarea
              name="originalCV"
              value={formData.originalCV}
              onChange={handleChange}
              placeholder="Cole o texto do seu currículo aqui ou faça upload do PDF..."
              className={`w-full h-48 px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border outline-none transition-all resize-none font-mono text-sm
                ${submitAttempted && !formData.originalCV.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'}`}
            />
            {formData.originalCV.length > 50 && (
              <div className="absolute right-6 top-4">
                 <div className="text-green-500 animate-in fade-in zoom-in duration-300 bg-slate-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {formData.originalCV.length > 0 
              ? `${formData.originalCV.length} caracteres detectados.`
              : "Utilize seções padrão (Experiência, Educação). Texto simples funciona melhor."}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || isProcessingFile}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0
            ${(isLoading || isProcessingFile)
              ? 'bg-slate-400 cursor-wait shadow-none transform-none' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30'
            }`}
        >
          {isLoading ? "Analisando e Otimizando..." : "Gerar Currículo de Elite"}
        </button>
      </form>
    </div>
  );
};