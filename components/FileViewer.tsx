'use client';

import React, { useState, useEffect } from 'react';
import { ProjectFile } from '@/lib/parser';
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
  Split,
  MoreHorizontal,
  Code2,
  FileJson,
  KeyRound,
  File,
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
  const [, setSelectedBlockIdx] = useState<number | null>(
    file?.sourceBlockIndices[0] || null
  );

  const [prevFile, setPrevFile] = useState(file);
  if (file !== prevFile) {
    setPrevFile(file);
    setEditContent(file?.content || '');
    setRenameValue(file?.path || '');
    setIsEditing(false);
  }

  // Keyboard shortcut Ctrl+S / Cmd+S to save edits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && file) {
          onUpdateContent(file.path, editContent);
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
    return <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
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
    onUpdateContent(file.path, editContent);
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
  const lines = (isEditing ? editContent : file.content).split('\n');

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

        {/* Tab Bar Right Controls matching screenshot */}
        <div className="flex items-center gap-1 px-2 shrink-0 text-neutral-400 text-xs">
          <button
            className="h-6 px-1.5 flex items-center gap-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer text-[11px]"
            title="Split Editor"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-[1px] bg-[#27272e] mx-1" />
          <span className="text-[11px] text-neutral-400 cursor-pointer hover:text-white px-1">
            Text Editor ▾
          </span>
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
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Saved!
            </span>
          )}

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

          <button
            onClick={handleCopy}
            className="h-6 flex items-center gap-1 px-2 text-xs text-neutral-300 hover:bg-white/10 hover:text-white rounded transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
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

      {/* 3. Independent Scrollable Code Editor Area with Line Highlight & Minimap */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-[#18181c] flex relative">
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
          <div className="flex flex-1 min-w-full">
            {/* Line numbers gutter */}
            <div className="select-none py-3 pl-3 pr-4 text-right text-neutral-500 bg-[#16161a] border-r border-[#24242a] shrink-0 font-mono text-xs leading-relaxed">
              {lines.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveLine(i + 1)}
                  className={`cursor-pointer ${activeLine === i + 1 ? 'text-white font-bold' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code lines with active line highlight */}
            <pre className="py-3 px-4 text-neutral-200 leading-relaxed overflow-x-auto flex-1 font-mono text-xs whitespace-pre">
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
                      {line || '\n'}
                    </div>
                  );
                })}
              </code>
            </pre>

            {/* Minimap preview simulation matching VS Code */}
            <div className="w-14 border-l border-[#24242a] bg-[#141418]/60 hidden lg:flex flex-col py-3 px-1 select-none shrink-0 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
              {lines.slice(0, 50).map((l, i) => (
                <div
                  key={i}
                  className="h-[2px] mb-[2px] rounded-xs bg-neutral-600"
                  style={{
                    width: `${Math.min(100, Math.max(10, l.trim().length * 2))}%`,
                    opacity: l.trim().length > 0 ? 0.7 : 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
