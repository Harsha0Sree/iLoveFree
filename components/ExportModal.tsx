'use client';

import React, { useState } from 'react';
import { ProjectFile, DiagnosticIssue } from '@/lib/parser';
import { generateProjectZip, triggerBlobDownload } from '@/lib/zip';
import { Download, X, FileArchive, Check, ShieldAlert, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, ProjectFile>;
  diagnostics: DiagnosticIssue[];
  defaultProjectName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  files,
  diagnostics,
  defaultProjectName = 'project-bundle',
}) => {
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [includeAuditReport, setIncludeAuditReport] = useState(true);
  const [includeMissingPlaceholders, setIncludeMissingPlaceholders] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen) return null;

  const fileEntries = Object.entries(files);
  const totalFiles = fileEntries.length;
  const missingFiles = fileEntries.filter(([_, f]) => f.isMissingContent);
  const truncatedFiles = fileEntries.filter(([_, f]) => f.hasTruncationWarning);
  const duplicateFiles = fileEntries.filter(([_, f]) => f.isDuplicate);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  const handleDownload = async () => {
    setIsZipping(true);
    try {
      const result = await generateProjectZip(files, {
        projectName: projectName.trim() || 'project-bundle',
        includeAuditReport,
        includeMissingPlaceholders,
        diagnostics,
      });

      triggerBlobDownload(result.blob, result.fileName);
      setDownloadCompleted(true);
      setTimeout(() => {
        setDownloadCompleted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-xl shadow-2xl rounded-lg overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-[#111111]">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Export Project ZIP
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Diagnostic Pre-flight Warning */}
          {errors.length > 0 && (
            <div className="border border-neutral-700 bg-black p-3 rounded-md flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase text-white">
                  Integrity Pre-Flight Notice ({errors.length} Missing Item{errors.length > 1 ? 's' : ''})
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Some tree-declared files had no code blocks in the transcript.
                  They will be packaged as empty stubs according to your options below.
                </p>
              </div>
            </div>
          )}

          {/* Configuration Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                Project Archive Name (.zip)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="project-bundle"
                  className="flex-1 bg-black border border-neutral-700 px-3 py-2 rounded-l-md text-white font-mono focus:outline-none focus:border-white"
                />
                <span className="bg-[#181818] border border-l-0 border-neutral-700 px-3 py-2 rounded-r-md text-neutral-400">
                  .zip
                </span>
              </div>
            </div>

            <div className="border border-neutral-800 bg-[#111111] p-3 rounded-md space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">
                Packaging Options
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                <input
                  type="checkbox"
                  checked={includeAuditReport}
                  onChange={(e) => setIncludeAuditReport(e.target.checked)}
                  className="accent-white rounded"
                />
                <span>Generate <code>AUDIT_REPORT.md</code> inside root folder</span>
              </label>

              {missingFiles.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                  <input
                    type="checkbox"
                    checked={includeMissingPlaceholders}
                    onChange={(e) => setIncludeMissingPlaceholders(e.target.checked)}
                    className="accent-white rounded"
                  />
                  <span>
                    Include placeholder files for {missingFiles.length} missing tree items
                  </span>
                </label>
              )}
            </div>

            {/* Files Summary Manifest */}
            <div className="border border-neutral-800 p-3 rounded-md text-[11px] text-neutral-400 flex flex-wrap justify-between gap-2">
              <div>
                <span className="text-white font-bold">{totalFiles}</span> Total Files
              </div>
              <div>
                <span className="text-white font-bold">{truncatedFiles.length}</span> Truncated
              </div>
              <div>
                <span className="text-white font-bold">{duplicateFiles.length}</span> Duplicates
              </div>
              <div>
                <span className="text-white font-bold">{missingFiles.length}</span> Missing
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-800 p-4 bg-[#111111]">
          <button
            onClick={onClose}
            className="h-8 px-4 border border-neutral-700 rounded-md text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer uppercase"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isZipping || totalFiles === 0}
            className={`h-8 flex items-center gap-2 px-4 rounded-md text-xs font-semibold uppercase transition-all cursor-pointer ${
              downloadCompleted
                ? 'bg-neutral-800 text-white border border-white'
                : 'bg-white text-black hover:bg-neutral-200 border border-white'
            }`}
          >
            {downloadCompleted ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Downloaded!</span>
              </>
            ) : isZipping ? (
              <span>Packing ZIP...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
