'use client';

import React, { useRef } from 'react';
import { ProjectCheckpoint } from '@/lib/checkpoints';
import {
  RefreshCw,
  GitBranch,
  X,
  ArrowRight,
  FileCode,
  FileText,
  Save,
  AlertCircle,
  Code2,
} from 'lucide-react';

interface InputPaneProps {
  rawText: string;
  onChangeText: (text: string) => void;
  onReparse: () => void;
  activeCheckpoint: ProjectCheckpoint | null;
  onClearActiveBaseline: () => void;
  onSwitchToFilesView: () => void;
  filesCount: number;
  hasUnsavedChanges?: boolean;
  onSaveVersion?: () => void;
}

export const InputPane: React.FC<InputPaneProps> = ({
  rawText,
  onChangeText,
  onReparse,
  activeCheckpoint,
  onClearActiveBaseline,
  onSwitchToFilesView,
  filesCount,
  hasUnsavedChanges,
  onSaveVersion,
}) => {
  const linesCount = rawText ? rawText.split('\n').length : 0;
  const charsCount = rawText ? rawText.length : 0;
  const bytesCount = new TextEncoder().encode(rawText).length;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const lines = rawText ? rawText.split('\n') : [''];

  return (
    <div className="flex flex-col h-full bg-[#18181c] font-mono overflow-hidden">
      {/* 1. VS Code Tab Header matching modern VS Code */}
      <div className="h-9 bg-[#141418] border-b border-[#24242a] flex items-center justify-between px-2 shrink-0 select-none">
        <div className="flex items-center h-full">
          <div className="h-full px-3.5 flex items-center gap-2 bg-[#18181c] text-white border-t-2 border-t-[#3b82f6] border-r border-[#24242a] text-xs font-medium">
            <FileText className="w-3.5 h-3.5 text-[#519aba] shrink-0" />
            <span>Source Transcript.md</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-[#e2b340]" title="Unsaved changes" />
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {onSaveVersion && filesCount > 0 && (
            <button
              onClick={onSaveVersion}
              className="h-6 flex items-center gap-1 px-2 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              title="Save Version Snapshot"
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}

          <button
            onClick={onReparse}
            className="h-6 flex items-center gap-1 px-2 rounded hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer"
            title="Re-run deterministic extraction"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reparse</span>
          </button>

          {filesCount > 0 && (
            <button
              onClick={onSwitchToFilesView}
              className="h-6 flex items-center gap-1 px-2.5 rounded bg-white text-black font-semibold text-[11px] hover:bg-neutral-200 transition-colors uppercase cursor-pointer"
            >
              <span>Files ({filesCount})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Active Version Notice Banner */}
      {activeCheckpoint && (
        <div className="border-b border-[#24242a] bg-[#14141c] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#3b82f6] shrink-0" />
            <div>
              <span className="font-bold text-white uppercase text-[11px]">
                Incremental Mode Active
              </span>
              <p className="text-[11px] text-neutral-300">
                Pasting snippets here will update matching files in saved version &quot;{activeCheckpoint.name}&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearActiveBaseline}
              className="flex items-center gap-1 border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white hover:border-white rounded transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Exit Patch Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Unsaved Source Warning Banner */}
      {hasUnsavedChanges && (
        <div className="border-b border-amber-500/30 bg-[#1e1a12] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold uppercase text-[11px]">Unsaved Source Changes</span>
              <p className="text-[11px] text-amber-200/80">
                You have modified the project transcript without saving a version snapshot.
              </p>
            </div>
          </div>

          {onSaveVersion && (
            <button
              onClick={onSaveVersion}
              className="flex items-center gap-1.5 bg-amber-400 text-black px-2.5 py-1 text-xs font-semibold rounded uppercase hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Save Version</span>
            </button>
          )}
        </div>
      )}

      {/* Breadcrumb / Stats Toolbar */}
      <div className="h-7 border-b border-[#222228] px-3 bg-[#16161a] flex items-center justify-between text-[11px] text-neutral-400 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>Markdown Source</span>
          <span>·</span>
          <span>{linesCount} lines</span>
          <span>·</span>
          <span>{formatBytes(bytesCount)}</span>
        </div>
        <div className="text-[10px] text-neutral-500">
          Markdown / Plaintext
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex bg-[#18181c]">
        {/* Line numbers gutter */}
        <div className="select-none py-3 pl-3 pr-4 text-right text-neutral-500 bg-[#16161a] border-r border-[#24242a] shrink-0 font-mono text-xs leading-relaxed">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={rawText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={`Paste your markdown transcript, code blocks, or directory tree here...

Example:
my-project/
├── package.json
└── src/index.ts

\`\`\`json package.json
{
  "name": "my-project",
  "version": "1.0.0"
}
\`\`\`

\`\`\`typescript src/index.ts
console.log("Hello from iLoveFree!");
\`\`\``}
          className="flex-1 h-full min-h-full p-3 bg-transparent text-white font-mono text-xs resize-none focus:outline-none leading-relaxed border-none whitespace-pre placeholder:text-neutral-600"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
