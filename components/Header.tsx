'use client';

import React from 'react';
import { ProjectCheckpoint } from '@/lib/checkpoints';
import {
  Cpu,
  Download,
  Bookmark,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FolderTree,
} from 'lucide-react';
import { ToolsMenu } from './ToolsMenu';
import { ParserOptions } from '@/lib/parser';

interface HeaderProps {
  viewMode: 'source' | 'files';
  onChangeViewMode: (mode: 'source' | 'files') => void;
  filesCount: number;
  errorCount: number;
  warningCount: number;
  activeCheckpoint: ProjectCheckpoint | null;
  savedCheckpointsCount: number;
  onOpenCheckpoints: () => void;
  onOpenAudit: () => void;
  onOpenExport: () => void;
  onOpenTree: () => void;
  onOpenManifest: () => void;
  onOpenHelp: () => void;
  onClear: () => void;
  options: ParserOptions;
  onChangeOptions: (opts: ParserOptions) => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  filesCount,
  errorCount,
  warningCount,
  activeCheckpoint,
  savedCheckpointsCount,
  onOpenCheckpoints,
  onOpenAudit,
  onOpenExport,
  onOpenTree,
  onOpenManifest,
  onOpenHelp,
  onClear,
  options,
  onChangeOptions,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-black sticky top-0 z-40 px-3 py-2 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Primary View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-white px-2 py-1 bg-black shrink-0">
            <Cpu className="w-3.5 h-3.5 text-white" />
            <span className="font-bold text-xs tracking-wider uppercase">REPO_EXTRACT</span>
          </div>

          {/* Primary View Switcher */}
          <div className="flex items-center border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              onClick={() => onChangeViewMode('source')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
                viewMode === 'source'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Source Text</span>
            </button>

            <button
              onClick={() => onChangeViewMode('files')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
                viewMode === 'files'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>Project Files</span>
              <span
                className={`text-[10px] px-1 font-mono ${
                  viewMode === 'files' ? 'bg-black text-white' : 'bg-neutral-900 text-neutral-400'
                }`}
              >
                {filesCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Action Tools & Overlays */}
        <div className="flex items-center gap-2">
          {/* Checkpoint Badge / Launcher */}
          <button
            onClick={onOpenCheckpoints}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
              activeCheckpoint
                ? 'border-white bg-white text-black font-bold'
                : 'border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600'
            }`}
            title="Manage project checkpoints & incremental patch mode"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {activeCheckpoint ? `Baseline: ${activeCheckpoint.name.slice(0, 15)}...` : 'Checkpoints'}
            </span>
            <span
              className={`text-[9px] px-1 font-bold ${
                activeCheckpoint ? 'bg-black text-white' : 'border border-neutral-700 text-neutral-400'
              }`}
            >
              {savedCheckpointsCount}
            </span>
          </button>

          {/* Audit Status Button (Opens Audit Modal on click!) */}
          <button
            onClick={onOpenAudit}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
              errorCount > 0
                ? 'border-white bg-white text-black font-bold'
                : warningCount > 0
                ? 'border-neutral-500 text-white bg-neutral-900'
                : 'border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Inspect project integrity audits"
          >
            {errorCount > 0 ? (
              <>
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{errorCount} Error{errorCount > 1 ? 's' : ''}</span>
              </>
            ) : warningCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-neutral-300" />
                <span>{warningCount} Warning{warningCount > 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Verified</span>
              </>
            )}
          </button>

          {/* Tools Menu Popup */}
          <ToolsMenu
            onOpenTree={onOpenTree}
            onOpenManifest={onOpenManifest}
            onOpenHelp={onOpenHelp}
            onClear={onClear}
            options={options}
            onChangeOptions={onChangeOptions}
          />

          {/* Export ZIP Action Button */}
          <button
            onClick={onOpenExport}
            disabled={filesCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-all cursor-pointer ${
              filesCount === 0
                ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                : 'bg-white text-black hover:bg-neutral-200 border border-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
