import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultDisplay } from './components/ResultDisplay';
import { AppState, CVFormData, OptimizationResult } from './types';
import { optimizeCV } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: CVFormData) => {
    setAppState(AppState.LOADING);
    setError(null);
    setResult(null);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Elite CV Architect</h1>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini 2.5</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
              desenvolvido por: FABIANO GUIMARÂES via Google Studio
            </span>
            <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              AI Studio Docs &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Transforme seu Currículo</h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Nossa IA analisa a cultura da empresa alvo e reescreve seu currículo estrategicamente para passar pelos robôs (ATS) e impressionar recrutadores.
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
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
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
            <ResultDisplay result={result} />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;