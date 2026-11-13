import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, Package, Wrench, Activity, DollarSign, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { GlobalSearchResult } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  token?: string | null;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  token,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/v1/global-search?q=${encodeURIComponent(query.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((json) => {
          setResults(json.results || []);
        })
        .catch((err) => console.error('Global search error', err))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, token]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CUSTOMER':
        return <Building2 className="w-4 h-4 text-[#4C8994]" />;
      case 'ORDER':
        return <DollarSign className="w-4 h-4 text-[#5F8F4D]" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4 text-[#22381E]" />;
      case 'SERVICE_TICKET':
        return <Wrench className="w-4 h-4 text-[#6B4B12]" />;
      case 'EQUIPMENT':
        return <Activity className="w-4 h-4 text-[#C58A16]" />;
      default:
        return <FileText className="w-4 h-4 text-[#82917C]" />;
    }
  };

  const handleSelectResult = (item: GlobalSearchResult) => {
    onNavigateTab(item.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#D2E7C4]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E4F1DC] flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customers, orders, products, SKUs, serials, tickets... (e.g. Sysmex, Apollo, Chem 7)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#22381E]" />
              <span className="text-xs">Searching verified records...</span>
            </div>
          ) : query && results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          ) : !query ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Type at least 2 characters to search across all operational modules.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res) => (
                <div
                  key={`${res.category}-${res.id}`}
                  onClick={() => handleSelectResult(res)}
                  className="p-3 rounded-xl hover:bg-[#F9FAF6] border border-transparent hover:border-[#D2E7C4] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[#F5F6F0] rounded-lg group-hover:bg-[#E4F1DC] group-hover:text-[#1E331B] transition-colors">
                      {getCategoryIcon(res.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{res.title}</span>
                        {res.badge && (
                          <span className="px-1.5 py-0.2 bg-[#E4E8DF] text-[#4B5A48] rounded text-[10px] font-semibold">
                            {res.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{res.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-[#1E331B] flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider">{res.tab.replace(/_/g, ' ')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#22381E]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Global Search is role-authorized</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
