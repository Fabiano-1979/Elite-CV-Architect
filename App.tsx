import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultDisplay } from './components/ResultDisplay';
import { AppState, CVFormData, OptimizationResult } from './types';
import { optimizeCV } from './services/geminiService';
import { Sparkles, Maximize2, Minimize2, AlertTriangle, FileCheck } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<CVFormData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFormSubmit = async (data: CVFormData) => {
    setAppState(AppState.LOADING);
    setError(null);
    setResult(null);
    setSubmittedData(data);

    try {
      const optimizationResult = await optimizeCV(
        data.originalCV,
        data.targetCompany,
        data.targetRole,
        data.jobDescription,
        data.linkedinUrl,
        data.githubUrl
      );
      setResult(optimizationResult);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
      setAppState(AppState.ERROR);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error(`Erro ao tentar ativar tela cheia: ${err.message}`);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-sm text-white">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Elite CV Architect</h1>
              <p className="text-xs text-slate-500 font-medium">Otimização de Currículo & Preparador de Entrevista</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium hidden md:inline-block">
              desenvolvido por: FABIANO GUIMARÂES
            </span>
            
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>

            <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hidden sm:inline-block">
              Docs &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Transforme seu Currículo & Domine a Entrevista</h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Nossa IA analisa a cultura da empresa alvo, reescreve seu currículo para passar pelos robôs (ATS) e gera perguntas estratégicas de entrevista personalizadas para o seu cargo.
          </p>
        </div>

        {/* Input Section */}
        <section>
          <InputForm 
            onSubmit={handleFormSubmit} 
            isLoading={appState === AppState.LOADING} 
          />
        </section>

        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success / Result Section */}
        {appState === AppState.SUCCESS && (
          <section>
            <ResultDisplay 
              result={result} 
              jobDescription={submittedData?.jobDescription}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
