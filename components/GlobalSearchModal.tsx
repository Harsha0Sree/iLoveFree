'use client';

import React, { useState, useMemo } from 'react';
import { ProjectFile } from '@/lib/parser';
import { searchProjectFiles, SearchOptions } from '@/lib/search';
import { Search, X, FileCode, ChevronDown, ChevronRight, CaseSensitive, WholeWord, Regex } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, ProjectFile>;
  onSelectResult: (filePath: string, line: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    matchWholeWord: false,
    useRegex: false,
  });
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  const searchResults = useMemo(() => {
    return searchProjectFiles(files, query, options);
  }, [files, query, options]);

  const totalMatches = useMemo(() => {
    return searchResults.reduce((acc, f) => acc + f.matches.length, 0);
  }, [searchResults]);

  if (!isOpen) return null;

  const toggleFileCollapse = (filePath: string) => {
    setCollapsedFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg font-mono text-xs overflow-hidden">
        {/* Header & Search Bar */}
        <div className="border-b border-neutral-800 p-3 bg-[#111111] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Search Files
            </span>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 flex items-center gap-1.5 bg-[#181818] border border-neutral-700 rounded-md px-2.5 focus-within:border-white transition-colors">
            <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-neutral-500 hover:text-white px-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* Match Toggles */}
            <div className="flex items-center gap-1 border-l border-neutral-700 pl-1.5 ml-1">
              <button
                onClick={() =>
                  setOptions({ ...options, caseSensitive: !options.caseSensitive })
                }
                className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  options.caseSensitive
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Match Case (Alt+C)"
              >
                <CaseSensitive className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  setOptions({ ...options, matchWholeWord: !options.matchWholeWord })
                }
                className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  options.matchWholeWord
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Match Whole Word (Alt+W)"
              >
                <WholeWord className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  setOptions({ ...options, useRegex: !options.useRegex })
                }
                className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  options.useRegex
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Use Regular Expression (Alt+R)"
              >
                <Regex className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <span>
              {query
                ? `${totalMatches} match${totalMatches === 1 ? '' : 'es'} across ${searchResults.length} file${searchResults.length === 1 ? '' : 's'}`
                : 'Type query to search all project files in real time'}
            </span>
            <span>ESC to close</span>
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {query && searchResults.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No matching lines found for &quot;{query}&quot;.
            </div>
          ) : (
            searchResults.map((res) => {
              const isCollapsed = collapsedFiles[res.filePath];

              return (
                <div
                  key={res.filePath}
                  className="border border-neutral-800 rounded-md bg-[#090909] overflow-hidden"
                >
                  {/* File group header */}
                  <div
                    onClick={() => toggleFileCollapse(res.filePath)}
                    className="flex items-center justify-between p-2 bg-[#121212] hover:bg-[#1a1a1a] cursor-pointer select-none border-b border-neutral-900"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      )}
                      <FileCode className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="font-bold text-white truncate text-[11px]">
                        {res.filePath}
                      </span>
                    </div>

                    <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 rounded text-neutral-400 font-mono">
                      {res.matches.length}
                    </span>
                  </div>

                  {/* Matching lines */}
                  {!isCollapsed && (
                    <div className="divide-y divide-neutral-900/60">
                      {res.matches.map((m, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onSelectResult(res.filePath, m.lineNumber);
                            onClose();
                          }}
                          className="flex items-center gap-2 p-1.5 pl-6 hover:bg-[#181818] cursor-pointer text-[11px] group transition-colors"
                        >
                          <span className="text-neutral-500 text-[10px] w-8 text-right shrink-0">
                            {m.lineNumber}:
                          </span>
                          <span className="text-neutral-300 group-hover:text-white truncate font-mono">
                            {m.lineContent.slice(0, m.startIndex)}
                            <mark className="bg-white text-black font-bold px-0.5 rounded-sm">
                              {m.lineContent.slice(m.startIndex, m.endIndex)}
                            </mark>
                            {m.lineContent.slice(m.endIndex)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-2.5 bg-[#111111] flex justify-between items-center text-[10px] text-neutral-500">
          <span>Click any line to jump directly to the editor</span>
          <button
            onClick={onClose}
            className="border border-neutral-700 px-3 py-1 rounded text-neutral-400 hover:text-white uppercase cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
