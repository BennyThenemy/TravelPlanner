'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import geoData from '@/lib/countries.json';

type Suggestion =
  | { kind: 'world'; name: string; emoji: string }
  | { kind: 'continent'; name: string; emoji: string }
  | { kind: 'country'; name: string; emoji: string; continent: string };

function getSuggestions(query: string): Suggestion[] {
  if (!query) return [];
  const q = query.toLowerCase();
  const results: Suggestion[] = [];

  if (geoData.world.name.toLowerCase().includes(q)) {
    results.push({ kind: 'world', ...geoData.world });
  }
  for (const c of geoData.continents) {
    if (c.name.toLowerCase().includes(q)) results.push({ kind: 'continent', ...c });
  }
  for (const c of geoData.countries) {
    if (c.name.toLowerCase().includes(q)) results.push({ kind: 'country', ...c });
  }

  return results;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DestinationInput({ value, onChange, placeholder = 'e.g. Thailand', required }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const item = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleChange = useCallback((v: string) => {
    onChange(v);
    if (!v) {
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveIndex(-1);
    } else {
      const next = getSuggestions(v);
      setSuggestions(next);
      setDropdownOpen(next.length > 0);
      setActiveIndex(-1);
    }
  }, [onChange]);

  function select(s: Suggestion) {
    onChange(s.name);
    setSuggestions([]);
    setDropdownOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={dropdownOpen}
        aria-activedescendant={activeIndex >= 0 ? `dest-option-${activeIndex}` : undefined}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required={required}
      />
      {dropdownOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1"
        >
          {suggestions.slice(0, 8).map((s, i) => (
            <li
              key={`${s.kind}-${s.name}`}
              id={`dest-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={e => { e.preventDefault(); select(s); }}
              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${
                i === activeIndex ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base leading-none shrink-0">{s.emoji}</span>
              <span className="font-medium truncate">{s.name}</span>
              {s.kind === 'country' && (
                <span className="ml-auto text-xs text-slate-400 shrink-0">{s.continent}</span>
              )}
              {s.kind === 'continent' && (
                <span className="ml-auto text-xs text-slate-400 shrink-0">Continent</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
