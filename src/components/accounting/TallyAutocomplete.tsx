/**
 * TALLY-STYLE AUTOCOMPLETE SELECTOR
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements keyboard-first suggestion selection:
 * - Arrow Up / Down navigates through matches.
 * - Enter immediately chooses the highlighted suggestion.
 * - Escape closes dropdown and keeps existing value.
 * - Click and touch friendly.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface AutocompleteOption {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  metadata?: any;
}

interface TallyAutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onEnterNext?: () => void;
}

export const TallyAutocomplete: React.FC<TallyAutocompleteProps> = ({
  options,
  value,
  onSelect,
  placeholder = 'Type to search or press Enter...',
  disabled = false,
  className = '',
  inputClassName = '',
  autoFocus = false,
  onEnterNext
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync display term when value changes externally
  useEffect(() => {
    const selected = options.find(o => o.id === value);
    if (selected) {
      setSearchTerm(selected.label);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, options]);

  // Filter options based on user typing
  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  // Ensure highlighted index stays in bounds
  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
    }
  }, [filteredOptions.length, highlightedIndex]);

  // Keep highlighted item visible in scroll view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeItem = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset search term back to actual selected value if typed term didn't match
        const selected = options.find(o => o.id === value);
        if (selected) {
          setSearchTerm(selected.label);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
      return;
    }

    if (e.key === 'Enter') {
      if (isOpen && filteredOptions.length > 0) {
        e.preventDefault();
        const selected = filteredOptions[highlightedIndex];
        if (selected) {
          onSelect(selected);
          setSearchTerm(selected.label);
          setIsOpen(false);
          if (onEnterNext) {
            onEnterNext();
          }
        }
      } else if (!isOpen && onEnterNext) {
        // If already closed and user hits enter, advance to next field
        onEnterNext();
      }
      return;
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        const selected = options.find(o => o.id === value);
        if (selected) setSearchTerm(selected.label);
      }
      return;
    }
  };

  const handleSelectOption = (opt: AutocompleteOption) => {
    onSelect(opt);
    setSearchTerm(opt.label);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onEnterNext) {
      onEnterNext();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-sans ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
              if (inputRef.current) inputRef.current.focus();
            }
          }}
          className="absolute right-2 text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#090f1d] border border-slate-700/80 rounded-xl shadow-2xl max-h-56 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>{filteredOptions.length} matching</span>
            <span className="text-emerald-400">↑↓ to navigate • Enter to choose</span>
          </div>

          <ul ref={listRef} className="overflow-y-auto divide-y divide-slate-800/50 flex-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400 text-center italic">
                No matching accounts or products found.
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.id === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={opt.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectOption(opt)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition ${
                      isHighlighted
                        ? 'bg-emerald-600/30 text-emerald-200 border-l-2 border-emerald-400 pl-2.5'
                        : isSelected
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 border border-slate-700">
                        {opt.badge}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
