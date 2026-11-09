import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { searchAiKnowledge } from '../../mock-data/aiKnowledge';
import { AiSearchResult } from '../../types';
import { Sparkles, Search, BookOpen, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AiSearchModal: React.FC = () => {
  const { isAiSearchOpen, setIsAiSearchOpen, activeCondominium } = useApp();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AiSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQueries = [
    'Qual o horário da piscina?',
    'Posso fazer mudança no domingo?',
    'Qual a regra para animais?',
    'Quando foi aprovada a última grande obra?',
    'Como funciona a reserva do salão de festas?',
  ];

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsLoading(true);
    setResult(null);

    setTimeout(() => {
      const res = searchAiKnowledge(searchQuery);
      setResult(res);
      setIsLoading(false);
    }, 400);
  };

  return (
    <Modal
      isOpen={isAiSearchOpen}
      onClose={() => setIsAiSearchOpen(false)}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Assistente Inteligente & RAG Documental
              <Badge variant="purple" size="sm">IA Ativa</Badge>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Respostas precisas baseadas na Convenção e Regimento do {activeCondominium.name}
            </p>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative"
        >
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Qual o horário permitido para mudanças e barulho?"
            className="w-full pl-11 pr-24 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
          </button>
        </form>

        {/* Suggested Queries */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
            Perguntas Frequentes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* AI Answer Display */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consultando documentos indexados e gerando resposta com fontes oficiais...
            </p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {/* Direct Answer Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Resposta da Inteligência Artificial
                  </span>
                </div>
                <Badge variant="success" size="sm" dot>
                  {Math.round(result.confidence * 100)}% de precisão documental
                </Badge>
              </div>

              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                {result.answer}
              </p>
            </div>

            {/* Source & Citation Excerpt */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Fonte Oficial: {result.sourceDocTitle}</span>
                </div>
                {result.pageNumber && (
                  <span className="font-mono bg-white dark:bg-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-600">
                    Página {result.pageNumber}
                  </span>
                )}
              </div>

              <blockquote className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-blue-500 pl-3 py-1 font-serif leading-relaxed">
                "{result.excerpt}"
              </blockquote>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
