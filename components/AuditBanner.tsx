'use client';

import React from 'react';
import { DiagnosticIssue } from '@/lib/parser';
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface AuditBannerProps {
  diagnostics: DiagnosticIssue[];
  filesCount: number;
  onNavigateToAudit: () => void;
}

export const AuditBanner: React.FC<AuditBannerProps> = ({
  diagnostics,
  filesCount,
  onNavigateToAudit,
}) => {
  if (filesCount === 0) return null;

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (hasErrors) {
    return (
      <div className="bg-black border-b-2 border-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-black p-0.5">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-white">
              [CRITICAL AUDIT ALERT]
            </span>
            <span className="text-white ml-2">
              {errors.length} fatal integrity issue{errors.length > 1 ? 's' : ''} detected. (
              {errors[0].title})
            </span>
          </div>
        </div>

        <button
          onClick={onNavigateToAudit}
          className="flex items-center gap-1 bg-white text-black px-2.5 py-0.5 font-bold uppercase hover:bg-neutral-200 transition-colors text-[11px] cursor-pointer"
        >
          <span>Inspect {errors.length} Issue{errors.length > 1 ? 's' : ''}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (hasWarnings) {
    return (
      <div className="bg-black border-b border-neutral-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="border border-white p-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-neutral-200">
              [INTEGRITY AUDIT]
            </span>
            <span className="text-neutral-400 ml-2">
              {warnings.length} warning{warnings.length > 1 ? 's' : ''} detected: {warnings[0].title}
            </span>
          </div>
        </div>

        <button
          onClick={onNavigateToAudit}
          className="flex items-center gap-1 border border-neutral-700 px-2 py-0.5 text-neutral-300 hover:text-white hover:border-white transition-colors text-[11px] cursor-pointer"
        >
          <span>View Audit Log ({warnings.length})</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs text-neutral-400">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        <span>
          <strong className="text-white font-bold">[100% INTEGRITY VERIFIED]:</strong> All {filesCount} files mapped deterministically without collisions, omissions, or syntax truncations.
        </span>
      </div>
      <span className="text-[10px] text-neutral-500 hidden sm:inline uppercase">
        Zero Silent Failures
      </span>
    </div>
  );
};
