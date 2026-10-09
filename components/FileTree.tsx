'use client';

import React, { useState, useMemo } from 'react';
import { ProjectFile } from '@/lib/parser';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  AlertTriangle,
  AlertOctagon,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  FolderTree,
  Code2,
  FileJson,
  GitFork,
  KeyRound,
  File,
  FileUp,
  FolderUp,
  Image as ImageIcon,
  Film,
  Music,
} from 'lucide-react';

interface FileTreeProps {
  files: Record<string, ProjectFile>;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onUploadTranscript?: () => void;
  onAppendFiles?: (files: FileList | File[]) => void;
  projectTitle?: string;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  file?: ProjectFile;
  children: Record<string, TreeNode>;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedPath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onUploadTranscript,
  onAppendFiles,
  projectTitle,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  // Hidden upload inputs for appending files/folders to the existing project
  const appendFilesInputRef = React.useRef<HTMLInputElement>(null);
  const appendFolderInputRef = React.useRef<HTMLInputElement>(null);

  // Build tree data structure from file paths
  const treeRoot = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      fullPath: '',
      isDir: true,
      children: {},
    };

    const fileEntries = Object.entries(files);

    for (const [path, file] of fileEntries) {
      const segments = path.split('/');
      let current = root;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isLast = i === segments.length - 1;
        const currentPath = segments.slice(0, i + 1).join('/');

        if (isLast) {
          current.children[seg] = {
            name: seg,
            fullPath: path,
            isDir: false,
            file: file,
            children: {},
          };
        } else {
          if (!current.children[seg]) {
            current.children[seg] = {
              name: seg,
              fullPath: currentPath,
              isDir: true,
              children: {},
            };
          }
          current = current.children[seg];
        }
      }
    }

    return root;
  }, [files]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [dirPath]: prev[dirPath] === undefined ? false : !prev[dirPath],
    }));
  };

  const isDirExpanded = (dirPath: string) => {
    return expandedDirs[dirPath] === undefined ? true : expandedDirs[dirPath];
  };

  const collapseAll = () => {
    const allDirs: Record<string, boolean> = {};
    const traverse = (node: TreeNode) => {
      if (node.isDir && node.fullPath) {
        allDirs[node.fullPath] = false;
      }
      Object.values(node.children).forEach(traverse);
    };
    traverse(treeRoot);
    setExpandedDirs(allDirs);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onCreateFile(newFilePath.trim());
    setNewFilePath('');
    setIsCreatingFile(false);
  };

  const renderFileIcon = (name: string, isMissing?: boolean, isTruncated?: boolean) => {
    if (isMissing) {
      return <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (isTruncated) {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }

    const lower = name.toLowerCase();
    if (lower === '.gitignore') {
      return (
        <span className="w-3.5 h-3.5 flex items-center justify-center text-[#f34f29] font-bold text-[10px] shrink-0">
          ◆
        </span>
      );
    }
    if (lower.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-[#519aba] shrink-0" />;
    }
    if (lower.startsWith('.env')) {
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

  const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
    if (node.name === 'root') {
      const childEntries = Object.entries(node.children);
      childEntries.sort(([nameA, a], [nameB, b]) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return nameA.localeCompare(nameB);
      });

      return (
        <div className="space-y-0.5">
          {childEntries.map(([, child]) => renderNode(child, 0))}
        </div>
      );
    }

    if (node.isDir) {
      const isExpanded = isDirExpanded(node.fullPath);
      const childEntries = Object.entries(node.children);
      childEntries.sort(([nameA, a], [nameB, b]) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return nameA.localeCompare(nameB);
      });

      return (
        <div key={node.fullPath} className="select-none">
          <div
            onClick={() => toggleDir(node.fullPath)}
            className="flex items-center gap-1.5 mx-1.5 px-2 py-1 text-xs cursor-pointer hover:bg-white/5 rounded-md transition-colors text-neutral-300 hover:text-white"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
            <span className="truncate font-mono">{node.name}</span>
          </div>

          {isExpanded && (
            <div className="space-y-0.5">
              {childEntries.map(([, child]) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf file node
    const file = node.file!;
    const isSelected = selectedPath === file.path;

    return (
      <div
        key={node.fullPath}
        onClick={() => onSelectFile(file.path)}
        className={`mx-1.5 px-2 py-1 text-xs cursor-pointer group transition-colors rounded-md flex items-center justify-between ${
          isSelected
            ? 'bg-[#252530] text-white font-medium ring-1 ring-white/10'
            : 'text-neutral-300 hover:bg-white/5 hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {renderFileIcon(node.name, file.isMissingContent, file.hasTruncationWarning)}
          <span className={`truncate font-mono ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
            {node.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[10px] ml-1 font-mono">
          {file.isPatched && (
            <span className="text-[#e2b340] font-bold text-[10px]">M</span>
          )}
          {file.isMissingContent && (
            <span className="text-[9px] text-amber-400 border border-amber-400/40 px-1 rounded">
              MISSING
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.path);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white transition-opacity rounded hover:bg-neutral-800"
            title="Delete file"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const totalFiles = Object.keys(files).length;
  const rootFolderName = projectTitle || 'Project';

  return (
    <div className="flex flex-col h-full bg-[#16161a] select-none overflow-hidden font-mono text-xs">
      {/* 1. VS Code Explorer Section Header */}
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#24242a] shrink-0 bg-[#16161a]">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
            Explorer
          </span>
          <span className="text-[10px] text-neutral-500">
            ({totalFiles})
          </span>
        </div>

        {/* Action icons like VS Code */}
        <div className="flex items-center gap-0.5 text-neutral-400">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapseAll}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Collapse Folders"
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => appendFilesInputRef.current?.click()}
            className="h-6 w-6 flex items-center justify-center hover:text-emerald-400 hover:bg-white/10 rounded transition-colors cursor-pointer text-neutral-400"
            title="Upload Files to this Project (Appends files)"
          >
            <FileUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => appendFolderInputRef.current?.click()}
            className="h-6 w-6 flex items-center justify-center hover:text-amber-400 hover:bg-white/10 rounded transition-colors cursor-pointer text-neutral-400"
            title="Upload Folder to this Project (Appends folder tree)"
          >
            <FolderUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden inputs for appending files / folders directly into current project */}
      <input
        ref={appendFilesInputRef}
        type="file"
        multiple
        accept="*/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && onAppendFiles) {
            onAppendFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={appendFolderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in modern browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && onAppendFiles) {
            onAppendFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* 2. Project Workspace Root Row */}
      <div className="px-3 py-1.5 border-b border-[#222228] flex items-center gap-1.5 text-xs text-neutral-300 font-semibold truncate bg-[#141418]/60 shrink-0">
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <FolderOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="truncate text-white">
          {rootFolderName}
        </span>
      </div>

      {/* Manual File Creation Prompt */}
      {isCreatingFile && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-2.5 bg-[#18181e] border-b border-neutral-700 text-xs shrink-0 space-y-1.5"
        >
          <div className="text-[10px] uppercase text-neutral-400 font-bold">
            New File Path:
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="e.g. src/utils/helpers.ts"
              className="flex-1 h-7 bg-black border border-neutral-700 px-2 text-xs text-white font-mono rounded focus:outline-none focus:border-white"
              autoFocus
            />
            <button
              type="submit"
              className="h-7 bg-white text-black px-2.5 text-xs font-semibold uppercase hover:bg-neutral-200 rounded cursor-pointer transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="h-7 w-7 border border-neutral-800 text-neutral-400 hover:text-white rounded flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* 3. Independent Scrollable Tree Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-1.5 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {totalFiles === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500">
            No files extracted. Paste code in the source editor or upload a project.
          </div>
        ) : (
          renderNode(treeRoot)
        )}
      </div>
    </div>
  );
};
