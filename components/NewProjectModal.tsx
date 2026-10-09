'use client';

import React, { useState, useRef } from 'react';
import { ProjectFile } from '@/lib/parser';
import { processUploadedFiles } from '@/lib/folder-upload';
import {
  X,
  Plus,
  FolderUp,
  FileUp,
  FileText,
  Code2,
  FileJson,
  KeyRound,
  File,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  Folder,
  Check,
} from 'lucide-react';
import { Workspace } from './FigmaProjectsDashboard';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  defaultWorkspaceId?: string;
  initialFiles?: Record<string, ProjectFile>;
  initialTitle?: string;
  initialTranscript?: string;
  onCreateProject: (
    title: string,
    transcript: string,
    explicitFiles?: Record<string, ProjectFile>,
    workspaceId?: string
  ) => Promise<void>;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  defaultWorkspaceId = 'default',
  initialFiles = {},
  initialTitle = '',
  initialTranscript = '',
  onCreateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'transcript'>('transcript');
  const [projectTitle, setProjectTitle] = useState(initialTitle);
  const [targetWorkspace, setTargetWorkspace] = useState(defaultWorkspaceId);
  const [stagedFiles, setStagedFiles] = useState<Record<string, ProjectFile>>(initialFiles);
  const [transcriptText, setTranscriptText] = useState(initialTranscript);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const transcriptFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const renderFileIcon = (path: string) => {
    const lower = path.toLowerCase();
    if (lower.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-[#519aba] shrink-0" />;
    }
    if (lower.startsWith('.env') || lower.includes('/.env')) {
      return <KeyRound className="w-4 h-4 text-neutral-400 shrink-0" />;
    }
    if (lower.endsWith('.json') || lower.endsWith('.toml')) {
      return <FileJson className="w-4 h-4 text-[#cbcb41] shrink-0" />;
    }
    if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx')) {
      return <Code2 className="w-4 h-4 text-[#3178c6] shrink-0" />;
    }
    if (/\.(png|jpe?g|gif|svg|webp|ico|bmp|avif)$/i.test(lower)) {
      return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (/\.(mp4|webm|ogg|mov|m4v|mkv|avi)$/i.test(lower)) {
      return <Film className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (/\.(mp3|wav|ogg|aac|flac)$/i.test(lower)) {
      return <Music className="w-4 h-4 text-pink-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  const handleStageFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await processUploadedFiles(files);
      setStagedFiles((prev) => ({
        ...prev,
        ...result.files,
      }));
      // Do not auto-enter project name same as file uploaded
      setActiveTab('files');
    } catch (err) {
      console.error('Failed to process uploaded files:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (pathToRemove: string) => {
    setStagedFiles((prev) => {
      const updated = { ...prev };
      delete updated[pathToRemove];
      return updated;
    });
  };

  const handleClearAllFiles = () => {
    setStagedFiles({});
  };

  const handleTranscriptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setTranscriptText(text);
        // Do not auto-enter project name same as file uploaded
        setActiveTab('transcript');
      } catch (err) {
        console.error('Failed to read transcript file:', err);
      }
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = projectTitle.trim();
    if (!finalTitle) return;

    setIsSubmitting(true);
    try {
      if (activeTab === 'files') {
        const fileCount = Object.keys(stagedFiles).length;
        if (fileCount === 0) return;
        await onCreateProject(
          finalTitle,
          `# ${finalTitle}\n\nProject files: ${fileCount}`,
          stagedFiles,
          targetWorkspace
        );
      } else {
        if (!transcriptText.trim()) return;
        await onCreateProject(finalTitle, transcriptText, undefined, targetWorkspace);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stagedFilesList = Object.values(stagedFiles);
  const totalBytes = stagedFilesList.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const isFilesMode = activeTab === 'files';
  const canSubmit =
    projectTitle.trim().length > 0 &&
    (isFilesMode ? stagedFilesList.length > 0 : transcriptText.trim().length > 0) &&
    !isProcessing &&
    !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 font-sans select-none">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleStageFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in Chromium/Firefox/Safari
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleStageFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={transcriptFileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json"
        className="hidden"
        onChange={handleTranscriptFileUpload}
      />

      <div className="bg-[#141417] border border-[#2b2b36] w-full max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-[#24242e] flex items-center justify-between bg-[#17171b] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Folder className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Create New Project</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consistent Tab Switcher - AI Transcript is first */}
        <div className="px-6 pt-3 pb-2 border-b border-[#24242e] bg-[#161619] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Files & Folders</span>
            {stagedFilesList.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'files' ? 'bg-black/15 text-black' : 'bg-white/15 text-white'
              }`}>
                {stagedFilesList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-5">
          {/* Row 1: Project Name & Workspace with Consistent Sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project name..."
                className="w-full h-10 px-3.5 bg-[#1b1b20] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Workspace
              </label>
              <select
                value={targetWorkspace}
                onChange={(e) => setTargetWorkspace(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#1b1b20] border border-[#2e2e38] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode 1: Files & Folders Staging & Review */}
          {activeTab === 'files' ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Upload Action Buttons (Consistent Sizes) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 px-4 rounded-lg bg-[#22222a] hover:bg-[#2b2b34] border border-[#353542] text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileUp className="w-4 h-4 text-emerald-400" />
                    <span>Select Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="h-10 px-4 rounded-lg bg-[#22222a] hover:bg-[#2b2b34] border border-[#353542] text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4 text-amber-400" />
                    <span>Select Folder</span>
                  </button>
                </div>

                {stagedFilesList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="h-10 px-3 text-xs text-neutral-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {/* Review Area */}
              {isProcessing ? (
                <div className="h-48 border border-[#272733] rounded-xl flex flex-col items-center justify-center text-center bg-[#17171d]">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-white text-xs font-medium">Processing files...</p>
                </div>
              ) : stagedFilesList.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-52 border border-dashed border-[#2f2f3d] rounded-xl flex flex-col items-center justify-center text-center p-6 bg-[#17171e]/50 hover:bg-[#17171e] hover:border-neutral-500 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#22222a] flex items-center justify-center text-neutral-400 mb-3">
                    <FolderUp className="w-6 h-6 text-neutral-300" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">Select files or a folder to get started</h4>
                  <p className="text-neutral-400 text-xs max-w-sm">
                    Upload code, images, videos, audio, or PDFs. You can review all files and edit the project name before creating.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-medium px-1">
                    <span>
                      Review Staged Files ({stagedFilesList.length}) · {formatFileSize(totalBytes)}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Remove files or add more before creating
                    </span>
                  </div>

                  <div className="flex-1 max-h-56 min-h-[140px] overflow-y-auto space-y-1.5 pr-1 border border-[#272733] rounded-xl p-2 bg-[#121215]">
                    {stagedFilesList.map((file) => (
                      <div
                        key={file.path}
                        className="h-10 px-3 rounded-lg bg-[#18181f] border border-[#252530] flex items-center justify-between gap-3 text-xs hover:border-[#383848] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {renderFileIcon(file.path)}
                          <span className="font-mono text-white text-xs truncate max-w-sm sm:max-w-md" title={file.path}>
                            {file.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-neutral-400 font-mono text-[11px]">
                            {formatFileSize(file.sizeBytes || file.content.length)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.path)}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors rounded cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: AI Transcript */
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">
                  Markdown Transcript Content
                </label>
                <button
                  type="button"
                  onClick={() => transcriptFileInputRef.current?.click()}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Import .md or .txt file
                </button>
              </div>

              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste AI markdown transcript containing file code blocks..."
                className="w-full flex-1 min-h-[200px] p-3.5 bg-[#1b1b20] border border-[#2e2e38] rounded-xl text-white text-xs font-mono resize-none focus:outline-none focus:border-white leading-relaxed placeholder:text-neutral-600"
                required
              />
            </div>
          )}

          {/* Modal Footer with Consistent Sizing */}
          <div className="pt-4 border-t border-[#24242e] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-lg border border-[#30303c] text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`h-10 px-6 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                canSubmit
                  ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer shadow-sm'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
