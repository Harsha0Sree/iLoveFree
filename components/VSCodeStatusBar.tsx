'use client';

import React from 'react';
import { ProjectCheckpoint } from '@/lib/checkpoints';
import {
  GitBranch,
  XCircle,
  AlertTriangle,
  RotateCw,
  Radio,
  Search,
  Check,
  Code2,
} from 'lucide-react';

interface VSCodeStatusBarProps {
  activeCheckpoint: ProjectCheckpoint | null;
  errorCount: number;
  warningCount: number;
  activeLanguage: string;
  activeLinesCount: number;
  activeBytesCount: number;
  onToggleBottomPanel: () => void;
  onOpenCheckpoints: () => void;
}

export const VSCodeStatusBar: React.FC<VSCodeStatusBarProps> = ({
  activeCheckpoint,
  errorCount,
  warningCount,
  activeLanguage,
  activeLinesCount,
  activeBytesCount,
  onToggleBottomPanel,
  onOpenCheckpoints,
}) => {
  const languageFormatted =
    activeLanguage === 'plaintext' || !activeLanguage
      ? 'Markdown'
      : activeLanguage.charAt(0).toUpperCase() + activeLanguage.slice(1);

  return (
    <footer className="h-6 w-full bg-[#09090b] border-none flex items-center justify-between px-3 text-[11px] font-mono text-neutral-400 select-none shrink-0 overflow-x-auto no-scrollbar">
      {/* Left Status Bar Items */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Git Branch & Sync */}
        <button
          onClick={onOpenCheckpoints}
          className="flex items-center gap-1 text-neutral-300 hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
          title="Git Branch: main* (Click for versions)"
        >
          <GitBranch className="w-3 h-3 text-neutral-400" />
          <span>main*</span>
          <RotateCw className="w-2.5 h-2.5 text-neutral-500 ml-0.5" />
        </button>

        {/* Problems & Audits Toggle */}
        <button
          onClick={onToggleBottomPanel}
          className="flex items-center gap-2 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
          title="Toggle Problems & Diagnostics"
        >
          <span className="flex items-center gap-0.5 text-neutral-300 hover:text-white">
            <XCircle className="w-3 h-3 text-white" />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-0.5 text-neutral-400">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{warningCount}</span>
          </span>
        </button>
      </div>

      {/* Right Status Bar Items */}
      <div className="flex items-center gap-3 shrink-0 text-neutral-400 text-[11px]">
        <span className="hidden sm:inline hover:text-white cursor-pointer">
          Ln {activeLinesCount || 1}, Col 1
        </span>
        <span className="hidden md:inline hover:text-white cursor-pointer">Spaces: 2</span>
        <span className="hidden sm:inline hover:text-white cursor-pointer">UTF-8</span>
        <span className="hidden sm:inline hover:text-white cursor-pointer">LF</span>

        {/* Language selector */}
        <span className="text-neutral-300 hover:text-white cursor-pointer flex items-center gap-1">
          <span className="text-[#3b82f6]">&#123; &#125;</span>
          <span>{languageFormatted}</span>
        </span>
      </div>
    </footer>
  );
};
