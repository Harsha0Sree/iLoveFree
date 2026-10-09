'use client';

import React from 'react';
import { ProjectFile } from '@/lib/parser';
import { Network, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';

interface TreeStructureViewProps {
  treeDeclaredPaths: string[];
  files: Record<string, ProjectFile>;
  rootPrefix: string | null;
  onSelectFile: (path: string) => void;
}

export const TreeStructureView: React.FC<TreeStructureViewProps> = ({
  treeDeclaredPaths,
  files,
  rootPrefix,
  onSelectFile,
}) => {
  const hasTree = treeDeclaredPaths.length > 0;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="border-b border-neutral-800 p-4 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Network className="w-3.5 h-3.5" />
            <span>Structure Tree Cross-Verification</span>
            <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 text-neutral-300">
              {treeDeclaredPaths.length} Declared Items
            </span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">
            Reconciliation between the directory layout declared in the text and actual code block implementations.
          </p>
        </div>

        {rootPrefix && (
          <div className="text-xs border border-neutral-800 px-2 py-1 bg-black text-neutral-300 font-mono">
            <span>Root detected: </span>
            <strong className="text-white">{rootPrefix}/</strong>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasTree ? (
          <div className="border border-neutral-800 p-6 bg-neutral-950 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              No ASCII Directory Tree Found in Document
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-md mx-auto">
              The project files were extracted directly from code fence attributes, first-line comments, and preceding markdown headers.
              To trigger directory tree verification, include an ASCII tree like:
            </p>
            <pre className="mt-3 p-3 bg-black border border-neutral-800 text-[11px] font-mono text-neutral-400 inline-block text-left">
              {`my-project/
├── package.json
└── src/
    └── index.ts`}
            </pre>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 border border-neutral-800 bg-neutral-950">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Declared in Structure Tree
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {treeDeclaredPaths.length}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Paths extracted from ASCII diagrams or directory lists.
                </div>
              </div>

              <div className="p-3 border border-neutral-800 bg-neutral-950">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Implemented with Code Blocks
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {
                    treeDeclaredPaths.filter(
                      (p) => files[p] && !files[p].isMissingContent
                    ).length
                  }
                  <span className="text-xs text-neutral-500 font-normal ml-2">
                    / {treeDeclaredPaths.length}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Files with verified code implementations.
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 divide-y divide-neutral-900 bg-black font-mono text-xs">
              <div className="p-2.5 bg-neutral-950 text-[10px] uppercase tracking-wider text-neutral-500 flex justify-between">
                <span>Declared Path in Tree</span>
                <span>Verification Status</span>
              </div>

              {treeDeclaredPaths.map((path) => {
                const file = files[path];
                const hasCode = file && !file.isMissingContent;

                return (
                  <div
                    key={path}
                    className="p-3 flex items-center justify-between hover:bg-neutral-950 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {hasCode ? (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-white">{path}</span>
                        {file && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {hasCode
                              ? `${file.lineCount} lines • ${file.sizeBytes} bytes • Source: Block #${file.sourceBlockIndices.join(', #')}`
                              : 'NO CODE BLOCK SUPPLIED IN DOCUMENT'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasCode ? (
                        <span className="px-2 py-0.5 border border-white text-[10px] text-white font-bold uppercase">
                          Matched & Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase">
                          Missing Code
                        </span>
                      )}

                      {file && (
                        <button
                          onClick={() => onSelectFile(path)}
                          className="border border-neutral-800 p-1 hover:border-white text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Open in file viewer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
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
    </div>
  );
};
