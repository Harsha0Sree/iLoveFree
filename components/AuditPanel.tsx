'use client';

import React, { useState } from 'react';
import { DiagnosticIssue, ExtractedCodeBlock, ProjectFile } from '@/lib/parser';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AuditPanelProps {
  diagnostics: DiagnosticIssue[];
  files: Record<string, ProjectFile>;
  codeBlocks: ExtractedCodeBlock[];
  onSelectFile: (path: string) => void;
  onAssignBlockPath: (blockIndex: number, targetPath: string) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  diagnostics,
  files,
  codeBlocks,
  onSelectFile,
  onAssignBlockPath,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [manualPaths, setManualPaths] = useState<Record<number, string>>({});

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const infos = diagnostics.filter((d) => d.severity === 'info');

  const filtered = diagnostics.filter((d) => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  const handleAssignPath = (blockIndex: number) => {
    const path = manualPaths[blockIndex]?.trim();
    if (path) {
      onAssignBlockPath(blockIndex, path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top Header & Metrics Bar */}
      <div className="border-b border-neutral-800 p-4 bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Deterministic Integrity & Audit Center</span>
              <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 text-neutral-300">
                {diagnostics.length} Audits
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400 mt-1">
              Zero silent failures. Cross-checking directory trees, block delimiters, collisions, and truncation markers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setFilterSeverity('error')}
              className={`flex items-center gap-1.5 px-2.5 py-1 border transition-colors cursor-pointer ${
                errors.length > 0
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-neutral-800 text-neutral-500'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{errors.length} Errors</span>
            </button>

            <button
              onClick={() => setFilterSeverity('warning')}
              className={`flex items-center gap-1.5 px-2.5 py-1 border transition-colors cursor-pointer ${
                warnings.length > 0
                  ? 'border-neutral-400 bg-neutral-900 text-white font-bold'
                  : 'border-neutral-800 text-neutral-500'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-neutral-300" />
              <span>{warnings.length} Warnings</span>
            </button>

            <button
              onClick={() => setFilterSeverity('info')}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{infos.length} Info</span>
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 text-[11px] font-mono border-t border-neutral-800 pt-2">
          <span className="text-neutral-500 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 border text-xs uppercase cursor-pointer ${
                filterSeverity === sev
                  ? 'border-white text-white font-bold bg-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-neutral-800 bg-neutral-950">
            <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              No Issues in this Category
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              All extracted project artifacts strictly satisfy integrity rules.
            </p>
          </div>
        ) : (
          filtered.map((issue) => {
            const isError = issue.severity === 'error';
            const isWarn = issue.severity === 'warning';

            // Find associated code block if any
            const block = issue.blockIndex
              ? codeBlocks.find((b) => b.index === issue.blockIndex)
              : null;

            return (
              <div
                key={issue.id}
                className={`p-3.5 border transition-all ${
                  isError
                    ? 'border-white bg-black'
                    : isWarn
                    ? 'border-neutral-700 bg-neutral-950'
                    : 'border-neutral-900 bg-black'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isError ? (
                      <span className="p-1 bg-white text-black shrink-0">
                        <AlertOctagon className="w-3.5 h-3.5" />
                      </span>
                    ) : isWarn ? (
                      <span className="p-1 border border-white text-white shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 border border-neutral-800 text-neutral-400 shrink-0">
                        <Info className="w-3.5 h-3.5" />
                      </span>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-white">
                          {issue.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1 font-mono font-bold ${
                            isError
                              ? 'bg-white text-black'
                              : isWarn
                              ? 'border border-neutral-600 text-neutral-300'
                              : 'text-neutral-500'
                          }`}
                        >
                          [{issue.severity.toUpperCase()}]
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                        {issue.message}
                      </p>

                      {issue.suggestedAction && (
                        <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                          <strong className="text-white">Suggested Action:</strong>{' '}
                          {issue.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Jump button if target file exists */}
                  {issue.filePath && files[issue.filePath] && (
                    <button
                      onClick={() => onSelectFile(issue.filePath!)}
                      className="shrink-0 flex items-center gap-1 border border-neutral-700 px-2 py-1 text-xs text-white hover:border-white transition-colors cursor-pointer"
                    >
                      <span>Jump to File</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* If unresolved code block, allow user to assign path right here! */}
                {block && !block.resolvedPath && block.status === 'unresolved' && (
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <div className="text-[11px] text-neutral-400 mb-1.5 font-mono">
                      Assign target destination path for Code Block #{block.index}:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. src/utils/helpers.ts"
                        value={manualPaths[block.index] || ''}
                        onChange={(e) =>
                          setManualPaths({
                            ...manualPaths,
                            [block.index]: e.target.value,
                          })
                        }
                        className="flex-1 bg-neutral-900 border border-neutral-700 px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-white"
                      />
                      <button
                        onClick={() => handleAssignPath(block.index)}
                        className="bg-white text-black px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                      >
                        Assign Path
                      </button>
                    </div>

                    {/* Code snippet preview */}
                    <div className="mt-2 bg-neutral-950 p-2 border border-neutral-900 text-[10px] font-mono text-neutral-400 max-h-24 overflow-y-auto">
                      <pre>{block.content.slice(0, 300)}...</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Audit Panel Footer */}
      <div className="border-t border-neutral-800 px-4 py-2 bg-neutral-950 text-xs text-neutral-500 flex justify-between font-mono">
        <span>Deterministic Rule Check: Strict</span>
        <span>
          {errors.length === 0
            ? '✅ No fatal compilation blockers'
            : `⚠️ ${errors.length} fatal blocker(s) present`}
        </span>
      </div>
    </div>
  );
};
