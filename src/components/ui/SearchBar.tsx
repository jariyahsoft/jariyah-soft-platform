'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/Badge';

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  categoryName: string;
  type: 'software' | 'article';
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search...', className = '' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.data?.items ?? []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/${results[selectedIndex].type === 'software' ? 'software' : 'knowledge'}/${results[selectedIndex].id}`);
        setShowResults(false);
      } else if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setShowResults(false);
      }
    }
  }, [showResults, results, selectedIndex, query, router]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-text-secondary/20 bg-bg-secondary px-4 py-2 pl-10 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-bg-card"
            aria-label="Clear search"
          >
            <X className="h-3 w-3 text-text-secondary" />
          </button>
        )}
      </form>

      {showResults && (query.length >= 2) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-text-secondary/20 bg-bg-card p-2 shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-sm text-text-secondary">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-text-secondary">No results found</div>
          ) : (
            <ul>
              {results.map((item, index) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={`/${item.type === 'software' ? 'software' : 'knowledge'}/${item.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm hover:bg-bg-secondary ${
                      index === selectedIndex ? 'bg-accent/10' : ''
                    }`}
                    onMouseDown={() => {
                      router.push(`/${item.type === 'software' ? 'software' : 'knowledge'}/${item.id}`);
                      setShowResults(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">{item.type === 'software' ? 'Software' : 'Article'}</Badge>
                      <span className="font-medium text-text-primary">{item.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-text-secondary">{item.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 border-t border-text-secondary/10 pt-2">
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="block px-3 py-1.5 text-center text-xs font-semibold text-accent hover:underline"
              onClick={() => setShowResults(false)}
            >
              See all results for "{query}"
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}