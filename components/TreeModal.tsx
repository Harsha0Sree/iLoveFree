'use client';

import React from 'react';
import { ProjectFile } from '@/lib/parser';
import { X, Network, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';

interface TreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeDeclaredPaths: string[];
  files: Record<string, ProjectFile>;
  rootPrefix: string | null;
  onSelectFile: (path: string) => void;
}

export const TreeModal: React.FC<TreeModalProps> = ({
  isOpen,
  onClose,
  treeDeclaredPaths,
  files,
  rootPrefix,
  onSelectFile,
}) => {
  if (!isOpen) return null;

  const hasTree = treeDeclaredPaths.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="border-b border-neutral-800 p-3.5 bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-white" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                ASCII Structure Tree Reconciliation
              </h2>
              <p className="text-[11px] text-neutral-400">
                Cross-checking declared directory items against extracted code implementations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasTree ? (
            <div className="border border-neutral-800 p-6 bg-neutral-950 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                No ASCII Directory Tree Found
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-md mx-auto">
                All files were extracted directly from code block headers, comments, and tags.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border border-neutral-800 p-2 bg-neutral-950">
                <span>
                  Declared: <strong className="text-white">{treeDeclaredPaths.length}</strong> items
                </span>
                <span>
                  Verified with code:{' '}
                  <strong className="text-white">
                    {
                      treeDeclaredPaths.filter(
                        (p) => files[p] && !files[p].isMissingContent
                      ).length
                    }
                  </strong>
                </span>
                {rootPrefix && (
                  <span>
                    Root Prefix: <code className="text-white">{rootPrefix}/</code>
                  </span>
                )}
              </div>

              <div className="border border-neutral-800 divide-y divide-neutral-900 bg-black font-mono text-xs">
                {treeDeclaredPaths.map((path) => {
                  const file = files[path];
                  const hasCode = file && !file.isMissingContent;

                  return (
                    <div
                      key={path}
                      className="p-2.5 flex items-center justify-between hover:bg-neutral-950 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {hasCode ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <AlertOctagon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-white">{path}</span>
                          {file && (
                            <div className="text-[10px] text-neutral-500">
                              {hasCode
                                ? `${file.lineCount}L • ${file.sizeBytes}B • Block #${file.sourceBlockIndices.join(', #')}`
                                : 'NO CODE BLOCK IN TEXT'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasCode ? (
                          <span className="px-1.5 py-0.2 border border-white text-[9px] text-white font-bold uppercase">
                            Matched
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-white text-black text-[9px] font-bold uppercase">
                            Missing Code
                          </span>
                        )}

                        {file && (
                          <button
                            onClick={() => {
                              onSelectFile(path);
                              onClose();
                            }}
                            className="border border-neutral-800 p-1 hover:border-white text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 border border-neutral-700 rounded-md text-xs text-neutral-400 hover:text-white uppercase transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
