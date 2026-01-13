
import React, { useState, useCallback } from 'react';
import { AppStatus } from './types';
import { extractTravelInfo } from './geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showCopyFeedback, setShowCopyFeedback] = useState<boolean>(false);

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Por favor, cole algum texto para extração.');
      return;
    }

    setStatus(AppStatus.LOADING);
    setErrorMsg('');
    
    try {
      const data = await extractTravelInfo(inputText);
      setResults(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleCopy = useCallback(() => {
    if (results.length === 0) return;
    
    const textToCopy = results.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    });
  }, [results]);

  const handleClear = () => {
    setInputText('');
    setResults([]);
    setStatus(AppStatus.IDLE);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <header className="bg-indigo-600 p-6 text-white text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Extrator de Diárias Inteligente
          </h1>
          <p className="mt-2 text-indigo-100 opacity-90 text-sm md:text-base">
            Organização automática: Data primeiro, seguido de cidade, horários e motivos limpos.
          </p>
        </header>

        <main className="p-6 space-y-6">
          
          {/* Input Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Cole o texto bruto aqui:
            </label>
            <textarea
              className="w-full h-48 md:h-64 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="Ex: Saí dia 20/05 às 08:00 e retornei dia 22/05 às 17:00 de Campinas. Motivo Diária: GAB - Reunião (Pauta X)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleExtract}
                disabled={status === AppStatus.LOADING}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${
                  status === AppStatus.LOADING 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                }`}
              >
                {status === AppStatus.LOADING ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Extrair Informações
                  </>
                )}
              </button>

              <button
                onClick={handleClear}
                className="px-6 py-3 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Limpar
              </button>
            </div>

            {results.length > 0 && (
              <div className="relative">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Resultados
                </button>
                {showCopyFeedback && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-3 rounded shadow-lg animate-bounce">
                    Copiado!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Resultados Extraídos:
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-slate-700 leading-relaxed shadow-inner">
                {results.map((line, idx) => (
                  <div key={idx} className="py-2 border-b border-slate-100 last:border-0 hover:bg-white hover:px-2 transition-all rounded">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === AppStatus.IDLE && !results.length && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>As informações formatadas (Data primeiro) aparecerão aqui</p>
            </div>
          )}

        </main>

        {/* Footer info */}
        <footer className="bg-slate-50 border-t border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500">
            Formato: Data primeiro. Sigla inicial e parênteses removidos. Tratamento automático de datas diferentes.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
