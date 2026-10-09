'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectFile } from '@/lib/parser';
import { formatCode } from '@/lib/formatter';
import { CodeHighlighter } from '@/components/CodeHighlighter';
import {
  Copy,
  Check,
  Edit3,
  Save,
  AlertTriangle,
  AlertOctagon,
  FileCode,
  FileText,
  Layers,
  CheckCheck,
  X,
  ChevronRight,
  Upload,
  Code2,
  FileJson,
  KeyRound,
  File,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Film,
  Image as ImageIcon,
  Music,
} from 'lucide-react';

interface FileViewerProps {
  file: ProjectFile | null;
  openFiles: string[];
  activePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseTab: (path: string) => void;
  onUpdateContent: (path: string, newContent: string) => void;
  onRenamePath: (oldPath: string, newPath: string) => void;
  onUploadTranscript?: () => void;
  onOpenSource?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  file,
  openFiles,
  activePath,
  onSelectFile,
  onCloseTab,
  onUpdateContent,
  onRenamePath,
  onUploadTranscript,
  onOpenSource,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(file?.content || '');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file?.path || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(1);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [, setSelectedBlockIdx] = useState<number | null>(
    file?.sourceBlockIndices[0] || null
  );

  const lines = useMemo(() => {
    if (!file) return [''];
    return (isEditing ? editContent : file.content).split('\n');
  }, [file, isEditing, editContent]);

  const [prevFile, setPrevFile] = useState(file);
  if (file !== prevFile) {
    setPrevFile(file);
    setEditContent(file?.content || '');
    setRenameValue(file?.path || '');
    setIsEditing(false);
    setImageZoom(1);
  }

  // Keyboard shortcut Ctrl+S / Cmd+S to auto-format and save edits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (file) {
          const raw = isEditing ? editContent : file.content;
          const formatted = formatCode(raw, file.language);
          if (isEditing) setEditContent(formatted);
          onUpdateContent(file.path, formatted);
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, file, editContent, onUpdateContent]);

  const renderFileIcon = (path: string) => {
    const lower = path.toLowerCase();
    if (lower === '.gitignore' || lower.endsWith('/.gitignore')) {
      return (
        <span className="w-3.5 h-3.5 flex items-center justify-center text-[#f34f29] font-bold text-[10px] shrink-0">
          ◆
        </span>
      );
    }
    if (lower.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-[#519aba] shrink-0" />;
    }
    if (lower.startsWith('.env') || lower.includes('/.env')) {
      return <KeyRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
    if (lower.endsWith('.json') || lower.endsWith('.toml')) {
      return <FileJson className="w-3.5 h-3.5 text-[#cbcb41] shrink-0" />;
    }
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
      return <Code2 className="w-3.5 h-3.5 text-[#3178c6] shrink-0" />;
    }
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) {
      return <Code2 className="w-3.5 h-3.5 text-[#f1e05a] shrink-0" />;
    }
    if (lower.endsWith('.py')) {
      return <Code2 className="w-3.5 h-3.5 text-[#3572a5] shrink-0" />;
    }
    if (/\.(png|jpe?g|gif|svg|webp|ico|bmp|avif|tiff?)$/i.test(lower)) {
      return <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (/\.(mp4|webm|ogg|mov|m4v|mkv|avi|wmv)$/i.test(lower)) {
      return <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    if (/\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(lower)) {
      return <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  };

  const isImage = Boolean(
    file &&
    ((file.isBinary && file.mimeType?.startsWith('image/')) ||
      file.content?.startsWith('data:image/') ||
      file.dataUrl?.startsWith('data:image/') ||
      /\.(png|jpe?g|gif|svg|webp|ico|bmp|avif|tiff?)$/i.test(file.path.toLowerCase()))
  );

  const isVideo = Boolean(
    file &&
    ((file.isBinary && file.mimeType?.startsWith('video/')) ||
      file.content?.startsWith('data:video/') ||
      file.dataUrl?.startsWith('data:video/') ||
      /\.(mp4|webm|ogg|mov|m4v|mkv|avi|wmv)$/i.test(file.path.toLowerCase()))
  );

  const isAudio = Boolean(
    file &&
    ((file.isBinary && file.mimeType?.startsWith('audio/')) ||
      file.content?.startsWith('data:audio/') ||
      file.dataUrl?.startsWith('data:audio/') ||
      /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(file.path.toLowerCase()))
  );

  const isPdf = Boolean(
    file &&
    (file.mimeType === 'application/pdf' ||
      file.content?.startsWith('data:application/pdf') ||
      file.dataUrl?.startsWith('data:application/pdf') ||
      file.path.toLowerCase().endsWith('.pdf'))
  );

  const isOtherBinary = Boolean(
    file &&
    (file.isBinary || file.content.startsWith('data:')) &&
    !isImage &&
    !isVideo &&
    !isAudio &&
    !isPdf
  );

  const isBinaryAsset = isImage || isVideo || isAudio || isPdf || isOtherBinary;

  const handleDownloadFile = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href =
      file.dataUrl ||
      (file.content.startsWith('data:')
        ? file.content
        : `data:text/plain;charset=utf-8,${encodeURIComponent(file.content)}`);
    a.download = file.path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-400 bg-[#16161a] select-none font-mono">
        <div className="w-14 h-14 rounded-2xl bg-[#1c1c22] border border-[#27272e] flex items-center justify-center mb-4 shadow-sm">
          <Code2 className="w-7 h-7 text-neutral-400" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-white mb-1">
          No File Open
        </p>
        <p className="text-xs text-neutral-400 mb-6 max-w-sm text-center leading-relaxed">
          Select a file from the explorer on the left, or upload an existing folder/transcript.
        </p>

        <div className="flex flex-wrap gap-2.5 justify-center">
          {onUploadTranscript && (
            <button
              onClick={onUploadTranscript}
              className="h-8 flex items-center gap-1.5 px-3.5 bg-white text-black hover:bg-neutral-200 rounded-md text-xs font-semibold uppercase transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Project</span>
            </button>
          )}

          {onOpenSource && (
            <button
              onClick={onOpenSource}
              className="h-8 flex items-center gap-1.5 px-3.5 bg-[#202026] hover:bg-[#282830] border border-[#30303a] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Source Transcript</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!file) return;
    const formatted = formatCode(editContent, file.language);
    setEditContent(formatted);
    onUpdateContent(file.path, formatted);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || renameValue === file.path) {
      setIsRenaming(false);
      return;
    }
    onRenamePath(file.path, renameValue.trim());
    setIsRenaming(false);
  };

  const pathParts = file.path.split('/');

  return (
    <div className="flex flex-col h-full bg-[#18181c] overflow-hidden font-mono select-text">
      {/* 1. VS Code Editor Tabs Bar matching screenshot */}
      <div className="h-9 bg-[#141418] border-b border-[#24242a] flex items-center justify-between shrink-0 select-none overflow-x-auto no-scrollbar">
        <div className="flex items-center h-full overflow-x-auto no-scrollbar">
          {openFiles.map((p) => {
            const isActive = p === activePath;
            const fileName = p.split('/').pop() || p;

            return (
              <div
                key={p}
                onClick={() => onSelectFile(p)}
                className={`h-full px-3 flex items-center gap-2 border-r border-[#24242a] text-xs cursor-pointer transition-colors group shrink-0 ${
                  isActive
                    ? 'bg-[#18181c] text-white border-t-2 border-t-[#3b82f6] font-medium'
                    : 'bg-[#141418] text-neutral-400 hover:bg-[#18181c]/70 hover:text-white'
                }`}
              >
                {renderFileIcon(fileName)}
                <span className="truncate max-w-[140px]">{fileName}</span>
                {file.path === p && file.isPatched && (
                  <span className="text-[#e2b340] text-[10px] font-bold">M</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(p);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-0.5 rounded text-neutral-400 hover:text-white transition-opacity"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. VS Code Breadcrumb & Toolbar */}
      <div className="h-7 border-b border-[#222228] px-3 bg-[#16161a] flex items-center justify-between gap-2 shrink-0 select-none text-[11px]">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1 text-neutral-400 truncate min-w-0">
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />}
              <span className={idx === pathParts.length - 1 ? 'text-white font-semibold' : 'text-neutral-400'}>
                {part}
              </span>
            </React.Fragment>
          ))}

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1 ml-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-6 bg-black border border-white text-xs px-2 text-white font-mono rounded focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="h-6 bg-white text-black px-2 text-xs font-bold uppercase rounded cursor-pointer hover:bg-neutral-200 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="h-6 w-6 text-neutral-400 hover:text-white rounded flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="text-[10px] text-neutral-500 hover:text-white ml-1.5 underline cursor-pointer"
              title="Rename file path"
            >
              [rename]
            </button>
          )}

          {file.isPatched && (
            <span className="text-[9px] text-[#e2b340] bg-[#e2b340]/10 border border-[#e2b340]/30 px-1 font-semibold rounded-sm ml-1.5">
              Modified
            </span>
          )}
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {savedSuccess && (
            <span className="text-white text-xs flex items-center gap-1 mr-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Formatted &amp; Saved!
            </span>
          )}

          {isImage && (
            <div className="flex items-center gap-1 bg-[#101014] border border-[#26262e] rounded px-1.5 py-0.5 mr-1">
              <button
                type="button"
                onClick={() => setImageZoom((z) => Math.max(0.2, z - 0.2))}
                className="p-1 hover:text-white text-neutral-400 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setImageZoom(1)}
                className="px-1 text-[11px] font-mono hover:text-white text-neutral-300 cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(imageZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setImageZoom((z) => Math.min(3, z + 0.2))}
                className="p-1 hover:text-white text-neutral-400 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isBinaryAsset && (
            <button
              type="button"
              onClick={handleDownloadFile}
              className="h-6 flex items-center gap-1 px-2 text-xs bg-white text-black font-semibold rounded hover:bg-neutral-200 transition-colors cursor-pointer mr-1"
              title="Download file asset"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}

          {!isBinaryAsset && (
            <>
              {/* Edit Mode Toggle */}
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdit();
                    setIsEditing(false);
                  } else {
                    setEditContent(file.content);
                    setIsEditing(true);
                  }
                }}
                className={`h-6 flex items-center gap-1 px-2 text-xs rounded transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Done' : 'Edit'}</span>
              </button>

              {isEditing && (
                <button
                  onClick={handleSaveEdit}
                  className="h-6 flex items-center gap-1 px-2 text-xs bg-white text-black font-semibold uppercase hover:bg-neutral-200 rounded transition-colors cursor-pointer"
                  title="Save current file (Ctrl+S / Cmd+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={handleCopy}
            className="h-6 flex items-center gap-1 px-2 text-xs text-neutral-300 hover:bg-white/10 hover:text-white rounded transition-colors cursor-pointer"
            title="Copy content / path"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : isBinaryAsset ? 'Copy Path' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Revision switcher banner if multiple blocks for this path */}
      {file.allBlocks && file.allBlocks.length > 1 && (
        <div className="bg-[#141418] border-b border-[#24242a] px-3 py-1 flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-white" />
            <span className="font-bold text-[11px]">Revisions ({file.allBlocks.length}):</span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            {file.allBlocks.map((blk, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedBlockIdx(blk.blockIndex);
                  setEditContent(blk.content);
                  onUpdateContent(file.path, blk.content);
                }}
                className={`px-1.5 py-0.5 border cursor-pointer rounded ${
                  file.content === blk.content
                    ? 'border-white bg-white text-black font-bold'
                    : 'border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Block #{blk.blockIndex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Missing Content Alert Banner */}
      {file.isMissingContent && (
        <div className="bg-[#1e1414] border-b border-amber-500/30 p-2.5 flex items-start gap-2 text-xs shrink-0 select-none">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px]">
            <span className="font-bold text-amber-300 uppercase">Missing Code Implementation: </span>
            <span className="text-neutral-300">
              Declared in tree, but no code block was provided in transcript. Click &apos;Edit&apos; to supply code.
            </span>
          </div>
        </div>
      )}

      {/* Truncation Warning Banner */}
      {file.hasTruncationWarning && (
        <div className="bg-[#1e1c14] border-b border-amber-500/30 p-2 flex items-start gap-2 text-xs shrink-0 select-none">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px]">
            <span className="font-bold text-amber-300 uppercase">Truncation detected: </span>
            <span className="text-neutral-400 font-mono text-[10px]">
              {file.truncationNotes[0]}
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Content: Image Preview / Video Player / Audio / Binary / Code Editor */}
      {isImage ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0f0f14] overflow-auto select-none">
          <div
            className="p-4 sm:p-8 rounded-xl max-w-full max-h-[75vh] flex items-center justify-center overflow-auto shadow-2xl border border-[#272730]"
            style={{
              backgroundImage: 'radial-gradient(#2c2c38 1px, transparent 1px)',
              backgroundColor: '#0c0c10',
              backgroundSize: '16px 16px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.dataUrl || file.content}
              alt={file.path}
              style={{
                transform: `scale(${imageZoom})`,
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-[60vh] object-contain transition-transform duration-150 rounded shadow-md"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-neutral-400 text-xs font-mono">
            <span>{file.sizeBytes ? (file.sizeBytes / 1024).toFixed(1) : (file.content.length / 1024).toFixed(1)} KB</span>
            <span>•</span>
            <span className="uppercase">{file.language || 'IMAGE'}</span>
            <span>•</span>
            <span>Zoom: {Math.round(imageZoom * 100)}%</span>
          </div>
        </div>
      ) : isVideo ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0d0d10] overflow-auto select-none">
          <div className="w-full max-w-4xl rounded-xl overflow-hidden border border-[#272732] bg-black shadow-2xl aspect-video flex items-center justify-center">
            <video
              controls
              playsInline
              src={file.dataUrl || file.content}
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video preview.
            </video>
          </div>
          <div className="mt-3 flex items-center gap-3 text-neutral-400 text-xs font-mono">
            <span>{file.sizeBytes ? (file.sizeBytes / (1024 * 1024)).toFixed(2) : (file.content.length / (1024 * 1024)).toFixed(2)} MB</span>
            <span>•</span>
            <span className="uppercase">{file.language || 'VIDEO'}</span>
          </div>
        </div>
      ) : isAudio ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#101014] select-none">
          <div className="p-8 rounded-2xl bg-[#181820] border border-[#282834] shadow-2xl flex flex-col items-center text-center max-w-md w-full">
            <Music className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-white text-sm font-semibold mb-1 truncate max-w-full">{file.path}</h3>
            <p className="text-neutral-400 text-xs font-mono mb-6">{file.sizeBytes ? (file.sizeBytes / 1024).toFixed(1) : (file.content.length / 1024).toFixed(1)} KB</p>
            <audio controls src={file.dataUrl || file.content} className="w-full" />
          </div>
        </div>
      ) : isPdf ? (
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 bg-[#0d0d10] overflow-hidden select-none">
          <div className="w-full h-full rounded-xl overflow-hidden border border-[#272732] bg-white shadow-2xl flex flex-col">
            <iframe
              src={file.dataUrl || file.content}
              title={file.path}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      ) : isOtherBinary ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#101014] select-none">
          <div className="p-8 rounded-2xl bg-[#181820] border border-[#282834] shadow-2xl flex flex-col items-center text-center max-w-md w-full">
            <File className="w-12 h-12 text-neutral-400 mb-4" />
            <h3 className="text-white text-sm font-semibold mb-1 truncate max-w-full">{file.path}</h3>
            <p className="text-neutral-400 text-xs font-mono mb-2">{file.sizeBytes ? (file.sizeBytes / 1024).toFixed(1) : (file.content.length / 1024).toFixed(1)} KB</p>
            <p className="text-neutral-500 text-[11px] mb-6">Binary File Asset</p>
            <button
              onClick={handleDownloadFile}
              className="h-9 px-4 bg-white text-black hover:bg-neutral-200 font-semibold rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Independent Scrollable Code Editor Area with Line Highlight */
        <div className="flex-1 flex min-h-0 relative bg-[#18181c] overflow-hidden">
          {isEditing ? (
            <div className="flex w-full min-h-full">
              {/* Line numbers gutter for editor */}
              <div className="select-none py-3 pl-2 pr-3 text-right text-neutral-500 bg-[#16161a] border-r border-[#24242a] shrink-0 font-mono text-xs leading-relaxed">
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 h-full min-h-full p-3 bg-transparent text-white font-mono text-xs resize-none focus:outline-none leading-relaxed border-none whitespace-pre"
                spellCheck={false}
                autoFocus
              />
            </div>
          ) : (
            /* Full-width clean code editor view with content-sized preview block */
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 min-w-0 bg-[#18181c]">
              {/* The code preview block - strictly as long as the content in it */}
              <div className="min-w-full w-fit h-fit flex">
                {/* Line numbers gutter */}
                <div className="select-none py-3 pl-3 pr-4 text-right text-neutral-500 bg-[#16161a] border-r border-[#24242a] shrink-0 font-mono text-xs leading-relaxed h-fit">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveLine(i + 1)}
                      className={`cursor-pointer hover:text-white transition-colors ${
                        activeLine === i + 1 ? 'text-white font-bold' : ''
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Code lines with active line highlight */}
                <pre className="py-3 px-4 text-neutral-200 leading-relaxed font-mono text-xs whitespace-pre h-fit flex-1 overflow-visible">
                  <code>
                    {lines.map((line, idx) => {
                      const lineNum = idx + 1;
                      const isCurLine = lineNum === activeLine;
                      const isTruncLine =
                        file.hasTruncationWarning &&
                        /(?:\.\.\.|…|rest of (?:the )?code|existing code|remains the same)/i.test(line);

                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveLine(lineNum)}
                          className={`cursor-pointer transition-colors ${
                            isCurLine
                              ? 'bg-[#23232c] text-white -mx-4 px-4 border-l-2 border-l-[#3b82f6]'
                              : isTruncLine
                              ? 'bg-amber-950/40 text-amber-200 border-l-2 border-l-amber-400 pl-1'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <CodeHighlighter
                            line={line}
                            language={file.language}
                            isTruncationWarning={Boolean(isTruncLine)}
                          />
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
