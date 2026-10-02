'use client';

import React, { useState } from 'react';
import { DiagnosticIssue, ExtractedCodeBlock, ProjectFile } from '@/lib/parser';
import { ProjectCheckpoint } from '@/lib/checkpoints';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Network,
  RotateCcw,
  Plus,
  Code2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal as TerminalIcon,
  Trash,
  Radio,
  MoreHorizontal,
  Split,
} from 'lucide-react';

interface VSCodeBottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticIssue[];
  files: Record<string, ProjectFile>;
  codeBlocks: ExtractedCodeBlock[];
  treeDeclaredPaths: string[];
  rootPrefix: string | null;
  checkpoints: ProjectCheckpoint[];
  activeCheckpoint: ProjectCheckpoint | null;
  onSelectFile: (path: string) => void;
  onAssignBlockPath: (blockIndex: number, targetPath: string) => void;
  onRestoreCheckpoint: (cp: ProjectCheckpoint) => void;
  onSetActiveBaseline: (cp: ProjectCheckpoint | null) => void;
  onOpenCheckpointModal: () => void;
  onJumpToSource?: (line: number) => void;
}

export const VSCodeBottomPanel: React.FC<VSCodeBottomPanelProps> = ({
  isOpen,
  onClose,
  diagnostics,
  files,
  codeBlocks,
  treeDeclaredPaths,
  rootPrefix,
  checkpoints,
  activeCheckpoint,
  onSelectFile,
  onAssignBlockPath,
  onRestoreCheckpoint,
  onSetActiveBaseline,
  onOpenCheckpointModal,
  onJumpToSource,
}) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'output' | 'terminal' | 'ports' | 'tree' | 'checkpoints'>('terminal');
  const [manualPaths, setManualPaths] = useState<Record<number, string>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({});
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [problemFilter, setProblemFilter] = useState<'all' | 'unparsed' | 'errors' | 'warnings'>('all');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    {
      type: 'input',
      text: `init project: ${rootPrefix || 'my-project'}`,
    },
    {
      type: 'output',
      text: 'iLoveFree environment initialized. Ready for commands.',
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  if (!isOpen) return null;

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  // Find all unparsed / unresolved code blocks
  const unparsedBlocks = codeBlocks.filter((b) => b.status === 'unresolved' || !b.resolvedPath);

  // Missing files declared in structure tree that need code
  const missingTreePaths = treeDeclaredPaths.filter(
    (p) => !files[p] || files[p].isMissingContent
  );

  const handleAssignPath = (blockIndex: number, customPath?: string) => {
    const path = (customPath || manualPaths[blockIndex] || '').trim();
    if (path) {
      onAssignBlockPath(blockIndex, path);
    }
  };

  const handleCopyCode = (blockIndex: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockIndex(blockIndex);
    setTimeout(() => setCopiedBlockIndex(null), 2000);
  };

  const toggleExpandBlock = (blockIndex: number) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockIndex]: !prev[blockIndex],
    }));
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newEntries = [...terminalHistory, { type: 'input' as const, text: cmd }];

    if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      const fileList = Object.keys(files);
      newEntries.push({
        type: 'output',
        text: fileList.length > 0 ? fileList.join('   ') : 'No files extracted yet.',
      });
    } else if (cmd.startsWith('cat ')) {
      const target = cmd.slice(4).trim();
      const matched = files[target];
      if (matched) {
        newEntries.push({
          type: 'output',
          text: matched.content,
        });
      } else {
        newEntries.push({
          type: 'output',
          text: `cat: ${target}: No such file in project workspace`,
        });
      }
    } else if (cmd === 'pwd') {
      newEntries.push({
        type: 'output',
        text: `/workspace/${rootPrefix || 'project'}`,
      });
    } else if (cmd.includes('git status')) {
      newEntries.push({
        type: 'output',
        text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\tmodified:   README.md\n\nno changes added to commit (use "git add" to track)`,
      });
    } else if (cmd === 'help') {
      newEntries.push({
        type: 'output',
        text: 'Available built-in commands: ls, cat <file>, pwd, git status, clear, help',
      });
    } else {
      newEntries.push({
        type: 'output',
        text: `Executed: ${cmd} (status: 0)`,
      });
    }

    setTerminalHistory(newEntries);
    setTerminalInput('');
  };

  // Filter items in the Problems tab
  const filteredDiagnostics = diagnostics.filter((d) => {
    if (problemFilter === 'all') return true;
    if (problemFilter === 'unparsed') {
      return (
        d.id.includes('unresolved') ||
        (d.blockIndex !== undefined &&
          codeBlocks.some((b) => b.index === d.blockIndex && (b.status === 'unresolved' || !b.resolvedPath)))
      );
    }
    if (problemFilter === 'errors') return d.severity === 'error';
    if (problemFilter === 'warnings') return d.severity === 'warning';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#18181c] text-xs font-mono select-none overflow-hidden">
      {/* 1. Panel Tab Header matching Screenshot */}
      <div className="h-9 border-b border-[#24242a] bg-[#141418] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {/* PROBLEMS Tab */}
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'problems'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Problems</span>
            {unparsedBlocks.length > 0 ? (
              <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                {unparsedBlocks.length}
              </span>
            ) : errors.length > 0 ? (
              <span className="bg-white text-black px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                {errors.length}
              </span>
            ) : warnings.length > 0 ? (
              <span className="border border-neutral-600 px-1 text-[9px] text-neutral-300 rounded-full">
                {warnings.length}
              </span>
            ) : (
              <span className="text-neutral-500 text-[9px]">0</span>
            )}
          </button>

          {/* OUTPUT Tab */}
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer rounded-md ${
              activeTab === 'output'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Output</span>
          </button>

          {/* TERMINAL Tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'terminal'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Terminal</span>
          </button>

          {/* PORTS Tab */}
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'ports'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Ports</span>
            <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 text-[9px] rounded-full">
              4
            </span>
          </button>

          {/* TREE Tab */}
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'tree'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Tree</span>
            <span className="text-neutral-500 text-[9px]">{treeDeclaredPaths.length}</span>
          </button>

          {/* CHECKPOINTS Tab */}
          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'checkpoints'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Checkpoints</span>
            <span className="text-neutral-500 text-[9px]">{checkpoints.length}</span>
          </button>
        </div>

        {/* Right Header Terminal Controls matching screenshot */}
        <div className="flex items-center gap-1 text-neutral-400 text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#1e1e24] hover:bg-[#25252e] border border-[#2d2d36] rounded text-[11px] text-neutral-300 cursor-pointer">
            <TerminalIcon className="w-3 h-3 text-[#e5c07b]" />
            <span className="text-white">bash</span>
            <span className="text-neutral-500">-</span>
            <span className="text-neutral-400 truncate max-w-[120px]">{rootPrefix || 'project'}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
          </div>

          <button
            onClick={() => {
              setTerminalHistory((prev) => [
                ...prev,
                { type: 'output', text: `New terminal session spawned for ${rootPrefix || 'workspace'}` },
              ]);
            }}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="New Terminal"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTerminalHistory([])}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Kill Terminal / Clear"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#27272e] mx-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Close Panel (Ctrl+J)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header Filter Toolbar (for Problems) */}
      {activeTab === 'problems' && diagnostics.length > 0 && (
        <div className="h-7 border-b border-neutral-800/80 px-3 bg-[#0d0d0d] flex items-center justify-between text-[10px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Filter:</span>
            <button
              onClick={() => setProblemFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                problemFilter === 'all'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({diagnostics.length})
            </button>
            {unparsedBlocks.length > 0 && (
              <button
                onClick={() => setProblemFilter('unparsed')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  problemFilter === 'unparsed'
                    ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                <span>⚠ Unparsed Blocks ({unparsedBlocks.length})</span>
              </button>
            )}
            <button
              onClick={() => setProblemFilter('errors')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                problemFilter === 'errors'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Errors ({errors.length})
            </button>
            <button
              onClick={() => setProblemFilter('warnings')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                problemFilter === 'warnings'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Warnings ({warnings.length})
            </button>
          </div>

          <div className="text-neutral-500 hidden sm:block">
            Showing what code blocks could not be parsed with quick assign & preview
          </div>
        </div>
      )}

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0 bg-[#16161a]">
        {/* Tab 0: Terminal matching screenshot */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col h-full font-mono text-xs select-text">
            <div className="flex-1 overflow-y-auto space-y-1.5 pb-2">
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="leading-relaxed">
                  {item.type === 'input' ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#3b82f6] text-[10px]">●</span>
                      <span className="text-[#56b6c2]">dev@ilovefree</span>
                      <span className="text-white">~/workspace/{rootPrefix || 'project'}</span>
                      <span className="text-[#e5c07b]">(main)&gt;</span>
                      <span className="text-emerald-400 font-semibold">{item.text}</span>
                    </div>
                  ) : (
                    <div className="text-neutral-300 pl-4 whitespace-pre-wrap font-mono text-[11px]">
                      {item.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Active Terminal Input Row matching prompt */}
              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 pt-1">
                <span className="text-neutral-500 text-[10px]">○</span>
                <span className="text-[#56b6c2]">dev@ilovefree</span>
                <span className="text-white">~/workspace/{rootPrefix || 'project'}</span>
                <span className="text-[#e5c07b]">(main)&gt;</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type command (ls, cat <file>, git status, clear, help)..."
                  className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder:text-neutral-600"
                  autoFocus
                />
              </form>
            </div>
          </div>
        )}

        {/* Tab: Ports */}
        {activeTab === 'ports' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#24242a] pb-2 text-[11px] text-neutral-400">
              <span className="font-semibold text-white">Forwarded Ports</span>
              <span>4 ports active</span>
            </div>
            <div className="space-y-1.5">
              {[
                { port: 3000, name: 'Web Dev Server', status: 'Running', protocol: 'HTTP', address: 'localhost:3000' },
                { port: 5432, name: 'Postgres / Cloud SQL', status: 'Listening', protocol: 'TCP', address: '127.0.0.1:5432' },
                { port: 8080, name: 'Firebase Emulator', status: 'Listening', protocol: 'HTTP', address: 'localhost:8080' },
                { port: 9099, name: 'Auth Gateway', status: 'Listening', protocol: 'HTTP', address: 'localhost:9099' },
              ].map((p) => (
                <div key={p.port} className="flex items-center justify-between p-2 bg-[#121216] border border-[#222228] rounded-md text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white font-mono">{p.port}</span>
                    <span className="text-neutral-400">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-400">
                    <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800">{p.status}</span>
                    <span className="text-neutral-500 font-mono">{p.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Problems & Diagnostics */}
        {activeTab === 'problems' && (
          <div className="space-y-3">
            {diagnostics.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-white mx-auto mb-1.5" />
                <span className="text-white font-bold block mb-0.5">Zero Problems Detected</span>
                <span>All code blocks and files have been extracted and verified.</span>
              </div>
            ) : filteredDiagnostics.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs">
                No problems match the selected filter.
              </div>
            ) : (
              filteredDiagnostics.map((d) => {
                const isErr = d.severity === 'error';
                const isWarn = d.severity === 'warning';

                // Look up matching code block by blockIndex or by filePath
                let block = d.blockIndex !== undefined
                  ? codeBlocks.find((b) => b.index === d.blockIndex)
                  : null;

                if (!block && d.filePath && files[d.filePath]) {
                  const firstIdx = files[d.filePath].sourceBlockIndices[0];
                  if (firstIdx !== undefined) {
                    block = codeBlocks.find((b) => b.index === firstIdx) || null;
                  }
                }

                const isUnparsedBlock =
                  block && (!block.resolvedPath || block.status === 'unresolved');
                const isExpanded = block ? Boolean(expandedBlocks[block.index]) : false;
                const allLines = block ? block.content.split('\n') : [];
                const previewLines = isExpanded ? allLines : allLines.slice(0, 10);

                return (
                  <div
                    key={d.id}
                    className={`p-3.5 border rounded-lg transition-colors ${
                      isUnparsedBlock
                        ? 'border-red-500/50 bg-[#140b0b]'
                        : isErr
                        ? 'border-neutral-700 bg-[#121212]'
                        : isWarn
                        ? 'border-neutral-800 bg-[#0d0d0d]'
                        : 'border-neutral-900 bg-black'
                    }`}
                  >
                    {/* Problem Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {isUnparsedBlock ? (
                          <span className="p-1 bg-red-500 text-white font-bold rounded shrink-0 mt-0.5">
                            <AlertOctagon className="w-4 h-4" />
                          </span>
                        ) : isErr ? (
                          <AlertOctagon className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-xs">{d.title}</span>

                            {block && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  isUnparsedBlock
                                    ? 'bg-red-500 text-white'
                                    : 'bg-neutral-800 text-white border border-neutral-700'
                                }`}
                              >
                                CODE BLOCK #{block.index} (LINES {block.startLine}–{block.endLine})
                              </span>
                            )}

                            {block?.langTag && (
                              <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                                Language: {block.langTag}
                              </span>
                            )}

                            {d.filePath && (
                              <span className="border border-neutral-700 text-neutral-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {d.filePath}
                              </span>
                            )}
                          </div>

                          <p className="text-neutral-300 text-[11px] mt-1.5 leading-relaxed">
                            {d.message}
                          </p>

                          {d.suggestedAction && (
                            <p className="text-neutral-400 text-[10px] mt-1">
                              <strong className="text-white">Suggested:</strong> {d.suggestedAction}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {block && onJumpToSource && (
                          <button
                            onClick={() => onJumpToSource(block.startLine)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-neutral-700 text-[10px] text-white rounded transition-colors cursor-pointer"
                            title="Jump to this code block in the Source Transcript"
                          >
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                            <span>Jump to Line {block.startLine}</span>
                          </button>
                        )}

                        {d.filePath && files[d.filePath] && (
                          <button
                            onClick={() => onSelectFile(d.filePath!)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white text-black font-bold text-[10px] rounded hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <span>Open File</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exact Code Block Snippet Preview Box */}
                    {block && (
                      <div className="mt-3 bg-black border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="px-3 py-1.5 bg-[#161616] border-b border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1.5 text-white font-bold">
                            <Code2 className="w-3.5 h-3.5 text-white" />
                            <span>
                              {isUnparsedBlock
                                ? `Unparsed Code Block #${block.index} Preview`
                                : `Code Block #${block.index} Content`}
                              {' '}(Lines {block.startLine}–{block.endLine})
                            </span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Copy Snippet Button */}
                            <button
                              onClick={() => handleCopyCode(block.index, block.content)}
                              className="flex items-center gap-1 px-2 py-0.5 bg-[#202020] hover:bg-[#282828] text-white rounded transition-colors cursor-pointer"
                              title="Copy code snippet to clipboard"
                            >
                              {copiedBlockIndex === block.index ? (
                                <>
                                  <Check className="w-3 h-3 text-white" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-400" />
                                  <span>Copy Snippet</span>
                                </>
                              )}
                            </button>

                            {/* Expand / Collapse Toggle */}
                            {allLines.length > 10 && (
                              <button
                                onClick={() => toggleExpandBlock(block.index)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-[#202020] hover:bg-[#282828] text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Collapse</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Show All {allLines.length} Lines</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Raw code content with exact transcript line numbers */}
                        <div className="p-2.5 text-[11px] font-mono overflow-x-auto text-neutral-200 bg-[#050505] max-h-56">
                          {previewLines.map((line, idx) => (
                            <div key={idx} className="flex gap-3 hover:bg-neutral-900/60 py-0.5 px-1 rounded">
                              <span className="select-none text-neutral-600 text-right w-8 shrink-0 text-[10px]">
                                {block.startLine + idx}
                              </span>
                              <span className="whitespace-pre font-mono">{line || ' '}</span>
                            </div>
                          ))}
                          {!isExpanded && allLines.length > 10 && (
                            <div
                              onClick={() => toggleExpandBlock(block.index)}
                              className="text-neutral-500 text-[10px] pl-11 py-1 italic hover:text-white cursor-pointer"
                            >
                              ... and {allLines.length - 10} more lines (click to expand) ...
                            </div>
                          )}
                        </div>

                        {/* Instant Quick-Fix Filepath Assignment Input */}
                        {!block.resolvedPath && (
                          <div className="p-3 bg-[#111111] border-t border-neutral-800 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-[11px] text-white font-bold shrink-0 flex items-center gap-1">
                                <span>Assign Destination File:</span>
                              </span>
                              <div className="flex-1 flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. src/utils/helpers.ts or web/static/app.css"
                                  value={manualPaths[block.index] || ''}
                                  onChange={(e) =>
                                    setManualPaths({
                                      ...manualPaths,
                                      [block.index]: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAssignPath(block.index);
                                    }
                                  }}
                                  className="flex-1 bg-black border border-neutral-700 px-3 py-1.5 text-xs text-white font-mono rounded-md focus:outline-none focus:border-white placeholder:text-neutral-600"
                                />
                                <button
                                  onClick={() => handleAssignPath(block.index)}
                                  disabled={!manualPaths[block.index]?.trim()}
                                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-colors shrink-0 ${
                                    manualPaths[block.index]?.trim()
                                      ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                  }`}
                                >
                                  Assign & Parse
                                </button>
                              </div>
                            </div>

                            {/* Structure Tree Suggestions */}
                            {missingTreePaths.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                                <span className="text-neutral-500">Tree suggestions:</span>
                                {missingTreePaths.slice(0, 5).map((tp) => (
                                  <button
                                    key={tp}
                                    onClick={() => {
                                      setManualPaths({
                                        ...manualPaths,
                                        [block.index]: tp,
                                      });
                                      handleAssignPath(block.index, tp);
                                    }}
                                    className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded transition-colors cursor-pointer"
                                    title={`Click to instantly assign block #${block.index} to ${tp}`}
                                  >
                                    + {tp}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Parser Output Log */}
        {activeTab === 'output' && (
          <div className="space-y-2 text-neutral-300 font-mono text-[11px]">
            <div className="text-white font-bold border-b border-neutral-800 pb-1">
              [DETERMINISTIC_PARSER_CORE] Execution Statistics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">TOTAL BLOCKS</div>
                <div className="text-base font-bold text-white">{codeBlocks.length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">RESOLVED FILES</div>
                <div className="text-base font-bold text-white">{Object.keys(files).length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">UNPARSED BLOCKS</div>
                <div className="text-base font-bold text-red-400">{unparsedBlocks.length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">COMMON ROOT</div>
                <div className="text-xs font-bold text-white truncate">{rootPrefix || 'None'}</div>
              </div>
            </div>

            <div className="mt-3 bg-black border border-neutral-800 p-3 rounded-md text-[10px] space-y-1 text-neutral-400">
              <div>→ Scanned {codeBlocks.length} markdown code block fences across document</div>
              <div>→ Extracted {Object.keys(files).length} project files with integrity hash checks</div>
              <div>→ Diagnostic issue count: {diagnostics.length} ({errors.length} errors, {warnings.length} warnings)</div>
              <div>→ Incremental checkpoint baseline: {activeCheckpoint?.name || 'Active Workspace'}</div>
            </div>
          </div>
        )}

        {/* Tab 3: Structure Tree Matcher */}
        {activeTab === 'tree' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <span className="font-bold text-white uppercase text-[11px]">
                  Structure Tree Reconciliation
                </span>
                <p className="text-[10px] text-neutral-400">
                  Verifies that every file declared in the project tree has code.
                </p>
              </div>
              <span className="text-[10px] text-neutral-500">
                {treeDeclaredPaths.length} declared in tree
              </span>
            </div>

            {treeDeclaredPaths.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs">
                No ASCII structure tree was found in the source transcript.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {treeDeclaredPaths.map((tp) => {
                  const hasFile = Boolean(files[tp] && !files[tp].isMissingContent);
                  return (
                    <div
                      key={tp}
                      className="flex items-center justify-between p-2 bg-[#0e0e0e] border border-neutral-800 rounded-md text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        {hasFile ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-white font-mono">{tp}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          hasFile
                            ? 'bg-neutral-800 text-white'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {hasFile ? 'CODE PROVIDED' : 'MISSING CONTENT'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Checkpoints & Patches */}
        {activeTab === 'checkpoints' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <span className="font-bold text-white uppercase text-[11px]">
                  Project Checkpoints & Patches
                </span>
                <p className="text-[10px] text-neutral-400">
                  Save snapshot baselines to apply small incremental updates.
                </p>
              </div>
              <button
                onClick={onOpenCheckpointModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-white text-black font-bold uppercase text-[10px] rounded hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Save New Checkpoint</span>
              </button>
            </div>

            {checkpoints.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs">
                No checkpoints saved yet. Click &quot;Save New Checkpoint&quot; to bookmark the current state.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {checkpoints.map((cp) => {
                  const isActive = activeCheckpoint?.id === cp.id;
                  return (
                    <div
                      key={cp.id}
                      className={`p-2.5 rounded-md border flex items-center justify-between text-[11px] ${
                        isActive
                          ? 'border-white bg-[#161616]'
                          : 'border-neutral-800 bg-[#0e0e0e]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-white" />
                          <span className="font-bold text-white">{cp.name}</span>
                          {isActive && (
                            <span className="text-[9px] bg-white text-black px-1 font-bold rounded">
                              ACTIVE BASELINE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {cp.fileCount} files • {new Date(cp.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRestoreCheckpoint(cp)}
                          className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] border border-neutral-700 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => onSetActiveBaseline(isActive ? null : cp)}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] border border-neutral-700 cursor-pointer"
                        >
                          {isActive ? 'Clear Active' : 'Set as Patch Baseline'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
