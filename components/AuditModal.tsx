'use client';

import React, { useState } from 'react';
import { DiagnosticIssue, ExtractedCodeBlock, ProjectFile } from '@/lib/parser';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticIssue[];
  files: Record<string, ProjectFile>;
  codeBlocks: ExtractedCodeBlock[];
  onSelectFile: (path: string) => void;
  onAssignBlockPath: (blockIndex: number, targetPath: string) => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  files,
  codeBlocks,
  onSelectFile,
  onAssignBlockPath,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [manualPaths, setManualPaths] = useState<Record<number, string>>({});

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="border-b border-neutral-800 p-3.5 bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {errors.length > 0 ? (
              <span className="p-1 bg-white text-black font-bold rounded-sm">
                <AlertOctagon className="w-4 h-4" />
              </span>
            ) : warnings.length > 0 ? (
              <span className="p-1 border border-white text-white rounded-sm">
                <AlertTriangle className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1 border border-neutral-700 text-white rounded-sm">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Integrity & Diagnostic Audits
              </h2>
              <p className="text-[11px] text-neutral-400">
                {errors.length} error(s), {warnings.length} warning(s) • Zero silent failure guarantee
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[10px]">
              {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded uppercase cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-white text-black font-bold'
                      : 'border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-neutral-800 bg-[#101010] rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                All Integrity Checks Passed
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Every code block and declared directory path has been correlated with 100% deterministic certainty.
              </p>
            </div>
          ) : (
            filtered.map((issue) => {
              const isError = issue.severity === 'error';
              const isWarn = issue.severity === 'warning';
              const block = issue.blockIndex
                ? codeBlocks.find((b) => b.index === issue.blockIndex)
                : null;

              return (
                <div
                  key={issue.id}
                  className={`p-3.5 border rounded-md transition-all ${
                    isError
                      ? 'border-neutral-700 bg-[#111111]'
                      : isWarn
                      ? 'border-neutral-800 bg-black'
                      : 'border-neutral-900 bg-black'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {isError ? (
                        <span className="p-1 bg-white text-black shrink-0 rounded-sm">
                          <AlertOctagon className="w-3.5 h-3.5" />
                        </span>
                      ) : isWarn ? (
                        <span className="p-1 border border-white text-white shrink-0 rounded-sm">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 border border-neutral-800 text-neutral-400 shrink-0 rounded-sm">
                          <Info className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-white">
                            {issue.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1 font-mono font-bold rounded-sm ${
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
                            <strong className="text-white">Action:</strong>{' '}
                            {issue.suggestedAction}
                          </p>
                        )}
                      </div>
                    </div>

                    {issue.filePath && files[issue.filePath] && (
                      <button
                        onClick={() => {
                          onSelectFile(issue.filePath!);
                          onClose();
                        }}
                        className="shrink-0 flex items-center gap-1 border border-neutral-700 px-2 py-1 text-xs text-white hover:border-white transition-colors cursor-pointer rounded-md"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Manual path assignment for unresolved block */}
                  {block && !block.resolvedPath && block.status === 'unresolved' && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <div className="text-[11px] text-neutral-300 mb-1.5 font-mono">
                        Assign destination file path for Code Block #{block.index}:
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
                          className="flex-1 bg-black border border-neutral-700 px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-white rounded-md"
                        />
                        <button
                          onClick={() => handleAssignPath(block.index)}
                          className="bg-white text-black px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-200 transition-colors cursor-pointer shrink-0 rounded-md"
                        >
                          Assign Path
                        </button>
                      </div>

                      <div className="mt-2 bg-black p-2 border border-neutral-800 text-[10px] font-mono text-neutral-400 max-h-24 overflow-y-auto rounded-md">
                        <pre>{block.content.slice(0, 300)}...</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="border border-white bg-white text-black px-4 py-1 font-bold uppercase hover:bg-neutral-200 transition-colors cursor-pointer rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
